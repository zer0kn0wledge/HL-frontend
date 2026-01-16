const { createServer } = require("http");
const { parse } = require("url");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "0.0.0.0";

let nextHandler = null;

// Create HTTP server FIRST - respond to health checks immediately
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);

  // Health check - always respond immediately
  if (parsedUrl.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // If Next.js is ready, use it
  if (nextHandler) {
    nextHandler(req, res, parsedUrl);
  } else {
    // Still initializing
    res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("Starting up...");
  }
});

// Start listening IMMEDIATELY
server.listen(port, hostname, () => {
  console.log(`> Server listening on http://${hostname}:${port}`);
});

// THEN initialize Next.js in background
const next = require("next");
const app = next({ dev: false, hostname, port });

app.prepare().then(() => {
  nextHandler = app.getRequestHandler();
  console.log(`> Next.js ready`);
}).catch((err) => {
  console.error("Next.js failed to start:", err);
});
