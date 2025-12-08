# 白屏问题排查指南

## 问题诊断

你遇到的白屏问题是由于 **Node.js v20 与旧版 react-scripts 不兼容** 导致的 OpenSSL 错误。

### 错误信息
```
ERR_OSSL_EVP_UNSUPPORTED
error:03000086:digital envelope routines::initialization error
```

## 解决方案

### 方案 1：使用 cross-env（推荐）

1. 安装 cross-env（项目已经有了）：
```bash
npm install
```

2. 修改 package.json 的 scripts 部分（已修改但需要用 cross-env）

### 方案 2：降级 Node.js 版本（最简单）

降级到 Node.js v16 或 v14：
```bash
# 使用 nvm (Node Version Manager)
nvm install 16
nvm use 16
```

### 方案 3：升级 react-scripts

升级到 react-scripts v5（可能需要修改代码）：
```bash
npm install react-scripts@5 --save
```

## 当前需要做的步骤

### 步骤 1：修复 package.json

由于 Windows 的 `set` 命令在某些情况下不工作，我们需要使用 `cross-env`。

### 步骤 2：启动开发服务器

```bash
npm start
```

### 步骤 3：检查浏览器控制台

打开浏览器开发者工具（F12），查看：
1. Console 标签 - 查看 JavaScript 错误
2. Network 标签 - 查看资源加载情况
3. 确认是否看到 "Starting Moonbeam Uniswap Interface..." 日志

## 常见白屏原因

1. ✅ **OpenSSL 错误** - 已识别
2. ⚠️ **依赖未安装** - 运行 `npm install`
3. ⚠️ **端口被占用** - 检查 3000 端口
4. ⚠️ **JavaScript 错误** - 检查浏览器控制台
5. ⚠️ **路由问题** - 确认访问 http://localhost:3000

## 调试命令

```bash
# 检查 Node 版本
node -v

# 检查端口占用
netstat -ano | findstr :3000

# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
npm cache clean --force
```

## 下一步

让我为你修复 package.json 使用正确的跨平台方式。
