-- 修复脚本：处理已存在的策略
-- 这个脚本检查策略是否存在，如果存在则跳过创建

-- 检查并创建组件表的策略（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'components' AND policyname = 'Components are viewable by everyone') THEN
        CREATE POLICY "Components are viewable by everyone"
        ON components FOR SELECT
        USING (true);
    END IF;
END $$;

-- 检查并创建设计表的策略（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designs' AND policyname = 'Users can view their own designs') THEN
        CREATE POLICY "Users can view their own designs"
        ON designs FOR SELECT
        USING (auth.uid() = user_id OR is_public = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designs' AND policyname = 'Users can create their own designs') THEN
        CREATE POLICY "Users can create their own designs"
        ON designs FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designs' AND policyname = 'Users can update their own designs') THEN
        CREATE POLICY "Users can update their own designs"
        ON designs FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designs' AND policyname = 'Users can delete their own designs') THEN
        CREATE POLICY "Users can delete their own designs"
        ON designs FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 检查并创建点赞表的策略（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Likes are viewable by everyone') THEN
        CREATE POLICY "Likes are viewable by everyone"
        ON likes FOR SELECT
        USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can create their own likes') THEN
        CREATE POLICY "Users can create their own likes"
        ON likes FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can delete their own likes') THEN
        CREATE POLICY "Users can delete their own likes"
        ON likes FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 检查并创建评论表的策略（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comments are viewable by everyone') THEN
        CREATE POLICY "Comments are viewable by everyone"
        ON comments FOR SELECT
        USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can create their own comments') THEN
        CREATE POLICY "Users can create their own comments"
        ON comments FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
        CREATE POLICY "Users can update their own comments"
        ON comments FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
        CREATE POLICY "Users can delete their own comments"
        ON comments FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 检查并创建关注表的策略（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Follows are viewable by everyone') THEN
        CREATE POLICY "Follows are viewable by everyone"
        ON follows FOR SELECT
        USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can create their own follows') THEN
        CREATE POLICY "Users can create their own follows"
        ON follows FOR INSERT
        WITH CHECK (auth.uid() = follower_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can delete their own follows') THEN
        CREATE POLICY "Users can delete their own follows"
        ON follows FOR DELETE
        USING (auth.uid() = follower_id);
    END IF;
END $$;