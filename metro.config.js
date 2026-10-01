const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, 'packages/shared');

const config = getDefaultConfig(projectRoot);

// Vendored copy of @crewup/shared. zod still resolves from this app's node_modules.
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  ...(config.resolver.nodeModulesPaths ?? []),
];

module.exports = config;
