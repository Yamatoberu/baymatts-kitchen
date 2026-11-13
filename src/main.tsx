import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  emptyRecipe,
  type Recipe,
  type RecipeData,
  type RecipeVersion,
} from "./types";
import { sampleRecipe } from "./sample";
import "./styles.css";

async function request(path: string, method = "GET", data?: unknown) {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Unable to reach your kitchen. Try again.");
  }
  return response.status === 204 ? null : response.json();
}
function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All recipes");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState<RecipeData | Recipe | null>(null);
  const [busy, setBusy] = useState(false);
  const [storage, setStorage] = useState("");
  const [notice, setNotice] = useState("");
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [items, health] = await Promise.all([
        request("recipes"),
        request("health"),
      ]);
      setRecipes(items);
      setStorage(health.storage);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function save(data: RecipeData | Recipe) {
    setBusy(true);
    setError("");
    try {
      const updating = "id" in data;
      const payload = { ...data };
      if ("history" in payload) delete (payload as Partial<Recipe>).history;
      const result = await request(
        updating ? `recipes/${data.id}` : "recipes",
        updating ? "PUT" : "POST",
        payload,
      );
      setRecipes((items) => [
        result,
        ...items.filter((item) => item.id !== result.id),
      ]);
      setSelected(result);
      setEditing(null);
      setNotice(
        updating
          ? "Recipe saved. Previous versions are preserved."
          : "Recipe added to your kitchen.",
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(recipe: Recipe) {
    if (
      !confirm(
        `Delete “${recipe.title}” and its version history? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    try {
      await request(`recipes/${recipe.id}`, "DELETE", {
        revision: recipe.revision,
      });
      setRecipes((items) => items.filter((item) => item.id !== recipe.id));
      setSelected(null);
      setNotice("Recipe deleted.");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportRecipes() {
    const blob = new Blob(
      [
        JSON.stringify(
          { format: "baymatts-kitchen", version: 1, recipes },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "baymatts-kitchen-recipes.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  const filtered = recipes.filter((recipe) => {
    const matchesCategory =
      category === "All recipes" ||
      (category === "Favorites"
        ? recipe.favorite
        : recipe.category === category);
    const searchable = [
      recipe.title,
      recipe.description,
      recipe.source,
      ...recipe.ingredients.map((item) => item.name),
    ]
      .join(" ")
      .toLowerCase();
    return matchesCategory && searchable.includes(query.toLowerCase());
  });
  const categories = [...new Set(recipes.map((recipe) => recipe.category))]
    .filter((item) => !["All recipes", "Favorites"].includes(item))
    .sort();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          onClick={(event) => {
            if (editing) event.preventDefault();
          }}
          className="brand"
          href="/"
          aria-label="BayMatt's Kitchen home"
        >
          <span className="brand-mark">
            B<span>✦</span>
          </span>
          <span>
            BayMatt’s
            <br />
            <em>Kitchen</em>
          </span>
        </a>
        <div className="sidebar-label">YOUR KITCHEN</div>
        <nav aria-label="Recipe collection">
          {["All recipes", "Favorites", ...categories].map((item) => (
            <button
              disabled={!!editing}
              className={category === item ? "nav-item active" : "nav-item"}
              key={item}
              onClick={() => {
                setCategory(item);
                setSelected(null);
                setEditing(null);
              }}
            >
              <span>
                {item === "Favorites"
                  ? "♡"
                  : item === "All recipes"
                    ? "▤"
                    : "·"}
              </span>
              {item}
              <small>
                {item === "All recipes"
                  ? recipes.length
                  : item === "Favorites"
                    ? recipes.filter((recipe) => recipe.favorite).length
                    : recipes.filter((recipe) => recipe.category === item)
                        .length}
              </small>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>
            A little care.
            <br />A lot of good food.
          </p>
          <span>BAYMATT LABS</span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>Your recipes. Your kitchen.</span>
          <span className="storage">
            <i />
            {storage === "postgres"
              ? "Neon connected"
              : storage === "local"
                ? "Saved on this device"
                : "Connecting…"}
          </span>
        </header>
        <div className="workspace">
          {error && (
            <div className="alert" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
              {!editing && (
                <button
                  onClick={() => {
                    setSelected(null);
                    void reload();
                  }}
                >
                  Reload recipes
                </button>
              )}
            </div>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </p>
          )}
          {editing ? (
            <RecipeEditor
              initial={editing}
              busy={busy}
              onSave={save}
              onCancel={() => {
                setEditing(null);
                setError("");
              }}
            />
          ) : selected ? (
            <RecipeDetail
              key={`${selected.id}-${selected.revision}`}
              recipe={selected}
              busy={busy}
              onBack={() => setSelected(null)}
              onEdit={() => setEditing(selected)}
              onDelete={() => remove(selected)}
              onFavorite={() =>
                save({
                  ...selected,
                  favorite: !selected.favorite,
                  changeNote: "Updated favorite status",
                })
              }
              onRestore={(version) =>
                save({
                  ...version,
                  id: selected.id,
                  revision: selected.revision,
                  history: selected.history,
                  changeNote: `Restored version ${version.revision}`,
                })
              }
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">THE RECIPE COLLECTION</p>
                  <h1>
                    {category === "All recipes"
                      ? "Good food, kept close."
                      : category}
                  </h1>
                  <p className="subtitle">
                    The everyday favorites. The family traditions. The next
                    great meal.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditing(structuredClone(emptyRecipe))}
                >
                  <span>＋</span> Add a recipe
                </button>
              </div>
              <section className="welcome-banner">
                <div>
                  <p className="eyebrow">MAKE ROOM FOR SOMETHING GOOD</p>
                  <h2>
                    Every recipe has a story.
                    <br />
                    Keep yours here.
                  </h2>
                  <p>
                    A home for the dishes you love, and the people
                    <br className="desktop" /> who first brought them to your
                    table.
                  </p>
                </div>
                <div
                  className="banner-photo"
                  role="img"
                  aria-label="Fresh herbs and ingredients on a kitchen table"
                />
              </section>
              <div className="collection-toolbar">
                <div>
                  <h2>{category}</h2>
                  <span>
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "recipe" : "recipes"}
                  </span>
                </div>
                <div className="tools">
                  <label className="search">
                    <span aria-hidden="true">⌕</span>
                    <input
                      aria-label="Search recipes or ingredients"
                      placeholder="Search recipes, ingredients…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <button
                    className="quiet"
                    onClick={exportRecipes}
                    disabled={!recipes.length}
                  >
                    Export
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="empty" role="status">
                  Opening your recipe book…
                </div>
              ) : filtered.length ? (
                <div className="recipe-grid">
                  {filtered.map((recipe) => (
                    <button
                      className="recipe-card"
                      key={recipe.id}
                      onClick={() => setSelected(recipe)}
                    >
                      <div className="card-art">
                        <span>{recipe.category}</span>
                        <b aria-hidden="true">{recipe.favorite ? "♥" : "✦"}</b>
                      </div>
                      <div className="card-content">
                        <p className="eyebrow">
                          {recipe.source || "FROM YOUR KITCHEN"}
                        </p>
                        <h3>{recipe.title}</h3>
                        <p>
                          {recipe.description ||
                            `${recipe.ingredients.length} ingredients, made your way.`}
                        </p>
                        <footer>
                          <span>
                            {recipe.minutes
                              ? `${recipe.minutes} min`
                              : "Time not set"}
                          </span>
                          <span>Serves {recipe.servings}</span>
                        </footer>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <section className="empty">
                  <span className="empty-icon">▤</span>
                  <h3>
                    {recipes.length
                      ? "No recipes found"
                      : "Your next favorite starts here."}
                  </h3>
                  <p>
                    {recipes.length
                      ? "Try another ingredient, recipe name, or collection."
                      : "Add a family favorite, or start with an example to explore your kitchen."}
                  </p>
                  {!recipes.length && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => save(sampleRecipe)}
                    >
                      {busy ? "Adding…" : "Try an example recipe"}
                    </button>
                  )}
                </section>
              )}
              <footer className="page-footer">
                Made for the recipes worth keeping.
                <span>BayMatt’s Kitchen</span>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function RecipeDetail({
  recipe,
  busy,
  onBack,
  onEdit,
  onDelete,
  onFavorite,
  onRestore,
}: {
  recipe: Recipe;
  busy: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onRestore: (version: RecipeVersion) => void;
}) {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<number[]>([]);
  const [version, setVersion] = useState<RecipeVersion | null>(null);
  const current = version || recipe;
  const factor = servings / current.servings;
  return (
    <article className="recipe-detail">
      <button className="text-button" onClick={onBack}>
        ← Back to recipes
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {current.category} · {current.minutes} MINUTES
          </p>
          <h1>{current.title}</h1>
          <p className="subtitle">{current.description}</p>
        </div>
        <div className="action-row">
          <button className="secondary" disabled={busy} onClick={onFavorite}>
            {recipe.favorite ? "♥ Favorited" : "♡ Favorite"}
          </button>
          <button className="primary" onClick={onEdit}>
            Edit recipe
          </button>
        </div>
      </div>
      {version && (
        <div className="version-banner">
          Viewing version {version.revision} from{" "}
          {new Date(version.updatedAt).toLocaleDateString()}
          <button
            onClick={() => {
              setVersion(null);
              setServings(recipe.servings);
            }}
          >
            Return to current
          </button>
          <button disabled={busy} onClick={() => onRestore(version)}>
            Restore this version
          </button>
        </div>
      )}
      <div className="attribution">
        From {current.source || "your kitchen"}{" "}
        {current.sourceUrl && (
          <a href={current.sourceUrl} target="_blank" rel="noreferrer">
            View original source ↗
          </a>
        )}
      </div>
      <div className="detail-grid">
        <section className="ingredient-panel">
          <div className="section-title">
            <h2>Ingredients</h2>
            <label>
              Servings{" "}
              <input
                aria-label="Scale to servings"
                type="number"
                min="1"
                max="10000"
                value={servings}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (value > 0 && value <= 10000) setServings(value);
                }}
              />
            </label>
          </div>
          <p className="muted">
            Original recipe serves {current.servings}. Check off as you go.
          </p>
          <ul className="ingredients">
            {current.ingredients.map((ingredient, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked.includes(index)}
                    onChange={() =>
                      setChecked((items) =>
                        items.includes(index)
                          ? items.filter((item) => item !== index)
                          : [...items, index],
                      )
                    }
                  />
                  <span>
                    {ingredient.quantity !== null && (
                      <strong>
                        {Number((ingredient.quantity * factor).toFixed(2))}{" "}
                      </strong>
                    )}
                    {ingredient.unit} {ingredient.name}
                    {ingredient.preparation && (
                      <small>{ingredient.preparation}</small>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section className="directions">
          <h2>At the stove</h2>
          <ol>
            {current.steps.map((step, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          {current.notes && (
            <div className="cook-note">
              <h3>Kitchen notes</h3>
              <p>{current.notes}</p>
            </div>
          )}
        </section>
      </div>
      <section className="nutrition">
        <div>
          <h2>Nutrition & allergens</h2>
          <p className="muted">
            User-entered estimates per serving. Totals below adjust with the
            selected servings.
          </p>
        </div>
        <div className="nutrition-values">
          {Object.entries(current.nutrition).map(([key, value]) => (
            <div key={key}>
              <strong>
                {value ?? "—"}
                {value !== null && key !== "calories" ? "g" : ""}
              </strong>
              <span>{key}</span>
              <small>
                {value === null
                  ? "Unknown total"
                  : `${Number((value * servings).toFixed(1))}${key === "calories" ? " kcal" : "g"} total`}
              </small>
            </div>
          ))}
        </div>
        <p>
          <strong>Recorded allergens</strong>{" "}
          {current.allergens.length
            ? current.allergens.join(", ")
            : "None recorded. Check ingredients and packaging."}
        </p>
      </section>
      {current.originalText && (
        <section className="original">
          <h2>Original recipe</h2>
          <p>{current.originalText}</p>
        </section>
      )}
      <section className="history">
        <h2>Recipe history</h2>
        <p className="muted">
          Version {recipe.revision} · Last saved{" "}
          {new Date(recipe.updatedAt).toLocaleString()}
        </p>
        {recipe.history.length ? (
          [...recipe.history].reverse().map((item) => (
            <button
              className="history-row"
              key={item.revision}
              onClick={() => {
                setVersion(item);
                setServings(item.servings);
                setChecked([]);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span>
                Version {item.revision}
                <small>{item.changeNote || "Recipe saved"}</small>
              </span>
              <span>{new Date(item.updatedAt).toLocaleDateString()} ↗</span>
            </button>
          ))
        ) : (
          <p>
            The original version is preserved when you make your first edit.
          </p>
        )}
      </section>
      <button className="danger text-button" disabled={busy} onClick={onDelete}>
        Delete recipe
      </button>
    </article>
  );
}

function RecipeEditor({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: RecipeData | Recipe;
  busy: boolean;
  onSave: (data: RecipeData | Recipe) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState(() => structuredClone(initial));
  const [allergens, setAllergens] = useState(initial.allergens.join(", "));
  function field<K extends keyof RecipeData>(key: K, value: RecipeData[K]) {
    setData((previous) => ({ ...previous, [key]: value }));
  }
  function cancel() {
    if (
      JSON.stringify(data) !== JSON.stringify(initial) ||
      allergens !== initial.allergens.join(", ")
    ) {
      if (!confirm("Discard your unsaved changes?")) return;
    }
    onCancel();
  }
  return (
    <form
      className="editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...data,
          allergens: allergens
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        });
      }}
    >
      <button type="button" className="text-button" onClick={cancel}>
        ← Back to recipes
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A RECIPE WORTH KEEPING</p>
          <h1>
            {"id" in initial ? "Make it your own." : "From your kitchen."}
          </h1>
          <p className="subtitle">
            Capture the ingredients, the method, and the story behind it.
          </p>
        </div>
      </div>
      <fieldset disabled={busy}>
        <section className="form-section">
          <h2>The essentials</h2>
          <label>
            Recipe name
            <input
              required
              maxLength={160}
              value={data.title}
              onChange={(event) => field("title", event.target.value)}
              placeholder="Grandma’s Sunday pot roast"
            />
          </label>
          <label>
            A few words about this recipe
            <textarea
              value={data.description}
              onChange={(event) => field("description", event.target.value)}
              rows={2}
            />
          </label>
          <div className="form-row">
            <label>
              Category
              <input
                required
                maxLength={60}
                list="categories"
                value={data.category}
                onChange={(event) => field("category", event.target.value)}
              />
              <datalist id="categories">
                {[
                  "Breakfast",
                  "Lunch",
                  "Dinner",
                  "Sides",
                  "Desserts",
                  "Drinks",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </datalist>
            </label>
            <label>
              Servings
              <input
                required
                type="number"
                min={1}
                max={10000}
                value={data.servings}
                onChange={(event) =>
                  field("servings", Number(event.target.value))
                }
              />
            </label>
            <label>
              Total time (minutes)
              <input
                required
                type="number"
                min={0}
                max={1000000}
                value={data.minutes}
                onChange={(event) =>
                  field("minutes", Number(event.target.value))
                }
              />
            </label>
          </div>
        </section>
        <section className="form-section">
          <h2>Ingredients</h2>
          <p className="muted">
            Leave quantity empty for ingredients added to taste. Use decimals
            for fractions, such as 0.5 for ½.
          </p>
          <div className="ingredient-labels">
            <span>Quantity</span>
            <span>Unit</span>
            <span>Ingredient</span>
            <span>Preparation</span>
          </div>
          {data.ingredients.map((ingredient, index) => (
            <div className="ingredient-edit" key={index}>
              <input
                aria-label={`Ingredient ${index + 1} quantity`}
                type="number"
                min={0}
                max={1000000}
                step="any"
                value={ingredient.quantity ?? ""}
                onChange={(event) =>
                  field(
                    "ingredients",
                    data.ingredients.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            quantity:
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                          }
                        : item,
                    ),
                  )
                }
              />
              {(["unit", "name", "preparation"] as const).map((key) => (
                <input
                  key={key}
                  required={key === "name"}
                  aria-label={`Ingredient ${index + 1} ${key}`}
                  placeholder={
                    key === "unit"
                      ? "cups"
                      : key === "name"
                        ? "Flour"
                        : "Sifted"
                  }
                  value={ingredient[key]}
                  onChange={(event) =>
                    field(
                      "ingredients",
                      data.ingredients.map((item, i) =>
                        i === index
                          ? { ...item, [key]: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              ))}
              <button
                type="button"
                className="remove"
                aria-label={`Remove ingredient ${index + 1}`}
                disabled={data.ingredients.length === 1}
                onClick={() =>
                  field(
                    "ingredients",
                    data.ingredients.filter((_, i) => i !== index),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button"
            onClick={() =>
              field("ingredients", [
                ...data.ingredients,
                { quantity: null, unit: "", name: "", preparation: "" },
              ])
            }
          >
            ＋ Add ingredient
          </button>
        </section>
        <section className="form-section">
          <h2>Cooking directions</h2>
          {data.steps.map((step, index) => (
            <div className="step-edit" key={index}>
              <span>{index + 1}</span>
              <textarea
                required
                aria-label={`Step ${index + 1}`}
                rows={2}
                value={step}
                onChange={(event) =>
                  field(
                    "steps",
                    data.steps.map((item, i) =>
                      i === index ? event.target.value : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="remove"
                aria-label={`Remove step ${index + 1}`}
                disabled={data.steps.length === 1}
                onClick={() =>
                  field(
                    "steps",
                    data.steps.filter((_, i) => i !== index),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button"
            onClick={() => field("steps", [...data.steps, ""])}
          >
            ＋ Add step
          </button>
        </section>
        <section className="form-section">
          <h2>The story & the source</h2>
          <div className="form-row">
            <label>
              Recipe from
              <input
                value={data.source}
                onChange={(event) => field("source", event.target.value)}
                placeholder="A person, cookbook, or website"
              />
            </label>
            <label>
              Original source URL
              <input
                type="url"
                value={data.sourceUrl}
                onChange={(event) => field("sourceUrl", event.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>
          <label>
            Original recipe text
            <textarea
              value={data.originalText}
              onChange={(event) => field("originalText", event.target.value)}
              rows={4}
              placeholder="Transcribe a recipe card or paste the original here to preserve it."
            />
          </label>
          <label>
            Kitchen notes & personal modifications
            <textarea
              value={data.notes}
              onChange={(event) => field("notes", event.target.value)}
              rows={3}
            />
          </label>
        </section>
        <section className="form-section">
          <h2>Nutrition & allergens</h2>
          <p className="muted">
            Optional estimates per serving. Leave unknown values blank.
          </p>
          <div className="form-row">
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <label key={key}>
                {key === "calories"
                  ? "Calories (kcal)"
                  : `${key[0].toUpperCase()}${key.slice(1)} (g)`}
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  step="any"
                  value={data.nutrition[key] ?? ""}
                  onChange={(event) =>
                    field("nutrition", {
                      ...data.nutrition,
                      [key]:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Known or potential allergens, separated by commas
            <input
              value={allergens}
              onChange={(event) => setAllergens(event.target.value)}
              placeholder="Milk, wheat, may contain nuts"
            />
          </label>
        </section>
        {"id" in initial && (
          <section className="form-section">
            <label>
              What changed?
              <input
                value={data.changeNote}
                maxLength={500}
                onChange={(event) => field("changeNote", event.target.value)}
                placeholder="Less sugar, extra lemon…"
              />
            </label>
          </section>
        )}
        <div className="form-actions">
          <button className="secondary" type="button" onClick={cancel}>
            Cancel
          </button>
          <button className="primary" type="submit">
            {busy ? "Saving…" : "Save recipe"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
