// 用于覆盖 react-scripts 的 webpack 配置
// 解决 @metamask/safe-event-emitter ESM 导入问题和 process is not defined 错误
// 兼容 react-scripts 3.4.1 (webpack 4)

const webpack = require('webpack');

module.exports = function override(config, env) {
  // 添加规则以正确处理 .mjs 文件
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });

  // 修复 process is not defined 错误
  // 在 webpack 4 中，我们使用 DefinePlugin 和 ProvidePlugin
  config.plugins = config.plugins || [];
  
  // 定义 process.env 和 process.browser
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    })
  );
  
  // 使用 ProvidePlugin 提供 process polyfill
  // 这会在需要时自动注入 process/browser
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
    })
  );

  // 在 webpack 4 中，我们需要通过 node 配置来处理 fallback
  // 而不是使用 resolve.fallback（这是 webpack 5 的特性）
  if (!config.resolve) {
    config.resolve = {};
  }
  
  // 确保可以解析 process/browser
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  return config;
};
