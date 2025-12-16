# 🔧 清除缓存并修复代币显示问题

## 问题描述
选择代币后，界面显示"选择通证"而不是代币名称（如 WNBC、NBC 等）。只有 DEV 可以正常选择。

## 根本原因
浏览器缓存了旧的代币列表数据（Redux store 持久化数据）。即使我们更新了 `tokens.json`，浏览器仍然使用缓存的旧数据。

## 解决方案

### 方法 1: 完全清除浏览器缓存（推荐）⭐

1. **打开浏览器开发者工具**
   - 按 `F12` 键

2. **打开 Console 标签**

3. **复制并运行以下代码**：

```javascript
// 清除所有 localStorage
console.log('🧹 Clearing localStorage...');
localStorage.clear();

// 清除所有 sessionStorage
console.log('🧹 Clearing sessionStorage...');
sessionStorage.clear();

// 清除所有 IndexedDB 数据库
console.log('🧹 Clearing IndexedDB...');
indexedDB.databases().then(dbs => {
    dbs.forEach(db => {
        console.log('  - Deleting database:', db.name);
        indexedDB.deleteDatabase(db.name);
    });
});

// 清除 Service Workers
if ('serviceWorker' in navigator) {
    console.log('🧹 Unregistering Service Workers...');
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            console.log('  - Unregistering service worker');
            registration.unregister();
        });
    });
}

// 清除 Cache Storage
if ('caches' in window) {
    console.log('🧹 Clearing Cache Storage...');
    caches.keys().then(names => {
        names.forEach(name => {
            console.log('  - Deleting cache:', name);
            caches.delete(name);
        });
    });
}

console.log('✅ All caches cleared!');
console.log('🔄 Reloading page in 2 seconds...');
setTimeout(() => {
    location.reload(true);
}, 2000);
```

4. **等待页面自动刷新**

---

### 方法 2: 使用浏览器清除数据功能

1. 按 `Ctrl + Shift + Delete` 打开"清除浏览数据"对话框

2. 选择以下选项：
   - ✅ Cookie 和其他网站数据
   - ✅ 缓存的图片和文件
   - ✅ 网站设置

3. 时间范围选择"全部时间"

4. 点击"清除数据"

5. 关闭并重新打开浏览器

6. 访问 `http://localhost:3001`

---

### 方法 3: 使用隐身/无痕模式测试

1. 打开浏览器的隐身/无痕模式
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Edge: `Ctrl + Shift + N`

2. 访问 `http://localhost:3001`

3. 测试代币选择功能

---

### 方法 4: 手动删除特定的 Redux 持久化数据

在浏览器开发者工具的 Console 中运行：

```javascript
// 查看所有 localStorage 键
console.log('Current localStorage keys:');
Object.keys(localStorage).forEach(key => {
    console.log('  -', key, ':', localStorage.getItem(key).substring(0, 100) + '...');
});

// 删除 Redux 持久化数据
Object.keys(localStorage).forEach(key => {
    if (key.includes('redux') || 
        key.includes('persist') || 
        key.includes('token') || 
        key.includes('list')) {
        console.log('Removing:', key);
        localStorage.removeItem(key);
    }
});

console.log('✅ Redux state cleared! Reloading...');
location.reload();
```

---

## 验证修复

清除缓存后，你应该能看到：

1. ✅ "Common bases" 区域显示所有代币按钮（WNBC, NBC, BTC, ETH, SOL, BNB, XRP, LTC, DOGE, PEPE, USDT, SUI）

2. ✅ "Token Name" 列表显示所有 12 个 NBC 链代币

3. ✅ 点击任意代币后，界面显示代币符号（如 "WNBC"、"NBC"）而不是"选择通证"

4. ✅ 可以正常选择两个代币进行交易或添加流动性

---

## 如果还是不行

如果清除缓存后还是不行，请尝试：

1. **完全关闭浏览器**（不是只关闭标签页）

2. **重启开发服务器**：
   ```powershell
   # 停止当前服务器（Ctrl+C）
   # 然后重新运行
   .\start-server.ps1
   ```

3. **使用不同的浏览器**测试（如果你用 Chrome，试试 Firefox 或 Edge）

4. **检查浏览器控制台**是否有错误信息

---

## 技术说明

### 为什么 DEV 可以选择，但其他代币不行？

- **DEV** 是从 `moonbeamswap` 包导入的原生代币（Currency 类型），它不依赖于代币列表
- **其他代币**（NBC, BTC, ETH 等）是 Token 类型，它们从 `tokens.json` 加载到 Redux store
- 如果 Redux store 中的数据是旧的（缓存的），新添加的代币就不会显示

### 代币加载流程

```
tokens.json 
  ↓
Redux Store (lists.byUrl[DEFAULT_TOKEN_LIST_URL].current)
  ↓
useSelectedTokenList() hook
  ↓
useAllTokens() hook
  ↓
CurrencySearch 组件
  ↓
显示在界面上
```

如果 Redux Store 被持久化到 localStorage，旧数据会一直存在，直到手动清除。

---

## 需要帮助？

如果以上方法都不行，请提供：
1. 浏览器控制台的错误信息（如果有）
2. Network 标签中 `tokens.json` 的加载情况
3. Application 标签中 localStorage 的内容截图
