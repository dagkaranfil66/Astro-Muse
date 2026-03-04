const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude Replit temp/cache dirs from Metro's file watcher to prevent
// crashes when Replit deletes temporary directories while Metro is watching.
config.resolver.blockList = [
  /[/\\]\.local[/\\].*/,
  /[/\\]\.git[/\\].*/,
  /[/\\]\.cache[/\\].*/,
  /[/\\]\.upm[/\\].*/,
];

module.exports = config;
