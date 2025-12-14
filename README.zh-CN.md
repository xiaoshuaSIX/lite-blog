# Lite Blog

基于角色的博客系统，支持会员内容预览功能，使用 Next.js 和 Go 构建。

[English](README.md) | [中文](README.zh-CN.md)

## 功能特性

- **基于角色的访问控制 (RBAC)**: 游客、用户、会员和管理员角色，拥有不同权限
- **内容预览**: 非会员用户可以看到会员专属内容的预览，支持智能段落截断
- **身份认证**: 基于 JWT 的认证系统，支持邮箱验证
- **多语言支持**: 中英文界面切换
- **深色模式**: 跟随系统主题自动切换
- **管理后台**: 管理文章、用户和网站设置
- **可自定义网站设置**: 配置网站名称、描述、首页内容等

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **样式**: TailwindCSS + shadcn/ui
- **主题**: next-themes
- **国际化**: 基于 React Context 的自定义实现

### 后端
- **语言**: Go
- **框架**: Gin
- **ORM**: GORM
- **数据库**: SQLite (可轻松迁移到 PostgreSQL/MySQL)
- **认证**: JWT + HttpOnly Cookie

## 快速开始

### 环境要求

- Go 1.21+
- Node.js 18+
- npm 或 yarn

### 后端配置

```bash
cd backend

# 复制配置文件
cp configs/config.example.yaml configs/config.yaml

# 编辑 config.yaml 配置（JWT 密钥、邮件配置等）

# 运行服务
go run cmd/server/main.go

# 服务运行在 http://localhost:8080
```

### 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 服务运行在 http://localhost:3000
```

## 项目结构

```
lite-blog-2.0/
├── backend/
│   ├── cmd/server/          # 应用入口
│   ├── internal/
│   │   ├── api/             # HTTP 处理器、中间件、路由
│   │   ├── config/          # 配置
│   │   ├── model/           # 数据库模型
│   │   ├── repository/      # 数据访问层
│   │   └── service/         # 业务逻辑
│   ├── pkg/                 # 共享包
│   └── configs/             # 配置文件
├── frontend/
│   ├── app/                 # Next.js 页面
│   ├── components/          # React 组件
│   ├── lib/                 # 工具和 API 客户端
│   ├── providers/           # React Context 提供者
│   └── hooks/               # 自定义 Hooks
└── docs/                    # 文档
```

## 用户角色

| 角色 | 代码 | 权限 |
|------|------|------|
| 游客 | guest | 查看文章预览 |
| 用户 | user | 查看文章预览、发表评论 |
| 会员 | member | 查看完整文章、发表评论 |
| 管理员 | admin | 所有权限 |

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/verify-email` - 验证邮箱
- `POST /api/auth/resend-verification` - 重新发送验证邮件

### 文章接口
- `GET /api/articles` - 获取已发布文章列表
- `GET /api/articles/:slug` - 根据 slug 获取文章

### 评论接口
- `GET /api/comments/article/:articleId` - 获取文章评论
- `POST /api/comments/article/:articleId` - 发表评论（需要登录）

### 设置接口
- `GET /api/settings` - 获取网站设置

### 管理接口
- `GET /api/admin/articles` - 获取所有文章
- `GET /api/admin/articles/:id` - 根据 ID 获取文章
- `POST /api/admin/articles` - 创建文章
- `PUT /api/admin/articles/:id` - 更新文章
- `DELETE /api/admin/articles/:id` - 删除文章
- `POST /api/admin/articles/:id/publish` - 发布文章
- `POST /api/admin/articles/:id/unpublish` - 取消发布文章
- `DELETE /api/admin/comments/:id` - 删除评论
- `GET /api/admin/settings` - 获取网站设置
- `PUT /api/admin/settings` - 更新网站设置

## 配置说明

### 后端配置 (config.yaml)

```yaml
server:
  port: 8080
  mode: debug

database:
  driver: sqlite
  dsn: blog.db

jwt:
  secret: your-secret-key
  expire_hours: 168

email:
  provider: ses
  from: noreply@yourdomain.com
  region: us-east-1

cors:
  allowed_origins:
    - http://localhost:3000
```

