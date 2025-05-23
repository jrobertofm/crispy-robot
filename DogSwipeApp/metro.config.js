const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure resolver and extraNodeModules are initialized
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = config.resolver.extraNodeModules || {};

// Define the path to the empty shim
const emptyShimPath = path.resolve(__dirname, 'shim-empty.js');

// Add 'stream' and 'events' to extraNodeModules, pointing to the empty shim
config.resolver.extraNodeModules['stream'] = emptyShimPath;
config.resolver.extraNodeModules['events'] = emptyShimPath;

module.exports = config;
