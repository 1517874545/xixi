-- 第一步：创建users表（如果不存在）
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 第二步：插入示例用户数据
INSERT INTO public.users (id, email, username, avatar_url) VALUES
    ('80de6d8c-e149-49a5-9359-412efb0d85ae', 'system@example.com', 'system_user', 'https://example.com/system.jpg'),
    ('11111111-1111-1111-1111-111111111111', 'demo@example.com', 'demo_user', 'https://example.com/avatar1.jpg'),
    ('22222222-2222-2222-2222-222222222222', 'test@example.com', 'test_user', 'https://example.com/avatar2.jpg')
ON CONFLICT (email) DO NOTHING;

-- 第三步：检查表是否创建成功
SELECT 'users表创建成功！' as status;
SELECT COUNT(*) as user_count FROM public.users;

-- 第四步：检查现有表的外键约束（如果有的话）
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

-- 第五步：如果外键约束存在但有问题，先删除它们
DO $$ 
BEGIN
    -- 尝试删除可能存在的有问题的外键约束
    EXECUTE 'ALTER TABLE public.designs DROP CONSTRAINT IF EXISTS fk_designs_user_id';
    EXECUTE 'ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS fk_likes_user_id';
    EXECUTE 'ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS fk_comments_user_id';
    
    -- 尝试删除任何其他可能存在的users表外键约束
    EXECUTE 'ALTER TABLE public.designs DROP CONSTRAINT IF EXISTS designs_user_id_fkey';
    EXECUTE 'ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey';
    EXECUTE 'ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey';
EXCEPTION
    WHEN OTHERS THEN
        -- 如果删除失败，继续执行
        NULL;
END $$;

-- 第六步：安全地添加外键约束
DO $$ 
BEGIN
    -- 为designs表添加user_id外键
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_designs_user_id'
    ) THEN
        ALTER TABLE public.designs 
        ADD CONSTRAINT fk_designs_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE SET NULL;
    END IF;

    -- 为likes表添加user_id外键
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_likes_user_id'
    ) THEN
        ALTER TABLE public.likes 
        ADD CONSTRAINT fk_likes_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE CASCADE;
    END IF;

    -- 为comments表添加user_id外键
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_comments_user_id'
    ) THEN
        ALTER TABLE public.comments 
        ADD CONSTRAINT fk_comments_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 第七步：验证修复结果
SELECT '数据库修复完成！' as final_status;

-- 检查所有表的数据完整性
SELECT 'users表数据：' as check_1;
SELECT id, email, username FROM public.users;

SELECT 'designs表用户关联检查：' as check_2;
SELECT 
    d.id as design_id, 
    d.user_id,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ 用户存在'
        ELSE '❌ 用户缺失'
    END as user_status
FROM public.designs d
LEFT JOIN public.users u ON d.user_id = u.id
WHERE d.user_id IS NOT NULL
LIMIT 10;

SELECT '外键约束状态：' as check_3;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
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