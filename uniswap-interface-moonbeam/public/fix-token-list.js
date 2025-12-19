// 在浏览器控制台运行此脚本来强制刷新代币列表
// 使用方法：在 DEX 页面（http://localhost:3001）打开控制台（F12），粘贴并运行此代码

(function() {
  console.log('🔧 开始修复代币列表...');
  
  // 清除所有 Redux 相关的 localStorage
  let cleared = 0;
  Object.keys(localStorage).forEach(key => {
    if (key.includes('redux') || key.includes('persist') || key.includes('lists')) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`✓ 已清除: ${key}`);
    }
  });
  
  if (cleared > 0) {
    console.log(`\n✅ 成功清除了 ${cleared} 个缓存项`);
    console.log('🔄 正在刷新页面...');
    setTimeout(() => {
      location.reload();
    }, 500);
  } else {
    console.log('ℹ️ 没有找到需要清除的缓存');
    console.log('💡 提示：如果问题仍然存在，请尝试硬刷新（Ctrl+Shift+R）');
  }
})();