### 前端环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 创建管理员用户

注册用户后，需要手动在数据库中添加管理员角色：

```sql
-- 获取管理员角色 ID
SELECT id FROM roles WHERE code = 'admin';

-- 为用户添加管理员角色（将 user_id 替换为实际用户 ID）
INSERT INTO user_roles (user_id, role_id) VALUES (1, 4);
```

## 开发指南

### 后端开发

```bash
cd backend
go run cmd/server/main.go
```

### 前端开发

```bash
cd frontend
npm run dev
```

### 生产构建

后端：
```bash
cd backend
go build -o bin/server cmd/server/main.go
```

前端：
```bash
cd frontend
npm run build
npm start
```

## Docker 部署

项目提供单一 Docker 镜像，同时运行前端和后端服务。

### 构建镜像

```bash
docker build -t lite-blog:latest .
```

### 运行容器

```bash
docker run -d \
  -p 3000:3000 \
  -p 8080:8080 \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=your-secure-password \
  -e JWT_SECRET=your-jwt-secret-key \
  -v blog-data:/app/data \
  --name lite-blog \
  lite-blog:latest
```

启动后访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8080

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ADMIN_EMAIL` | 管理员邮箱（首次启动时创建） | - |
| `ADMIN_PASSWORD` | 管理员密码（首次启动时创建） | - |
| `JWT_SECRET` | JWT 密钥（生产环境必须修改） | `change-this-in-production` |
| `DATABASE_PATH` | SQLite 数据库路径 | `/app/data/blog.db` |
| `SERVER_PORT` | 后端服务端口 | `8080` |
| `SERVER_MODE` | 运行模式 (debug/release) | `release` |
| `CORS_ORIGINS` | 允许的跨域来源（逗号分隔） | `http://localhost:3000` |

### 使用 docker-compose（推荐）

这是最简单的部署方式，适合生产环境。

**第一步：创建环境配置文件**

```bash
cp .env.example .env
```

**第二步：编辑 `.env` 文件**

```bash
# .env 文件内容示例

# 必须修改：JWT 密钥（用于用户认证，请使用随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this

# 可选：管理员账户（首次启动时自动创建）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-admin-password

# 可选：跨域配置（如果前端部署在其他域名）
CORS_ORIGINS=http://localhost:3000

# 可选：服务器配置
SERVER_MODE=release
```

**第三步：启动服务**

```bash
# 构建并启动（首次运行）
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

**第四步：访问服务**

- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- 使用 `.env` 中配置的管理员账户登录

**常用命令**

```bash
# 查看运行状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 进入容器调试
docker exec -it lite-blog sh

# 备份数据库
docker cp lite-blog:/app/data/blog.db ./backup-$(date +%Y%m%d).db

# 完全重建（清除缓存）
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 上传到 Docker Hub

```bash
# 登录
docker login

# 标记镜像
docker tag lite-blog:latest your-username/lite-blog:latest

# 推送
docker push your-username/lite-blog:latest
```

### 从 Docker Hub 拉取并运行

```bash
docker run -d \
  -p 3000:3000 \
  -p 8080:8080 \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=your-secure-password \
  -e JWT_SECRET=your-jwt-secret-key \
  -v blog-data:/app/data \
  your-username/lite-blog:latest
```

## 网站设置

管理员可以在后台配置以下设置：

| 设置项 | 说明 |
|--------|------|
| 网站名称 | 显示在页面头部 |
| 网站描述 | 用于 SEO meta 描述 |
| 网站关键词 | 用于 SEO meta 关键词 |
| 首页标题 | 首页主标题 |
| 首页副标题 | 首页副标题 |
| 页脚文字 | 版权信息 |
| Logo URL | 网站 Logo 图片地址 |

## 内容可见性

文章支持三种可见性设置：

| 可见性 | 说明 |
|--------|------|
| 公开 | 所有人可见完整内容 |
| 仅会员 | 会员可见完整内容，其他人只能看到预览 |
| 隐藏 | 仅管理员可见 |

## 许可证

MIT License

## 贡献

欢迎提交 Pull Request！
