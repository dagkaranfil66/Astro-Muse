const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

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
