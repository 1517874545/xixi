-- 检查designs表的结构，确认是否已添加AI相关字段
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'designs'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查是否有design_type字段
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'designs' 
    AND column_name = 'design_type'
    AND table_schema = 'public'
) as has_design_type;

-- 检查是否有image_url字段
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'designs' 
    AND column_name = 'image_url'
    AND table_schema = 'public'
) as has_image_url;

-- 检查是否有ai_metadata字段
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'designs' 
    AND column_name = 'ai_metadata'
    AND table_schema = 'public'
) as has_ai_metadata;

