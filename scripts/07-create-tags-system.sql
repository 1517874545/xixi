-- Create tags system for better content discovery
-- 标签系统：提升内容可发现性

-- 1. 创建标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建设计-标签关联表
CREATE TABLE IF NOT EXISTS design_tags (
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (design_id, tag_id)
);

-- 3. 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_design_tags_design_id ON design_tags(design_id);
CREATE INDEX IF NOT EXISTS idx_design_tags_tag_id ON design_tags(tag_id);

-- 4. 创建复合索引用于常见查询
CREATE INDEX IF NOT EXISTS idx_designs_public_created ON designs(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_designs_user_created ON designs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_type_created ON designs(design_type, created_at DESC);

-- 5. 添加全文搜索索引（用于标题搜索）
CREATE INDEX IF NOT EXISTS idx_designs_title_search 
  ON designs USING gin(to_tsvector('simple', title));

-- 6. 点赞和评论索引优化（如果表存在）
-- 注意：只为已存在的表创建索引
DO $$
BEGIN
  -- 为 likes 表创建索引（如果表存在）
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
    CREATE INDEX IF NOT EXISTS idx_likes_design_created ON likes(design_id, created_at DESC);
    RAISE NOTICE '✅ 已为 likes 表创建索引';
  ELSE
    RAISE NOTICE '⚠️  likes 表不存在，跳过索引创建';
  END IF;

  -- 为 comments 表创建索引（如果表存在）
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE INDEX IF NOT EXISTS idx_comments_design_created ON comments(design_id, created_at DESC);
    
    -- 只有当 parent_id 列存在时才创建索引
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'parent_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
      RAISE NOTICE '✅ 已为 comments 表创建索引';
    ELSE
      RAISE NOTICE '⚠️  comments 表没有 parent_id 列，跳过该索引';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  comments 表不存在，跳过索引创建';
  END IF;
END $$;

-- 7. 关注系统索引优化（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id, created_at DESC);
    RAISE NOTICE '✅ 已为 follows 表创建索引';
  ELSE
    RAISE NOTICE '⚠️  follows 表不存在，跳过索引创建';
  END IF;
END $$;

-- 8. 启用 RLS (Row Level Security)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_tags ENABLE ROW LEVEL SECURITY;

-- 9. 标签表 RLS 策略
-- 所有人可以查看标签
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- 只有系统可以创建标签（通过 API 自动创建）
CREATE POLICY "Tags can be created through API"
  ON tags FOR INSERT
  WITH CHECK (true);

-- 系统可以更新标签使用次数
CREATE POLICY "Tags can be updated through API"
  ON tags FOR UPDATE
  USING (true);

-- 10. 设计-标签关联表 RLS 策略
-- 所有人可以查看标签关联
CREATE POLICY "Design tags are viewable by everyone"
  ON design_tags FOR SELECT
  USING (true);

-- 作品作者可以为自己的作品添加标签
CREATE POLICY "Users can tag their own designs"
  ON design_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM designs 
      WHERE designs.id = design_tags.design_id 
      AND designs.user_id = auth.uid()
    )
  );

-- 作品作者可以删除自己作品的标签
CREATE POLICY "Users can remove tags from their own designs"
  ON design_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM designs 
      WHERE designs.id = design_tags.design_id 
      AND designs.user_id = auth.uid()
    )
  );

-- 11. 创建触发器：自动更新标签使用次数
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON design_tags;
CREATE TRIGGER trigger_update_tag_usage
  AFTER INSERT OR DELETE ON design_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

-- 12. 创建函数：获取热门标签
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.usage_count
  FROM tags t
  WHERE t.usage_count > 0
  ORDER BY t.usage_count DESC, t.name ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 13. 创建函数：搜索标签（自动补全）
CREATE OR REPLACE FUNCTION search_tags(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.usage_count
  FROM tags t
  WHERE t.name ILIKE search_query || '%'
  ORDER BY t.usage_count DESC, t.name ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 14. 创建函数：获取作品的标签
CREATE OR REPLACE FUNCTION get_design_tags(design_uuid UUID)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name
  FROM tags t
  INNER JOIN design_tags dt ON dt.tag_id = t.id
  WHERE dt.design_id = design_uuid
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;

-- 15. 创建视图：带标签的作品（方便查询）
CREATE OR REPLACE VIEW designs_with_tags AS
SELECT 
  d.*,
  COALESCE(
    array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
    '{}'::VARCHAR[]
  ) as tags
FROM designs d
LEFT JOIN design_tags dt ON d.id = dt.design_id
LEFT JOIN tags t ON dt.tag_id = t.id
GROUP BY d.id;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 标签系统创建完成！';
  RAISE NOTICE '- 已创建 tags 表用于存储标签';
  RAISE NOTICE '- 已创建 design_tags 表用于作品-标签关联';
  RAISE NOTICE '- 已创建性能优化索引';
  RAISE NOTICE '- 已创建全文搜索索引';
  RAISE NOTICE '- 已配置 RLS 安全策略';
  RAISE NOTICE '- 已创建触发器自动更新标签使用次数';
  RAISE NOTICE '- 已创建辅助函数和视图';
END $$;

