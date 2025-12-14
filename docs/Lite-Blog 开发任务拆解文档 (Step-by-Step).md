# Lite-Blog 开发任务拆解文档 (Step-by-Step)

**基准文档**：

- `blog_prd_v2.md` (产品需求 V2.0)
- `blog_tdd_v2.md` (技术设计 V2.0)

**核心技术栈**：

- **Backend**: Go, Gin, GORM, SQLite
- **Frontend**: Next.js 14+ (App Router), shadcn/ui, TailwindCSS
- **Key Features**: 邮箱验证、RBAC 权限、会员预览算法、深色模式

------



## Phase 0: 基础设施搭建 (Infrastructure)





### Task 0.1: 后端初始化



- **概要**: 初始化 Go Module，安装 Gin, GORM, SQLite 驱动，配置基础路由组。
- **完成条件**:
  1. 项目结构包含 `/cmd`, `/internal`, `/configs`。
  2. `go.mod` 包含 Gin 和 GORM 依赖。
  3. 成功运行 `GET /ping` 接口返回 `{"message": "pong"}`。
- **动作确认**: 运行 `go run cmd/main.go`，并在浏览器访问 `http://localhost:8080/ping` 确认响应。
- **备注**: 数据库选用 SQLite，文件名为 `blog.db`。



### Task 0.2: 前端初始化



- **概要**: 创建 Next.js (App Router) 项目，集成 TailwindCSS, shadcn/ui 和 next-themes。
- **完成条件**:
  1. 项目成功运行在 `localhost:3000`。
  2. `shadcn/ui` 组件库初始化完成。
  3. 点击页面上的 Theme Toggle 按钮，界面能在深色/浅色/系统主题间切换。
- **动作确认**: 在页面手动切换主题，检查背景色和文字颜色是否反转。
- **备注**: 使用 `lucide-react` 作为图标库。

------



## Phase 1: 数据库与模型 (Schema)





### Task 1.1: 用户与权限模型



- **概要**: 定义 `User`, `Role`, `Permission` 结构体及 GORM 关联。
- **完成条件**:
  1. `User` 表包含 `email_verified` (bool/int), `email_verification_token` (string), `member_expire_at` (datetime)。
  2. 实现 `User` 与 `Role` 的 Many-to-Many 关联。
  3. 数据库迁移 (Migrate) 无报错。
- **动作确认**: 使用 SQLite 客户端（如 DB Browser）打开 `blog.db`，确认 `users`, `roles`, `user_roles` 表结构正确。
- **备注**: Token 字段建议长度设为 64 以上以容纳 Base64 字符串。



### Task 1.2: 文章与评论模型



- **概要**: 定义 `Article` 和 `Comment` 结构体。
- **完成条件**:
  1. `Article` 表包含 `visibility` (enum: hidden, public_full, member_full)。
  2. `Article` 表包含预览设置：`preview_percentage` (int), `preview_min_chars` (int), `preview_smart_paragraph` (bool)。
  3. `Comment` 表包含 `is_deleted` 用于软删除。
- **动作确认**: 检查数据库 `articles` 表是否包含上述特定字段。
- **备注**: 默认值：preview_percentage=30, min_chars=200, smart=true。

------



## Phase 2: 认证体系 (Authentication)





### Task 2.1: 注册与 Token 生成



- **概要**: 实现 `POST /api/auth/register`。
- **完成条件**:
  1. 密码使用 bcrypt 加密存储。
  2. 注册成功后，生成 32 字节随机 Token 存入数据库，设置过期时间（如 30 分钟）。
  3. 返回 201 Created。
- **动作确认**: 发送注册请求，查询数据库确认 `password_hash` 是密文，且 `email_verification_token` 不为空。
- **备注**: 暂时仅在控制台 `fmt.Println` 打印 Token 模拟发邮件。



### Task 2.2: 邮箱验证接口



- **概要**: 实现 `POST /api/auth/verify-email`。
- **完成条件**:
  1. 接收 `{token: string}` 参数。
  2. 校验 Token 存在且未过期。
  3. 验证成功后：`email_verified` 置为 true，`email_verification_token` 置空。
- **动作确认**: 复制 Task 2.1 控制台打印的 Token 调用接口，数据库中该用户 `email_verified` 变为 1。
- **备注**: 需处理 Token 无效或过期的错误返回。



### Task 2.3: 登录与 JWT



- **概要**: 实现 `POST /api/auth/login` 及 JWT 中间件。
- **完成条件**:
  1. 验证邮箱密码通过后签发 JWT。
  2. JWT 通过 **HttpOnly Cookie** 下发，而非 Body 返回。
  3. 实现 `GET /api/auth/me` 用于前端获取当前用户状态。
