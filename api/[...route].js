import { createApp } from "../server/app.js";
import { createStore } from "../server/store.js";

let appPromise;

export default async function handler(req, res) {
  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(503).json({ error: "Recipe storage is unavailable." });
    return;
  }

  try {
    appPromise ??= createStore({
      databaseUrl,
      serverless: true,
    })
      .then(createApp)
      .catch((error) => {
        appPromise = undefined;
        throw error;
      });
    const app = await appPromise;
    app(req, res);
  } catch (error) {
    const message = String(error.message ?? "")
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted database URL]")
      .replace(/password\s*=\s*[^\s]+/gi, "[redacted password]");
    console.error(
      "Recipe storage initialization failed",
      error.code ?? error.name,
      message,
    );
    res.status(503).json({ error: "Recipe storage is unavailable." });
  }
}
