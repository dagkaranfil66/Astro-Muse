const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude .local (Replit skills/temp dirs) from Metro's watcher.
// This prevents crashes when Replit deletes temporary skill subdirectories
// while Metro is still watching them.
config.watchFolders = [];
config.resolver.blockList = [
  /[/\\]\.local[/\\].*/,
  /[/\\]\.git[/\\].*/,
];

module.exports = config;
