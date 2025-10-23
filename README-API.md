# PetCraft Studio - 后端API文档

## 概述

PetCraft Studio 是一个宠物插画创作平台，使用 Next.js 15 + TypeScript + Supabase 构建。本文档描述了后端API接口的使用方法。

## 技术栈

- **前端**: Next.js 15, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Supabase (PostgreSQL)
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth

## API端点

### 1. 组件相关 API

#### 获取所有组件
```http
GET /api/components
```

**响应示例**:
```json
{
  "components": [
    {
      "id": "uuid",
      "type": "body",
      "name": "Round Body",
      "svg_data": "<circle cx=\"150\" cy=\"150\" r=\"60\" fill=\"currentColor\"/>"
    }
  ]
}
```

### 2. 设计相关 API

#### 获取设计列表
```http
GET /api/designs?userId={userId}&isPublic={boolean}&limit={number}&offset={number}
```

**参数**:
- `userId` (可选): 获取特定用户的设计
- `isPublic` (可选): 获取公开设计
- `limit` (可选): 每页数量，默认20
- `offset` (可选): 偏移量，默认0

#### 获取单个设计
```http
GET /api/designs/{id}
```

#### 创建设计
```http
POST /api/designs
```

**请求体**:
```json
{
  "title": "设计标题",
  "components": {
    "body": "组件ID",
    "ears": "组件ID",
    "eyes": "组件ID",
    "nose": "组件ID",
    "mouth": "组件ID",
    "accessories": "组件ID",
    "background": "组件ID",
    "bodyColor": "#fbbf24"
  },
  "is_public": false
}
```

#### 更新设计
```http
PUT /api/designs/{id}
```

#### 删除设计
```http
DELETE /api/designs/{id}
```

### 3. 点赞相关 API

#### 切换点赞状态
```http
POST /api/likes
```

**请求体**:
```json
{
  "design_id": "设计ID"
}
```

**响应**:
```json
{
  "liked": true
}
```

#### 检查点赞状态
```http
GET /api/likes?designId={designId}
```

#### 获取用户点赞列表
```http
GET /api/likes?userId={userId}
```

### 4. 评论相关 API

#### 获取设计评论
```http
GET /api/comments?designId={designId}&limit={number}&offset={number}
```

#### 创建评论
```http
POST /api/comments
```

**请求体**:
```json
{
  "design_id": "设计ID",
  "content": "评论内容"
}
```

## 数据库结构

### 表结构

1. **components** - 组件表
   - id (UUID, 主键)
   - type (组件类型: body, ears, eyes, nose, mouth, accessories, background)
   - name (组件名称)
   - svg_data (SVG数据)
   - created_at (创建时间)

2. **designs** - 设计表
   - id (UUID, 主键)
   - user_id (用户ID, 外键)
   - title (设计标题)
   - components (JSONB, 组件配置)
   - is_public (是否公开)
   - created_at (创建时间)
   - updated_at (更新时间)

3. **likes** - 点赞表
   - id (UUID, 主键)
   - user_id (用户ID, 外键)
   - design_id (设计ID, 外键)
   - created_at (创建时间)

4. **comments** - 评论表
   - id (UUID, 主键)
   - user_id (用户ID, 外键)
   - design_id (设计ID, 外键)
   - content (评论内容)
   - created_at (创建时间)

5. **follows** - 关注表
   - id (UUID, 主键)
   - follower_id (关注者ID, 外键)
   - following_id (被关注者ID, 外键)
   - created_at (创建时间)

## 安全配置

### Row Level Security (RLS)

所有表都启用了行级安全策略：

- **components**: 所有人可读
- **designs**: 用户只能查看自己的设计或公开设计
- **likes**: 用户只能管理自己的点赞
- **comments**: 用户只能管理自己的评论
- **follows**: 用户只能管理自己的关注关系

### 环境变量

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 前端集成

### API服务层

在 `lib/api.ts` 中提供了完整的API服务：

```typescript
import { componentsApi, designsApi, likesApi, commentsApi } from '@/lib/api'

// 使用示例
const components = await componentsApi.getAll()
const designs = await designsApi.getAll({ isPublic: true })
const result = await likesApi.toggle(designId)
const comments = await commentsApi.getByDesign(designId)
```

### 组件更新

主要组件已更新为使用API：

- `LikeButton` - 使用点赞API
- `CommentSection` - 使用评论API
- `GalleryPage` - 使用设计API
- `MyDesignsPage` - 使用设计API
- `EditorPage` - 使用设计和组件API

## 部署说明

### 本地开发

1. 安装依赖：
```bash
pnpm install
```

2. 配置环境变量：
```bash
cp .env.local.example .env.local
```

3. 启动开发服务器：
```bash
pnpm dev
```

### Vercel部署

1. 在Vercel中配置环境变量
2. 连接GitHub仓库
3. 自动部署

## 注意事项

1. **认证集成**: 当前API使用占位符用户ID，需要集成Supabase Auth
2. **错误处理**: API包含完整的错误处理机制
3. **性能优化**: 包含数据库索引和查询优化
4. **安全性**: 使用RLS确保数据安全

## 下一步计划

- [ ] 集成Supabase Auth认证
- [ ] 实现用户头像上传
- [ ] 添加设计搜索功能
- [ ] 实现实时通知系统
- [ ] 添加设计导出功能