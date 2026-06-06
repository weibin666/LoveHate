   # LoveHate 微信小程序 — 启动指南

> 爱恨情仇 · 情侣情绪博弈场  
> 微信小程序前端 + FastAPI 后端

---

## 目录

- [整体架构](#整体架构)
- [前置条件](#前置条件)
- [第一步：启动后端](#第一步启动后端)
  - [方式 A：本地直接启动（推荐开发用）](#方式-a本地直接启动推荐开发用)
  - [方式 B：Docker Compose 一键启动](#方式-bdocker-compose-一键启动)
- [第二步：配置小程序](#第二步配置小程序)
- [第三步：用微信开发者工具打开](#第三步用微信开发者工具打开)
- [本地开发配置（HTTP 调试）](#本地开发配置http-调试)
- [生产部署配置](#生产部署配置)
- [项目结构](#项目结构)
- [API 端点一览](#api-端点一览)
- [常见问题](#常见问题)

---

## 整体架构

```
┌─────────────────┐       HTTPS        ┌──────────────────┐
│                  │  ───────────────▶   │                  │
│  微信小程序前端   │                    │  FastAPI 后端     │
│  (miniprogram/)  │  ◀───────────────  │  (backend/)      │
│                  │       JSON API     │                  │
└─────────────────┘                    └──────────────────┘
                                              │
                                    ┌─────────┼─────────┐
                                    │         │         │
                                PostgreSQL  Redis    SQLite
                               (生产环境)  (验证码)  (开发默认)
```

小程序通过 `wx.request` 调用后端 REST API，后端独立运行，小程序不依赖 Node.js。

---

## 前置条件

| 工具 | 版本要求 | 用途 | 下载 |
|------|---------|------|------|
| **微信开发者工具** | 最新稳定版 | 编辑、预览、调试小程序 | https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html |
| **Python** | 3.10+ | 运行后端 | https://www.python.org/downloads/ |
| **pip** | 随 Python 安装 | 安装 Python 依赖 | — |
| **(可选) Docker** | 20+ + Docker Compose | 一键部署生产环境 | https://www.docker.com/ |

> 小程序前端 **不需要** Node.js、npm 或任何前端构建工具。

---

## 第一步：启动后端

后端必须先运行，小程序才有 API 可调。以下两种方式任选其一。

### 方式 A：本地直接启动（推荐开发用）

使用 SQLite，零依赖外部数据库，适合快速开发。

```bash
# 1. 进入后端目录
cd LoveHate/backend

# 2. 创建虚拟环境（推荐）
python -m venv venv

# Windows 激活：
venv\Scripts\activate

# macOS/Linux 激活：
# source venv/bin/activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 启动后端
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动成功后会看到：

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

验证：浏览器访问 http://localhost:8000 ，应返回：

```json
{"app": "LoveHate", "version": "1.0.0", "message": "爱恨情仇 - 情侣情绪博弈场"}
```

> Windows 用户也可以直接双击项目根目录的 `start-backend.bat` 一键启动（需修改其中的 Python 路径）。

### 方式 B：Docker Compose 一键启动

使用 PostgreSQL + Redis + Nginx，适合测试生产环境。

```bash
# 在项目根目录 LoveHate/ 下执行
docker-compose up --build
```

这会启动 4 个容器：

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 验证码存储 |
| Backend (FastAPI) | 8000 | API 服务 |
| Nginx | 80 | 反向代理 |

验证：浏览器访问 http://localhost/api/auth/me ，应返回 401（未登录）。

---

## 第二步：配置小程序

### 2.1 配置后端地址

打开 `miniprogram/app.js`，修改 `globalData` 中的 API 地址：

**本地开发（后端在本机）：**

```javascript
globalData: {
  apiBase: 'http://localhost:8000/api',   // ← 改这里
  wsBase: 'ws://localhost:8000',           // ← 改这里
  // ...
}
```

**Docker / 局域网（后端在另一台机器）：**

```javascript
globalData: {
  apiBase: 'http://192.168.x.x:8000/api',  // ← 改为后端机器的局域网 IP
  wsBase: 'ws://192.168.x.x:8000',
  // ...
}
```

**生产环境（已部署到服务器）：**

```javascript
globalData: {
  apiBase: 'https://lovsun.cn/api',
  wsBase: 'wss://lovsun.cn',
  // ...
}
```

### 2.2 检查 project.config.json

打开 `miniprogram/project.config.json`，确认以下配置：

```json
{
  "setting": {
    "urlCheck": true    // 生产环境改为 true（校验合法域名）
  }
}
```

本地开发时，如果不校验域名，可以在微信开发者工具中手动关闭（见下一步）。

---

## 第三步：用微信开发者工具打开

### 3.1 打开项目

1. 启动 **微信开发者工具**
2. 点击 **"+"** 或 **"导入项目"**
3. 选择目录：`LoveHate/miniprogram`
4. 填入你的 **AppID**（没有可选择"测试号"）
5. 点击 **"确定"**

### 3.2 关闭域名校验（本地开发必须）

在微信开发者工具中：

1. 点击右上角 **"详情"**
2. 选择 **"本地设置"** 标签页
3. 勾选 **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**

> 这一步很重要，否则小程序无法请求 `http://localhost`。

### 3.3 预览 & 调试

- **模拟器**：工具左侧自动预览小程序
- **真机调试**：点击工具栏 **"预览"** → 手机扫码查看
- **控制台**：底部的 **"调试器"** 可查看网络请求和日志
- **编译**：修改代码后自动热重载，或按 `Ctrl+B` 手动编译

---

## 本地开发配置（HTTP 调试）

本地开发时完整的配置清单：

```
┌──────────────────────────────────────────────────┐
│  后端：http://localhost:8000  (uvicorn 启动)      │
│  小程序 apiBase：http://localhost:8000/api        │
│  小程序 wsBase：ws://localhost:8000               │
│  微信开发者工具：关闭域名校验 ✓                    │
│  project.config.json → urlCheck: true (不改)      │
└──────────────────────────────────────────────────┘
```

快速启动脚本（Windows）：

```bat
@echo off
:: 启动后端
cd /d "%~dp0LoveHate\backend"
start cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: 提示
echo ===================================
echo   后端已启动: http://localhost:8000
echo   请用微信开发者工具打开 miniprogram/ 目录
echo ===================================
pause
```

保存为 `start-dev.bat` 放在项目根目录，双击即可启动后端。

---

## 生产部署配置

### 1. 部署后端到服务器

```bash
# 在服务器上
cd LoveHate
docker-compose up -d --build
```

### 2. 配置 HTTPS（微信小程序强制要求）

```bash
# 安装 certbot
apt install certbot

# 申请证书（替换 lovsun.cn）
certbot certonly --standalone -d lovsun.cn

# 证书路径
# /etc/letsencrypt/live/lovsun.cn/fullchain.pem
# /etc/letsencrypt/live/lovsun.cn/privkey.pem
```

在 `nginx.conf` 中添加 HTTPS：

```nginx
server {
    listen 443 ssl;
    server_name lovsun.cn;

    ssl_certificate /etc/letsencrypt/live/lovsun.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lovsun.cn/privkey.pem;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://backend:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name lovsun.cn;
    return 301 https://$host$request_uri;
}
```

### 3. 配置微信小程序服务器域名

登录 [微信公众平台](https://mp.weixin.qq.com/)：

1. **开发** → **开发管理** → **开发设置**
2. **服务器域名** → **修改**
3. 添加：
   - request 合法域名：`https://lovsun.cn`
   - socket 合法域名：`wss://lovsun.cn`
   - uploadFile 合法域名：`https://lovsun.cn`
   - downloadFile 合法域名：`https://lovsun.cn`

### 4. 修改小程序生产地址

```javascript
// miniprogram/app.js
globalData: {
  apiBase: 'https://lovsun.cn/api',
  wsBase: 'wss://lovsun.cn',
}
```

### 5. 上传发布

1. 微信开发者工具中点击 **"上传"**
2. 填写版本号和备注
3. 登录微信公众平台 → **版本管理** → 提交审核

---

## 项目结构

```
LoveHate/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py            # 入口，注册路由
│   │   ├── config.py          # 配置（数据库、SMS、密钥）
│   │   ├── database.py        # 数据库连接
│   │   ├── models.py          # 10 个数据模型
│   │   ├── schemas.py         # 请求/响应模型
│   │   ├── auth.py            # JWT 认证
│   │   ├── ws.py              # WebSocket 管理器
│   │   ├── sms.py             # 短信发送（Mock/阿里云/腾讯云）
│   │   ├── scheduler.py       # 定时任务（记仇过期、温度衰减）
│   │   └── routers/           # 8 个路由模块
│   │       ├── auth.py        #   认证（注册/登录/SMS/刷新）
│   │       ├── couple.py      #   情侣配对
│   │       ├── records.py     #   记录 CRUD + 续期
│   │       ├── game.py        #   商店/信件/冷战
│   │       ├── upload.py      #   图片上传
│   │       ├── calendar.py    #   日历/周报
│   │       ├── achievements.py#   成就系统
│   │       ├── posts.py       #   分享空间
│   │       └── ws_router.py   #   WebSocket 端点
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React Web 前端（独立项目）
├── mobile/                     # React Native 移动端（独立项目）
│
├── miniprogram/                # ★ 微信小程序前端（本项目）
│   ├── app.js                 # 全局 App（状态管理 + 请求封装）
│   ├── app.json               # 小程序页面/TabBar/窗口配置
│   ├── app.wxss               # 全局主题样式（Midnight Romance）
│   ├── project.config.json    # 开发者工具项目配置
│   ├── sitemap.json           # 搜索配置
│   ├── assets/icons/          # 10 个 TabBar 图标 PNG
│   └── pages/                 # 11 个页面
│       ├── login/             #   登录/注册（密码+短信）
│       ├── couple/            #   情侣配对
│       ├── home/              #   首页（温度+记录+冷战）
│       ├── feed/              #   分享空间（动态+点赞）
│       ├── calendar/          #   情绪日历（月历+周报）
│       ├── shop/              #   复仇商店
│       ├── letters/           #   信箱
│       ├── profile/           #   个人中心
│       ├── achievements/      #   成就徽章
│       ├── record-detail/     #   记录详情
│       └── letter-write/      #   写信
│
├── docker-compose.yml          # 生产部署（PG + Redis + Backend + Nginx）
├── nginx.conf                  # Nginx 反向代理配置
└── plan.md                     # 总体开发计划
```

---

## API 端点一览

后端共 34 个 API 端点 + 1 个 WebSocket，全部可被小程序调用。

### 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（用户名+昵称+密码） |
| POST | `/api/auth/login` | 密码登录 |
| POST | `/api/auth/sms/send` | 发送短信验证码 |
| POST | `/api/auth/sms/login` | 短信登录/注册 |
| POST | `/api/auth/refresh` | 刷新 Token |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 情侣 `/api/couple`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/couple/create` | 创建情侣空间 |
| POST | `/api/couple/pair` | 通过邀请码加入 |
| GET | `/api/couple/info` | 获取情侣信息 |

### 记录 `/api/records`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/records` | 记好/记仇 |
| GET | `/api/records` | 记录列表（分页） |
| GET | `/api/records/stats` | 统计数据 |
| DELETE | `/api/records/{id}` | 删除记录 |
| POST | `/api/records/{id}/renew` | 续期记仇（10💰） |

### 游戏 `/api/game`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/game/shop` | 商品列表 |
| POST | `/api/game/shop` | 自定义商品 |
| POST | `/api/game/shop/{id}/buy` | 购买 |
| GET | `/api/game/purchases` | 我的券 |
| POST | `/api/game/coldwar/reconcile` | 和好 |
| POST | `/api/game/letter` | 发信 |
| GET | `/api/game/letters` | 信件列表 |
| POST | `/api/game/letter/{id}/accept` | 接受/拒绝 |

### 日历 `/api/calendar`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/calendar/monthly` | 月历数据 |
| GET | `/api/calendar/weekly-report` | 周报 |
| GET | `/api/calendar/daily/{date}` | 某日记录 |

### 动态 `/api/posts`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/posts` | 发动态 |
| GET | `/api/posts` | 动态列表 |
| POST | `/api/posts/{id}/like` | 点赞/取消 |
| DELETE | `/api/posts/{id}` | 删除 |

### 成就 `/api/achievements`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/achievements` | 成就列表 |

### 上传 `/api/upload`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload/image` | 上传图片（≤5MB） |
| POST | `/api/upload/avatar` | 上传头像（≤2MB） |

### WebSocket

| 协议 | 路径 | 说明 |
|------|------|------|
| WS | `/ws/notify?token=` | 实时通知（在线/新记录/新信件/购买/和好） |

---

## 常见问题

### Q: 打开小程序后白屏或报 "request:fail"？

1. 确认后端已启动：浏览器访问 `http://localhost:8000`
2. 确认 `app.js` 中的 `apiBase` 地址正确
3. 确认微信开发者工具中 **关闭了域名校验**（详情 → 本地设置 → 勾选"不校验"）

### Q: 小程序提示 "不在以下 request 合法域名列表中"？

这是生产环境的问题。需要在微信公众平台后台添加服务器域名。本地开发时关闭域名校验即可。

### Q: 如何修改主题颜色？

编辑 `miniprogram/app.wxss` 顶部的 CSS 变量即可全局生效：

```css
page {
  --love: #ff4d6d;      /* 粉红（爱） */
  --hate: #845ec2;      /* 紫色（恨） */
  --bg: #0a0a14;        /* 背景色 */
  --surface: #161628;   /* 卡片背景 */
  /* ... */
}
```

### Q: 如何替换 TabBar 图标？

替换 `miniprogram/assets/icons/` 中的 10 个 PNG 文件。要求：
- 尺寸：81×81 px
- 格式：PNG（支持透明）
- 命名：`home.png` / `home-active.png` 等

### Q: 如何开启 WebSocket 实时通知？

1. 在 `app.js` 中实现 WebSocket 连接逻辑（`wx.connectSocket`）
2. 将 `wsBase` 改为实际 WebSocket 地址
3. 本地开发使用 `ws://localhost:8000`，生产使用 `wss://lovsun.cn`

### Q: 后端如何切换到 PostgreSQL？

```bash
# 方式 1：环境变量
export DATABASE_URL="postgresql://user:pass@localhost:5432/lovehate"
export DATABASE_URL_ASYNC="postgresql+asyncpg://user:pass@localhost:5432/lovehate"

# 方式 2：.env 文件
cp backend/.env.example backend/.env
# 编辑 .env 填入 PostgreSQL 连接信息
```

### Q: 如何查看 API 文档？

后端启动后访问：
- Swagger UI：http://localhost:8000/docs
- ReDoc：http://localhost:8000/redoc

### Q: 短信验证码功能如何测试？

默认使用 Mock 模式（`SMS_PROVIDER: "mock"`），验证码会打印在控制台日志中，不会真正发送短信。切换到真实短信需要在 `.env` 中配置阿里云或腾讯云 SMS 密钥。