- **动作确认**: 登录成功后，在浏览器开发者工具 Application -> Cookies 中能看到 Token。
- **备注**: JWT Payload 需包含 `user_id` 和 `role`。

------



## Phase 3: 核心业务逻辑 (Core Business)





### Task 3.1: 智能预览算法



- **概要**: 实现文章内容截断工具函数 `GeneratePreview`。
- **完成条件**:
  1. 输入：内容、比例、最小字数、是否智能截断。
  2. 逻辑：先计算 `len * percentage`，若小于 `min_chars` 则取 `min_chars`。
  3. 智能截断：若开启，在截断点后寻找最近的换行符 `\n` 进行切割。
- **动作确认**: 编写单元测试，输入一段 500 字文本，要求 10% 预览 + 智能截断，断言返回的字符串以句号或换行符结尾。
- **备注**: 该算法是内容付费体验的核心。



### Task 3.2: 公开文章接口 (Public API)



- **概要**: 实现 `GET /api/articles/:slug`。
- **完成条件**:
  1. 若文章 `visibility=public_full`：返回全文。
  2. 若文章 `visibility=member_full`：
     - 从 Context 获取当前用户。
     - 若用户是会员 (`member_expire_at > now`)：返回全文。
     - 否则（游客/普通用户）：调用 `GeneratePreview` 返回截断内容。
- **动作确认**: 准备一篇 MemberOnly 文章。用普通账号请求，应返回短文；用修改过数据库有效期的会员账号请求，应返回全文。
- **备注**: 需在 JSON 响应中通过字段（如 `is_preview: true`）告知前端当前是预览模式。



### Task 3.3: 评论发表权限



- **概要**: 实现 `POST /api/articles/:id/comments`。
- **完成条件**:
  1. 验证用户已登录。
  2. **关键**：检查 `user.EmailVerified` 是否为 true，为 false 则拒绝请求 (403 Forbidden)。
- **动作确认**: 使用注册但未验证的用户发评论，断言返回错误提示“请先验证邮箱”。
- **备注**: 评论内容长度限制 1-500 字。

------



## Phase 4: 前端业务实现 (Frontend)





### Task 4.1: 认证流程页面



- **概要**: 开发登录、注册、邮箱验证落地页。
- **完成条件**:
  1. `/login` 和 `/register` 表单交互正常。
  2. `/verify-email?token=...` 页面加载时自动触发 API，根据结果显示“验证成功”或“链接失效”。
  3. 验证成功后提供按钮跳转登录。
- **动作确认**: 完整跑通注册 -> 控制台复制链接 -> 浏览器打开链接 -> 显示成功 -> 登录的流程。
- **备注**: 页面需适配移动端。



### Task 4.2: 文章详情与付费墙 UI



- **概要**: 渲染文章内容及“阅读全文”引导。
- **完成条件**:
  1. 解析 Markdown 内容并渲染。
  2. 检查 API 返回的 `is_preview` 字段。
  3. 若为预览模式，在文末显示渐变遮罩 + “成为会员阅读全文” 按钮 (CTA)。
- **动作确认**: 访问一篇会员文章，确保非会员无法通过“查看源代码”看到被截断的剩余内容（因为后端并未返回）。
- **备注**: 确保 CTA 按钮醒目。

------



## Phase 5: 后台管理系统 (Admin Dashboard)





### Task 5.1: 后台布局与鉴权



- **概要**: 搭建 `/admin` 路由及侧边栏。
- **完成条件**:
  1. 所有 `/admin/*` 路由受 `AdminMiddleware` 保护，非 Admin 用户跳转首页或 403。
  2. 侧边栏包含：Dashboard, Users, Articles, Comments。
- **动作确认**: 用普通用户账号尝试访问 `/admin/users`，应被拒绝。
- **备注**: 建议使用 Layout 统一管理后台结构。



### Task 5.2: 文章管理 (CMS)



- **概要**: 实现文章的增删改查页面。
- **完成条件**:
  1. 编辑器支持 Markdown 输入。
  2. 设置栏支持选择 `Visibility` 和输入 `Preview Percentage`。
- **动作确认**: 创建一篇文章，设为 "Member Full", 预览比例 "10%"，保存成功。
- **备注**: 列表页应直观显示文章的可见性状态。



### Task 5.3: 用户与会员管理



- **概要**: 用户列表及会员充值。
- **完成条件**:
  1. 列表显示用户 `Email Verified` 状态。
  2. 提供“管理”按钮，弹窗修改 `member_expire_at` 字段（模拟充值会员）。
- **动作确认**: 在后台将某用户有效期延后 30 天，该用户在前台立即获得会员权限。
- **备注**: 支持手动冻结/解冻用户。