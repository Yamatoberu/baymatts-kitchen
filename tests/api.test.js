import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";
const recipe = {
  title: "Family bread",
  servings: 4,
  ingredients: [
    { quantity: 2, unit: "cups", name: "Flour", preparation: "sifted" },
  ],
  steps: ["Mix and bake."],
  nutrition: { calories: null, protein: null, carbs: null, fat: null },
  originalText: "Original handwritten instructions.",
  source: "Grandma",
};
test("recipe API preserves versions, rejects stale edits and persists across restarts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kitchen-"));
  const file = join(directory, "recipes.sqlite");
  const store = await createStore({ file });
  const server = createApp(store).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/recipes`;
  const send = (method, path = "", data) =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  try {
    const created = await send("POST", "", recipe);
    assert.equal(created.status, 201);
    const first = await created.json();
    const updated = await send("PUT", `/${first.id}`, {
      ...first,
      title: "My bread",
      changeNote: "New name",
    });
    assert.equal(updated.status, 200);
    const second = await updated.json();
    assert.equal(second.revision, 2);
    assert.equal(second.history[0].title, "Family bread");
    assert.equal(second.history[0].originalText, recipe.originalText);
    assert.equal((await send("PUT", `/${first.id}`, first)).status, 409);
    assert.equal(
      (await send("DELETE", `/${first.id}`, { revision: 1 })).status,
      409,
    );
    assert.equal(
      (await send("POST", "", { ...recipe, servings: 0 })).status,
      400,
    );
    assert.equal((await send("PUT", "/invalid", first)).status, 400);
    assert.equal((await send("DELETE", `/${first.id}`)).status, 400);
    const rejected = await fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://attacker.example",
      },
      body: JSON.stringify(recipe),
    });
    assert.equal(rejected.status, 403);
    await store.close();
    const reopened = await createStore({ file });
    const saved = await reopened.list();
    assert.equal(saved[0].title, "My bread");
    assert.equal(saved[0].history.length, 1);
    await reopened.delete(first.id, 2);
    assert.deepEqual(await reopened.list(), []);
    await reopened.close();
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
