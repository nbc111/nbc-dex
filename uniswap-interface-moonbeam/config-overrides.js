// 用于覆盖 react-scripts 的 webpack 配置
// 解决 @metamask/safe-event-emitter ESM 导入问题

module.exports = function override(config, env) {
  // 添加规则以正确处理 .mjs 文件
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });

  return config;
};
