# Gitee Unwrapped 部署指南

本文档详细介绍如何部署 Gitee Unwrapped 项目。

## 目录

- [前置要求](#前置要求)
- [第一步：克隆项目](#第一步克隆项目)
- [第二步：安装依赖](#第二步安装依赖)
- [第三步：配置 Gitee OAuth 应用](#第三步配置-gitee-oauth-应用)
- [第四步：获取 Gitee 个人访问令牌](#第四步获取-gitee-个人访问令牌)
- [第五步：配置 MongoDB 数据库](#第五步配置-mongodb-数据库)
- [第六步：配置 AWS Lambda (Remotion)](#第六步配置-aws-lambda-remotion)
- [第七步：配置环境变量](#第七步配置环境变量)
- [第八步：本地开发运行](#第八步本地开发运行)
- [第九步：生产环境部署](#第九步生产环境部署)
- [常见问题](#常见问题)

---

## 前置要求

在开始之前，请确保您已安装以下软件：

- **Node.js 18.18.0** (推荐使用 nvm 管理版本)
- **npm** 或 **yarn**
- **Git**

您还需要注册以下服务的账号：

- [Gitee](https://gitee.com) - 用于 OAuth 登录和 API 访问
- [MongoDB Atlas](https://www.mongodb.com/atlas) - 用于数据缓存（免费层即可）
- [AWS](https://aws.amazon.com) - 用于 Remotion Lambda 视频渲染
- [Render](https://render.com) 或其他云服务 - 用于托管 Web 应用（可选）

---

## 第一步：克隆项目

```bash
git clone https://gitee.com/JavaZeroo/gitee-unwrapped.git
cd gitee-unwrapped
```

---

## 第二步：安装依赖

```bash
npm install
```

如果遇到 Node.js 版本问题，请使用 nvm：

```bash
nvm install 18.18.0
nvm use 18.18.0
npm install
```

---

## 第三步：配置 Gitee OAuth 应用

### 3.1 创建 OAuth 应用

1. 登录 [Gitee](https://gitee.com)
2. 进入 **设置** → **第三方应用** → **创建应用**
3. 填写应用信息：
   - **应用名称**: Gitee Unwrapped
   - **应用主页**: `https://your-domain.com` 或 `http://localhost:8080`（开发环境）
   - **应用回调地址**: `https://your-domain.com/login` 或 `http://localhost:8080/login`（开发环境）
   - **权限**: 选择 `user_info`, `projects`, `pull_requests`, `issues`

4. 创建后，记录下 **Client ID** 和 **Client Secret**

### 3.2 配置环境变量

将获取到的值填入 `.env` 文件：

```env
VITE_CLIENT_ID=你的Client_ID
CLIENT_SECRET=你的Client_Secret
```

---

## 第四步：获取 Gitee 个人访问令牌

为了获取用户的公开数据（无需登录的情况），需要配置个人访问令牌：

### 4.1 创建个人访问令牌

1. 登录 Gitee
2. 进入 **设置** → **私人令牌** → **生成新令牌**
3. 填写描述，选择权限（建议只选择 `user_info` 和 `projects`）
4. 生成令牌并复制

### 4.2 配置多个令牌（用于负载均衡）

为了避免 API 限流，建议配置多个令牌。如果没有多个，可以重复使用同一个：

```env
GITEE_TOKEN_1=你的令牌1
GITEE_TOKEN_2=你的令牌2
GITEE_TOKEN_3=你的令牌3
GITEE_TOKEN_4=你的令牌4
GITEE_TOKEN_5=你的令牌5
GITEE_TOKEN_6=你的令牌6
```

---

## 第五步：配置 MongoDB 数据库

### 5.1 创建 MongoDB Atlas 账号

1. 访问 [MongoDB Atlas](https://www.mongodb.com/atlas)
2. 注册并创建一个免费的 M0 集群

### 5.2 配置数据库

1. 创建集群后，点击 **Database Access** 创建数据库用户
2. 点击 **Network Access** 添加 IP 白名单（开发时可使用 `0.0.0.0/0` 允许所有 IP）
3. 点击 **Connect** → **Connect your application** 获取连接字符串

### 5.3 配置环境变量

从连接字符串中提取信息：

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname
```

填入 `.env`：

```env
DB_HOST=cluster0.xxxxx.mongodb.net
DB_NAME=gitee-unwrapped
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
```

---

## 第六步：配置 AWS Lambda (Remotion)

视频渲染使用 Remotion Lambda，需要配置 AWS：

### 6.1 创建 AWS 账号

访问 [AWS](https://aws.amazon.com) 创建账号。

### 6.2 配置 IAM 用户

1. 进入 **IAM** → **用户** → **添加用户**
2. 用户名: `remotion-lambda`
3. 访问类型: 选择 **编程访问**
4. 权限: 附加以下策略（或创建自定义策略）：
   - `AWSLambdaFullAccess`
   - `AmazonS3FullAccess`
   - `AWSCloudFormationFullAccess`

5. 创建用户后，保存 **Access Key ID** 和 **Secret Access Key**

### 6.3 配置环境变量

```env
AWS_KEY_1=你的AWS_Access_Key_ID
AWS_SECRET_1=你的AWS_Secret_Access_Key
# 如果有多个账号用于负载均衡
AWS_KEY_2=另一个AWS_Access_Key_ID
AWS_SECRET_2=另一个AWS_Secret_Access_Key
# 可以重复使用相同的凭据
AWS_KEY_3=你的AWS_Access_Key_ID
AWS_SECRET_3=你的AWS_Secret_Access_Key
AWS_KEY_4=你的AWS_Access_Key_ID
AWS_SECRET_4=你的AWS_Secret_Access_Key
```

### 6.4 部署 Lambda 函数

```bash
npm run deploy
# 或者
npx tsx deploy.ts
```

**注意**: 某些 AWS 区域默认禁用，如果遇到错误，请在 AWS 控制台启用相关区域或修改 `deploy.ts` 只使用默认区域。

---

## 第七步：配置环境变量

### 7.1 创建 .env 文件

复制示例文件：

```bash
cp .env.example .env
```

### 7.2 完整的环境变量说明

```env
# ===================
# Gitee OAuth 配置
# ===================
VITE_CLIENT_ID=你的Gitee_OAuth_Client_ID
CLIENT_SECRET=你的Gitee_OAuth_Client_Secret

# ===================
# MongoDB 数据库配置
# ===================
DB_HOST=你的MongoDB主机地址
DB_NAME=数据库名称
DB_USER=数据库用户名
DB_PASSWORD=数据库密码

# ===================
# Gitee API 令牌
# ===================
GITEE_TOKEN_1=个人访问令牌1
GITEE_TOKEN_2=个人访问令牌2
GITEE_TOKEN_3=个人访问令牌3
GITEE_TOKEN_4=个人访问令牌4
GITEE_TOKEN_5=个人访问令牌5
GITEE_TOKEN_6=个人访问令牌6

# ===================
# 网站域名
# ===================
# 开发环境
VITE_HOST=http://localhost:8080
# 生产环境
# VITE_HOST=https://your-domain.com

# ===================
# AWS Lambda 配置
# ===================
AWS_KEY_1=AWS访问密钥ID
AWS_SECRET_1=AWS秘密访问密钥
AWS_KEY_2=AWS访问密钥ID
AWS_SECRET_2=AWS秘密访问密钥
AWS_KEY_3=AWS访问密钥ID
AWS_SECRET_3=AWS秘密访问密钥
AWS_KEY_4=AWS访问密钥ID
AWS_SECRET_4=AWS秘密访问密钥

# ===================
# 监控配置（可选）
# ===================
# Discord 监控
DISCORD_CHANNEL=Discord频道ID
DISCORD_TOKEN=Discord机器人令牌

# Sentry 错误追踪
SENTRY_DSN=Sentry项目DSN
```

---

## 第八步：本地开发运行

### 8.1 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:8080

### 8.2 编辑 Remotion 视频模板

```bash
npm run remotion
```

这将打开 Remotion Studio，你可以在这里预览和编辑视频模板。

### 8.3 构建项目

```bash
npm run build
```

---

## 第九步：生产环境部署

### 方案一：使用 Render（推荐）

1. 注册 [Render](https://render.com)
2. 创建一个新的 **Web Service**
3. 连接你的 Git 仓库
4. 配置：
   - **构建命令**: `npm install && npm run build`
   - **启动命令**: `npm start`
   - **环境**: Node
5. 添加所有环境变量
6. 部署

### 方案二：使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM node:18.18.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

构建并运行：

```bash
docker build -t gitee-unwrapped .
docker run -p 8080:8080 --env-file .env gitee-unwrapped
```

### 方案三：使用 PM2

安装 PM2：

```bash
npm install -g pm2
```

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'gitee-unwrapped',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
```

启动：

```bash
npm run build
pm2 start ecosystem.config.js
```

### 方案四：部署到阿里云/腾讯云

1. 购买云服务器 (ECS/CVM)
2. 安装 Node.js 18.18.0
3. 克隆项目并安装依赖
4. 配置环境变量
5. 使用 PM2 或 systemd 管理进程
6. 配置 Nginx 反向代理

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 常见问题

### Q1: 启动时报错 "Cannot find module"

**解决方案**: 确保已运行 `npm install` 并使用正确的 Node.js 版本 (18.18.0)

```bash
nvm use 18.18.0
npm install
```

### Q2: Gitee API 返回 401 错误

**解决方案**: 检查你的 Gitee 令牌是否有效，确保令牌有足够的权限

### Q3: MongoDB 连接失败

**解决方案**: 
1. 检查 MongoDB Atlas 的 IP 白名单设置
2. 确认用户名和密码正确
3. 检查数据库名称是否正确

### Q4: AWS Lambda 部署失败

**解决方案**: 
1. 确认 AWS 凭据正确
2. 检查 IAM 用户权限
3. 确认目标 AWS 区域已启用

### Q5: 视频渲染超时

**解决方案**: 
1. 检查 AWS Lambda 配置的内存和超时设置
2. 考虑增加 Lambda 并发数量
3. 检查网络连接

---

## 技术支持

如有问题，请在 [Gitee Issues](https://gitee.com/JavaZeroo/gitee-unwrapped/issues) 提交问题。
