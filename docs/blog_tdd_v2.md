# 博客系统技术设计文档（TDD V2.0）

本设计文档基于最新 PRD V2.0，涵盖：邮箱注册与验证、用户体系、后台管理、权限体系、文章可见性与预览策略等完整技术方案。

---

## 1. 文档说明
- **目标**：将 PRD V2.0 的产品需求转化为可实施的技术方案。
- **版本**：V2.0  
- **范围**：前台博客浏览、评论、登录注册、邮箱验证；后台文章管理、用户管理、评论管理、权限管理；会员可见内容；文章预览策略。

---

## 2. 技术栈与选型

### 2.1 前端
- Next.js (App Router)
- React
- TailwindCSS
- shadcn/ui
- 深色模式：使用 next-themes

### 2.2 后端
- Go
- Gin（推荐）
- GORM（ORM）
- JWT + HttpOnly Cookie
- 邮件发送（SMTP 或第三方：SendGrid / Mailgun / 阿里云等）

### 2.3 数据库
- SQLite（开发/部署简单）
- ORM 抽象，后续可迁移 PostgreSQL

### 2.4 后台管理构建方案
- 方案 A：Next.js + shadcn/ui 自建（推荐）
- 方案 B：React Admin（备选）

---

## 3. 系统总体架构

```
[Browser]
  ↓
[Next.js]
  ↓ HTTP/JSON
[Go API]
  ↓
[SQLite]
  ↓
[SMTP / 邮件服务]
```

---

## 4. 数据库设计（重点围绕邮箱 & 会员 & 预览）

### 4.1 users

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 用户 ID |
| email | TEXT UNIQUE | 邮箱 |
| password_hash | TEXT | bcrypt 哈希 |
| email_verified | INTEGER | 0 未验证 1 已验证 |
| email_verification_token | TEXT | 当前有效token |
| email_verification_expire_at | DATETIME | token过期 |
| email_verification_sent_at | DATETIME | 最近发送时间 |
| member_expire_at | DATETIME | 会员到期 |
| status | INTEGER | 0正常 1禁用 |
| created_at | DATETIME | 创建时间 |

---

### 4.2 roles
guest/user/member/admin

### 4.3 user_roles
多对多映射

### 4.4 permissions
如：
- article.manage
- user.manage
- comment.manage
- preview.config.manage

### 4.5 articles

新增预览设置字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| visibility | TEXT | hidden/public_full/member_full |
| preview_percentage | INTEGER | 默认30 |
| preview_min_chars | INTEGER | 默认200 |
| preview_smart_paragraph | INTEGER | 智能段落截断 |

---

### 4.6 comments
包含软删除字段 is_deleted

---

## 5. 邮箱注册与验证

### 5.1 注册流程
1. 用户提交 email + password  
2. 创建用户（email_verified = false）  
3. 生成 email_verification_token  
4. 保存 token + expire_at  
5. 发送验证邮件  
6. 用户点击验证链接 → 激活邮箱  

---

### 5.2 token 方案
使用 **随机32字节 token + DB 存储**：

- 更容易强制单次失效  
- 适合 SQLite  

生成示例：

```go
b := make([]byte, 32)
rand.Read(b)
token := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(b)
```

---

### 5.3 验证流程

API：`POST /api/auth/verify-email`

逻辑：

1. 根据 token 查询用户  
2. 校验是否过期  
3. 标记 email_verified = true  
4. 清空 token  

---

### 5.4 邮件发送
支持：
- net/smtp
- SendGrid/Mailgun/Postmark/阿里企业邮等 SDK

必须实现：
- 发送限制（60 秒重发）  
- token 设置有效期（建议 30 分钟）  

---

### 5.5 未验证邮箱权限限制
未验证邮箱用户：

- 不能发表评论  
- 用户中心提示验证邮箱  
- 评论区显示“请先验证邮箱”

后端校验：

```go
if !user.EmailVerified {
    return error("请先验证邮箱")
}
```

---

## 6. 文章可见性与预览策略

### 6.1 可见性规则
| visibility | 行为 |
|------------|------|
| hidden | 非 admin 不可见 |
| public_full | 所有人可看全文 |
| member_full | 会员和管理员可看全文，其他只有预览 |

---

### 6.2 预览策略算法

```go
func generatePreview(content string, percentage, minChars int, smart bool) string {
    // 按比例计算
    // 若 smart=true，尝试以段落为单位截断
}
```

---

## 7. 后台管理系统

### 7.1 路由结构

```
/admin
  /articles
  /users
  /comments
  /roles
  /permissions
```

---

### 7.2 用户管理
- 查看用户列表  
- 编辑用户状态（禁用/启用）  
- 管理角色  
- 查看邮箱验证状态  
- 重发验证邮件  
- 设置会员有效期  

---

### 7.3 文章管理
- CRUD  
- 设置可见性  
- 设置预览策略（比例/最少字数/智能段落）  

---

### 7.4 评论管理
- 查看评论  
- 删除评论（软删除）  

---

### 7.5 权限管理
角色绑定权限

---

## 8. API 概要

### 8.1 Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/auth/verify-email`
- POST `/api/auth/resend-verification`

### 8.2 Articles
- GET `/api/articles`
- GET `/api/articles/:slug`
- POST `/api/admin/articles`
- PUT `/api/admin/articles/:id`
- DELETE `/api/admin/articles/:id`

### 8.3 Comments
- GET `/api/articles/:id/comments`
- POST `/api/articles/:id/comments`
- DELETE `/api/admin/comments/:id`

### 8.4 Users（后台）
- GET `/api/admin/users`
- GET `/api/admin/users/:id`
- PUT `/api/admin/users/:id/status`
- POST `/api/admin/users/:id/roles`
- DELETE `/api/admin/users/:id/roles/:role`

---

## 9. 权限与安全
- JWT + HttpOnly Cookie  
- RBAC（基于 role + permission）  
- email 未验证限制权限  
- 所有后台接口必须 admin  

---

## 10. 非功能性
- 深色模式：next-themes  
- 性能：分页、索引  
- 安全：bcrypt、token 有效期、发送频率限制  

---

## 11. 总结
本设计文档涵盖完整功能，包括邮箱注册验证、后台管理、会员策略与预览算法，架构清晰、可扩展、可迁移。

