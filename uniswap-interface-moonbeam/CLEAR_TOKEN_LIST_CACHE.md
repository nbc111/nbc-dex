# 清除代币列表缓存

如果代币选择弹窗中只显示了部分代币（例如只显示 NBC 和 WNBC），可能是因为浏览器缓存了旧的代币列表。

## 解决方法

### 方法 1：清除浏览器 localStorage（推荐）

1. 打开浏览器开发者工具（按 `F12`）
2. 切换到 **Application** 标签（Chrome）或 **Storage** 标签（Firefox）
3. 在左侧找到 **Local Storage**
4. 点击你的网站地址（例如 `http://localhost:3001`）
5. 找到并删除以下键：
   - `persist:root` 或 `redux-localstorage`
   - 任何包含 `lists` 的键
6. 刷新页面（按 `F5` 或 `Ctrl+R`）

### 方法 2：使用浏览器控制台清除

1. 打开浏览器开发者工具（按 `F12`）
2. 切换到 **Console** 标签
3. 运行以下命令：

```javascript
// 清除所有 localStorage
localStorage.clear();

// 或者只清除 Redux 相关的数据
Object.keys(localStorage).forEach(key => {
  if (key.includes('redux') || key.includes('persist')) {
    localStorage.removeItem(key);
  }
});

// 然后刷新页面
location.reload();
```

### 方法 3：使用隐私模式/无痕模式

1. 打开浏览器的隐私模式/无痕模式
2. 访问 `http://localhost:3001`
3. 这样就不会使用之前缓存的 localStorage 数据

## 验证

清除缓存后，代币选择弹窗应该显示以下代币（chainId 1281）：

- NBC (NBC Token)
- WNBC (Wrapped NBC)
- BTC (Wrapped Bitcoin)
- ETH (Wrapped Ethereum)
- SOL (Wrapped Solana)
- BNB (Wrapped BNB)
- XRP (Wrapped XRP)
- LTC (Wrapped Litecoin)
- DOGE (Wrapped Dogecoin)
- PEPE (Pepe Token)
- USDT (Tether USD)
- SUI (Sui Token)

## 如果问题仍然存在

1. 检查浏览器控制台是否有错误信息
2. 确认 `src/tokens.json` 文件中的代币列表是正确的
3. 确认当前连接的链 ID 是 1281（NBC Chain）
4. 尝试硬刷新页面（`Ctrl+Shift+R` 或 `Cmd+Shift+R`）

