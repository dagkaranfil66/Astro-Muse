const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const config = getDefaultConfig(__dirname);

// react-native-iap v12: Metro follows "react-native" field in package.json
// which points to src/ (TypeScript). The src/modules dir is not properly
// compiled for Metro. Force Metro to use the pre-built commonjs bundle instead.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-iap": path.resolve(__dirname, "node_modules/react-native-iap/lib/commonjs"),
};

// Exclude Replit temp/cache dirs from Metro's file watcher to prevent
// crashes when Replit deletes temporary directories while Metro is watching.
config.resolver.blockList = [
  /[/\\]\.local[/\\].*/,
  /[/\\]\.git[/\\].*/,
  /[/\\]\.cache[/\\].*/,
  /[/\\]\.upm[/\\].*/,
];

// In development, proxy /api/* requests from the Expo dev server (port 8081)
// to the Express backend (port 5000). This allows the Median WebView (Android)
// to reach the API via the same origin (https://domain), avoiding CORS issues
// caused by cross-port requests (https://domain:5000 is not externally accessible).
const EXPRESS_PORT = 5000;

config.server = {
  enhanceMiddleware: (metroMiddleware) => {
    const apiProxy = createProxyMiddleware({
      target: `http://127.0.0.1:${EXPRESS_PORT}`,
      changeOrigin: false,
      on: {
        error: (err, req, res) => {
          console.error("[Metro API Proxy] Error:", err.message);
          if (res && !res.headersSent) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "API proxy error: " + err.message }));
          }
        },
      },
    });

    return (req, res, next) => {
      if (req.url && req.url.startsWith("/api")) {
        return apiProxy(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
