import express from "express";
import { createServer as createHttpServer } from "node:http";
import { resolve } from "node:path";
import { createStore } from "./store.js";
import { createApp } from "./app.js";

const store = await createStore({
  databaseUrl: process.env.DATABASE_URL,
  file: process.env.DATA_FILE || "data/kitchen.sqlite",
});
const app = createApp(store);
const server = createHttpServer(app);
let vite;

if (process.env.NODE_ENV === "production") {
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
server.on("error", async (error) => {
  console.error(`Unable to start kitchen server: ${error.message}`);
  await vite?.close();
  await store.close();
  process.exit(1);
});
server.listen(port, host, () => {
  console.log(
    `BayMatt's Kitchen is ready at http://${host}:${port} (${store.mode} storage)`,
  );
});
async function shutdown() {
  await vite?.close();
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
