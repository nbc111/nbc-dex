// 用于覆盖 react-scripts 的 webpack 配置
// 解决 @metamask/safe-event-emitter ESM 导入问题和 process is not defined 错误

const webpack = require('webpack');

module.exports = function override(config, env) {
  // 添加规则以正确处理 .mjs 文件
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });

  // 修复 process is not defined 错误
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': JSON.stringify(true),
    })
  );

  // 确保 process 在浏览器环境中可用
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "process": require.resolve("process/browser"),
  };

  return config;
};
