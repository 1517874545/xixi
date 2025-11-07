-- 第一步：检查外键约束状态
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('designs', 'likes', 'comments');

-- 第二步：检查users表中是否有数据
SELECT COUNT(*) as user_count FROM public.users;

-- 第三步：检查designs表中的user_id值
SELECT DISTINCT user_id FROM public.designs WHERE user_id IS NOT NULL;

-- 第四步：临时禁用外键约束（安全修复）
-- 先删除有问题的外键约束
ALTER TABLE public.designs DROP CONSTRAINT IF EXISTS fk_designs_user_id;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS fk_likes_user_id;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS fk_comments_user_id;

-- 第五步：确保users表存在并创建示例用户
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 第六步：插入示例用户数据
INSERT INTO public.users (id, email, username, avatar_url) VALUES
    ('80de6d8c-e149-49a5-9359-412efb0d85ae', 'system@example.com', 'system_user', 'https://example.com/system.jpg'),
    ('11111111-1111-1111-1111-111111111111', 'demo@example.com', 'demo_user', 'https://example.com/avatar1.jpg'),
    ('22222222-2222-2222-2222-222222222222', 'test@example.com', 'test_user', 'https://example.com/avatar2.jpg')
ON CONFLICT (email) DO NOTHING;

-- 第七步：重新添加外键约束
ALTER TABLE public.designs 
ADD CONSTRAINT fk_designs_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE SET NULL;

ALTER TABLE public.likes 
ADD CONSTRAINT fk_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT fk_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE CASCADE;

-- 第八步：验证修复结果
SELECT '修复完成，现在检查数据完整性...' as status;

-- 检查designs表中的user_id是否都能在users表中找到
SELECT 
    d.id as design_id, 
    d.user_id,
    CASE 
        WHEN u.id IS NOT NULL THEN '用户存在'
        ELSE '用户缺失'
    END as user_status
FROM public.designs d
LEFT JOIN public.users u ON d.user_id = u.id
WHERE d.user_id IS NOT NULL;

-- 检查likes和comments表
SELECT 
    'likes' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as valid_user_records
FROM public.likes l
LEFT JOIN public.users u ON l.user_id = u.id
UNION ALL
SELECT 
    'comments' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as valid_user_records
FROM public.comments c
LEFT JOIN public.users u ON c.user_id = u.id;