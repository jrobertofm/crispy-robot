const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure resolver and extraNodeModules are initialized
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = config.resolver.extraNodeModules || {};

// Define the path to the empty shim
const emptyShimPath = path.resolve(__dirname, 'shim-empty.js');

// Add all necessary shims
config.resolver.extraNodeModules['stream'] = emptyShimPath;
config.resolver.extraNodeModules['events'] = emptyShimPath;
config.resolver.extraNodeModules['https'] = emptyShimPath;
config.resolver.extraNodeModules['http'] = emptyShimPath;  // New
config.resolver.extraNodeModules['net'] = emptyShimPath;   // New
config.resolver.extraNodeModules['crypto'] = emptyShimPath; // New
config.resolver.extraNodeModules['tls'] = emptyShimPath;   // New
config.resolver.extraNodeModules['url'] = emptyShimPath;    // New
config.resolver.extraNodeModules['zlib'] = emptyShimPath;  // New

module.exports = config;
