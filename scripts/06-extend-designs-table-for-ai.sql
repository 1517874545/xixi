-- 扩展designs表以支持AI生成的图片
-- 添加设计类型字段
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS design_type VARCHAR(20) DEFAULT 'svg' 
CHECK (design_type IN ('svg', 'ai_image'));

-- 添加图片URL字段（用于AI生成的图片）
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 添加AI生成元数据（存储提示词等）
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_designs_type ON designs(design_type);
CREATE INDEX IF NOT EXISTS idx_designs_image_url ON designs(image_url) WHERE image_url IS NOT NULL;

-- 更新现有数据：将design_type设置为'svg'（如果还没有设置）
UPDATE designs 
SET design_type = 'svg' 
WHERE design_type IS NULL;

