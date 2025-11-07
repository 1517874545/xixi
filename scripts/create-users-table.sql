-- 创建users表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为现有表添加外键约束
-- 1. 为designs表添加user_id外键
ALTER TABLE public.designs 
ADD CONSTRAINT fk_designs_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE CASCADE;

-- 2. 为likes表添加user_id外键
ALTER TABLE public.likes 
ADD CONSTRAINT fk_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE CASCADE;

-- 3. 为comments表添加user_id外键
ALTER TABLE public.comments 
ADD CONSTRAINT fk_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE CASCADE;

-- 启用RLS（行级安全）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看公开资料
CREATE POLICY "Users can view all user profiles" ON public.users
    FOR SELECT USING (true);

-- 用户只能编辑自己的资料
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 插入示例用户数据（可选）
INSERT INTO public.users (id, email, username, avatar_url) VALUES
    ('11111111-1111-1111-1111-111111111111', 'demo@example.com', 'demo_user', 'https://example.com/avatar1.jpg'),
    ('22222222-2222-2222-2222-222222222222', 'test@example.com', 'test_user', 'https://example.com/avatar2.jpg')
ON CONFLICT (email) DO NOTHING;