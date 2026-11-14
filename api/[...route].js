import { createApp } from "../server/app.js";
import { createStore } from "../server/store.js";

let appPromise;

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Recipe storage is unavailable." });
    return;
  }

  try {
    appPromise ??= createStore({ databaseUrl: process.env.DATABASE_URL })
      .then(createApp)
      .catch((error) => {
        appPromise = undefined;
        throw error;
      });
    const app = await appPromise;
    app(req, res);
  } catch (error) {
    console.error("Recipe storage initialization failed", error.code);
    res.status(503).json({ error: "Recipe storage is unavailable." });
  }
}
