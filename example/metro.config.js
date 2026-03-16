const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const libraryRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Watch the library source for live changes
config.watchFolders = [libraryRoot]

// Resolve react-native-nitro-lndltc from the parent directory
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(libraryRoot, 'node_modules'),
]

// Ensure shared dependencies resolve from the example's node_modules
// to avoid duplicate React instances
config.resolver.disableHierarchicalLookup = true

module.exports = config
