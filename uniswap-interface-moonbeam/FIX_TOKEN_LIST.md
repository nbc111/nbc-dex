# 修复 Swap 页面代币列表显示问题

## 问题
Swap 页面只显示 DEV 和 WDEV，没有显示 NBC 链的其他代币（BTC、ETH、SOL 等）。

## 解决方案

### 方法 1: 清除浏览器缓存和本地存储

1. **打开浏览器开发者工具**（F12）
2. **进入 Application 标签**
3. **清除 Local Storage**：
   - 左侧菜单：Storage → Local Storage → `http://localhost:3001`
   - 右键点击 → Clear
4. **清除 Session Storage**：
   - 左侧菜单：Storage → Session Storage → `http://localhost:3001`
   - 右键点击 → Clear
5. **清除 Cache Storage**：
   - 左侧菜单：Cache Storage
   - 右键点击每个缓存 → Delete
6. **刷新页面**（Ctrl + Shift + R 强制刷新）

### 方法 2: 在浏览器控制台手动重置 Token List

打开浏览器控制台（F12），运行以下代码：

```javascript
// 清除所有本地存储
localStorage.clear();
sessionStorage.clear();

// 重新加载页面
window.location.reload(true);
```

### 方法 3: 检查并更新 Token List

1. 在 Swap 页面，点击 "Select a token"
2. 点击底部的 "Change" 按钮
3. 确保 "Moon Menu" 列表已启用（开关打开）
4. 如果有更新提示，点击 "Update"
5. 关闭对话框，刷新页面

### 方法 4: 重启开发服务器

```bash
# 停止当前服务器（Ctrl + C）
# 清除 npm 缓存
npm cache clean --force

# 删除 .cache 目录（如果存在）
Remove-Item -Recurse -Force .cache -ErrorAction SilentlyContinue

# 重新启动
npm start
```

### 方法 5: 手动添加代币

如果以上方法都不行，可以手动添加代币：

1. 在 Swap 页面，点击 "Select a token"
2. 在搜索框中粘贴代币地址：
   - BTC: `0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac`
   - ETH: `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3`
   - SOL: `0xd5eeccc885ef850d90ae40e716c3dfce5c3d4c81`
   - 等等...
3. 点击 "Import" 导入代币

## 验证

成功后，Swap 页面的代币列表应该显示：
- ✅ WNBC
- ✅ NBC
- ✅ BTC
- ✅ ETH
- ✅ SOL
- ✅ BNB
- ✅ XRP
- ✅ LTC
- ✅ DOGE
- ✅ PEPE
- ✅ USDT
- ✅ SUI

## 如果还是不行

检查 `public/tokens.json` 文件是否存在且格式正确。该文件应该包含所有 NBC 链代币的配置。
