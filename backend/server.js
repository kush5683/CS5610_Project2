import express from "express";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import dataRoutes from "./data.js";

const app = express();
const HTTP_PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;
const SSL_CERT_FILE = process.env.SSL_CERT_FILE;
const SSL_KEY_FILE = process.env.SSL_KEY_FILE;
const ENABLE_HTTP =
  (process.env.ENABLE_HTTP ?? "true").toLowerCase() !== "false";

console.log("Backend JS loaded successfully.");

app.use(express.static("frontend"));
app.use(express.json());
app.use("/api", dataRoutes);

if (ENABLE_HTTP) {
  const httpServer = http.createServer(app);
  httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on http://localhost:${HTTP_PORT}`);
  });
}

if (SSL_CERT_FILE && SSL_KEY_FILE) {
  try {
    const certPath = path.resolve(SSL_CERT_FILE);
    const keyPath = path.resolve(SSL_KEY_FILE);

    const credentials = {
      cert: fs.readFileSync(certPath, "utf8"),
      key: fs.readFileSync(keyPath, "utf8"),
    };

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS server listening on https://localhost:${HTTPS_PORT}`);
    });
  } catch (error) {
    console.error(
      "Failed to start HTTPS server. Falling back to HTTP only.",
      error
    );
  }
} else {
  console.log(
    "SSL_CERT_FILE or SSL_KEY_FILE not set. HTTPS endpoint will not be started."
  );
}
