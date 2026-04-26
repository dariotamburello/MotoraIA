const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Para pnpm hoisted layout, Metro necesita que watchFolders incluya el workspace
// root para resolver `@motora/*` packages. NO sobrescribimos otros defaults
// (nodeModulesPaths, disableHierarchicalLookup) — confunden la resolución de Expo.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

module.exports = config;
