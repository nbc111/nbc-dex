# 白屏问题快速定位指南

## 第一步：检查开发服务器是否成功启动

### 1.1 查看终端输出
在运行 `npm start` 或 `powershell -ExecutionPolicy Bypass -File start-dev.ps1` 后，查看是否有：
- ✅ "Compiled successfully!" 
- ✅ "webpack compiled with X warnings"
- ❌ "Failed to compile" - 如果看到这个，说明编译失败

### 1.2 确认服务器端口
查看终端是否显示：
```
Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

### 1.3 检查端口是否真的在监听
在 PowerShell 中运行：
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```
如果有输出，说明服务器在运行。

## 第二步：检查浏览器控制台（最重要！）

### 2.1 打开浏览器开发者工具
1. 访问 http://localhost:3000
2. 按 `F12` 或右键 -> "检查"
3. 切换到 **Console** 标签

### 2.2 查看控制台错误
查找以下类型的错误：

#### 错误类型 A：JavaScript 运行时错误
```
Uncaught TypeError: Cannot read property 'xxx' of undefined
Uncaught ReferenceError: xxx is not defined
```
**解决方法**：这说明代码有问题，需要修复相应的 JS 代码

#### 错误类型 B：模块加载错误
```
Failed to load module script
Unexpected token '<'
```
**解决方法**：可能是构建配置问题或路径问题

#### 错误类型 C：网络错误
```
GET http://localhost:3000/static/js/bundle.js net::ERR_CONNECTION_REFUSED
```
**解决方法**：开发服务器没有正常启动

#### 错误类型 D：React 错误
```
Error: Minified React error #xxx
The above error occurred in the <Component> component
```
**解决方法**：React 组件有问题，查看错误堆栈

### 2.3 查看我们添加的调试日志
在控制台中查找：
```
Starting Moonbeam Uniswap Interface...
Root element found, rendering app...
App rendered successfully
```

如果看到这些日志，说明 React 应用至少开始渲染了。

## 第三步：检查 Network 标签

### 3.1 切换到 Network 标签
1. 在开发者工具中点击 **Network** 标签
2. 刷新页面 (F5)

### 3.2 检查资源加载
查看是否所有资源都成功加载（状态码 200）：
- `bundle.js` - 主要的 JavaScript 文件
- `main.chunk.js` - React 代码
- `vendors~main.chunk.js` - 第三方库

如果看到红色的失败请求（404 或 500），说明资源加载失败。

## 第四步：检查 Elements 标签

### 4.1 查看 DOM 结构
1. 切换到 **Elements** 标签
2. 查找 `<div id="root"></div>`
3. 检查 root div 里面是否有内容

#### 情况 A：root div 是空的
```html
<div id="root"></div>
```
**说明**：React 应用没有成功挂载，回到第二步查看控制台错误

#### 情况 B：root div 有内容但不可见
```html
<div id="root">
  <div style="display: none">...</div>
</div>
```
**说明**：可能是 CSS 问题，检查样式

#### 情况 C：root div 有错误边界内容
```html
<div id="root">
  <div>Something went wrong</div>
</div>
```
**说明**：应用崩溃了，查看错误信息

## 第五步：使用简化测试页面

我已经为你创建了一个测试页面，让我们验证基本功能：

### 5.1 访问测试页面
打开浏览器访问：
```
http://localhost:3000/test-sdk.html
```

### 5.2 查看测试结果
这个页面会显示：
- JavaScript 是否正常运行
- 控制台是否有错误
- 基本的 DOM 操作是否工作

## 快速排查命令

在项目目录下运行这些命令：

```powershell
# 1. 检查 Node 版本（应该是 v20.17.0）
node -v

# 2. 检查端口占用
netstat -ano | findstr :3000

# 3. 查看最近的 npm 错误日志
Get-Content $env:LOCALAPPDATA\npm-cache\_logs\*-debug-0.log -Tail 50

# 4. 清理并重新安装（如果怀疑依赖问题）
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps

# 5. 清理 React Scripts 缓存
Remove-Item -Recurse -Force node_modules\.cache
```

## 现在请执行以下操作：

### 操作 1：截图或复制控制台错误
1. 打开 http://localhost:3000
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. **截图或复制所有红色的错误信息**
5. 告诉我你看到了什么

### 操作 2：检查是否看到我们的调试日志
在控制台中搜索（Ctrl+F）：
- "Starting Moonbeam"
- "Root element"
- "App rendered"

告诉我是否看到这些日志。

### 操作 3：检查 DOM
1. 切换到 Elements 标签
2. 找到 `<div id="root">`
3. 展开它，看看里面有什么
4. 告诉我里面是空的还是有内容

## 最可能的原因

根据之前的错误信息，最可能的原因是：

1. ✅ **OpenSSL 错误** - 我们已经通过 start-dev.ps1 解决
2. ✅ **@metamask/safe-event-emitter 版本冲突** - 已降级到 2.0.0
3. ⚠️ **依赖安装不完整** - 需要运行 `npm install --legacy-peer-deps`
4. ⚠️ **React 组件错误** - 需要查看浏览器控制台
5. ⚠️ **路由问题** - 确保访问的是 http://localhost:3000 而不是其他地址

## 下一步

**请现在就打开浏览器，按 F12，然后告诉我 Console 标签里显示了什么错误信息！**

这是定位问题最关键的一步。没有浏览器控制台的错误信息，我们只能盲目猜测。
