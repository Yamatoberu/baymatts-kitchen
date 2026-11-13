import express from "express";
import { z } from "zod";
const mutationSchema = z.object({ revision: z.number().int().positive() });
import { recipeSchema } from "./recipe.js";
import { StoreError } from "./store.js";
export function createApp(store) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      const origin = req.get("origin");
      if (origin && new URL(origin).host !== req.get("host"))
        return res
          .status(403)
          .json({ error: "Cross-origin writes are not allowed." });
      if (
        !req.get("content-type")?.toLowerCase().startsWith("application/json")
      )
        return res.status(415).json({ error: "Use application/json." });
    }
    next();
  });
  app.use(express.json({ limit: "2mb" }));
  app.get("/api/health", (req, res) =>
    res.json({ status: "ok", storage: store.mode }),
  );
  app.get("/api/recipes", async (req, res) => res.json(await store.list()));
  app.post("/api/recipes", async (req, res) =>
    res.status(201).json(await store.create(recipeSchema.parse(req.body))),
  );
  app.put("/api/recipes/:id", async (req, res) => {
    const id = z.uuid().parse(req.params.id);
    const { revision } = mutationSchema.parse(req.body);
    res.json(await store.update(id, recipeSchema.parse(req.body), revision));
  });
  app.delete("/api/recipes/:id", async (req, res) => {
    const id = z.uuid().parse(req.params.id);
    const { revision } = mutationSchema.parse(req.body);
    await store.delete(id, revision);
    res.status(204).end();
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use((error, req, res, next) => {
    if (error.name === "ZodError")
      return res.status(400).json({
        error: error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      });
    if (error instanceof StoreError)
      return res.status(error.status).json({ error: error.message });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON." });
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "Recipe is too large." });
    console.error(error);
    res
      .status(500)
      .json({ error: "Unable to save or load recipes. Please try again." });
  });
  return app;
}
