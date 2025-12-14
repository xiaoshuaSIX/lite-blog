# Lite Blog

基于角色的博客系统，支持会员内容预览，采用 Next.js + Go 构建。

[中文](README.zh-CN.md) | [English](README.md)

## 功能
- **基于角色的访问控制**：游客/用户/会员/管理员分级权限
- **内容预览**：会员内容可对非会员展示智能预览
- **身份认证**：JWT + HttpOnly Cookie，带邮箱验证
- **主题与多语言**：暗色模式，支持中英文
- **管理后台**：文章、用户、站点设置管理

## 免责声明
- 使用需自担风险，上线前请自行审计安全与合规。
- 必须设置强 `JWT_SECRET`，配置 TLS/HTTPS，并定期备份数据卷。
- 默认 SQLite 存储（`/app/data/blog.db`）适合自部署小型场景，生产建议迁移到托管数据库。

## 快速启动（Docker）

### Docker 单容器
```bash
docker run -d --name lite-blog \
  -p 80:8080 \
  -v blog-data:/app/data \
  -e JWT_SECRET=please-change-me \
  -e CORS_ORIGINS=https://your-domain.com \
  -e FRONTEND_PROXY=http://localhost:3000 \
  -e ADMIN_EMAIL=admin@your-domain.com \   # 可选：首次启动自动创建管理员
  -e ADMIN_PASSWORD=strong-password \      # 可选
  xiaoshuai66/lite-blog:latest
```
说明：
- 本地无 TLS 测试可用 `CORS_ORIGINS=http://localhost`。
- 容器监听 8080，映射 `80:8080` 即可在 80 端口对外提供前端和 API。
- `ADMIN_EMAIL`/`ADMIN_PASSWORD` 可选，首次启动自动创建管理员账号。

### Docker Compose
```yaml
services:
  lite-blog:
    image: xiaoshuai66/lite-blog:latest
    container_name: lite-blog
    restart: unless-stopped
    ports:
      - "80:8080"
    environment:
      JWT_SECRET: please-change-me
      CORS_ORIGINS: https://your-domain.com
      FRONTEND_PROXY: http://localhost:3000
      SERVER_PORT: 8080
      SERVER_MODE: release
      DATABASE_PATH: /app/data/blog.db
      ADMIN_EMAIL: admin@your-domain.com   # 可选
      ADMIN_PASSWORD: strong-password      # 可选
    volumes:
      - blog-data:/app/data

volumes:
  blog-data:
    driver: local
```
启动：
```bash
docker compose up -d
```

## 贡献
本地开发、架构、API 等信息见 `CONTRIBUTING.md`。
