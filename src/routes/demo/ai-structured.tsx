import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, Clock, Users, Gauge } from "lucide-react";
import { Streamdown } from "streamdown";

import type { Recipe } from "./api.ai.structured";

type Mode = "structured" | "oneshot";

const SAMPLE_RECIPES = [
  "Homemade Margherita Pizza",
  "Thai Green Curry",
  "Classic Beef Bourguignon",
  "Chocolate Lava Cake",
  "Crispy Korean Fried Chicken",
  "Fresh Spring Rolls with Peanut Sauce",
  "Creamy Mushroom Risotto",
  "Authentic Pad Thai",
];

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const difficultyColors = {
    easy: "demo-pill",
    medium: "demo-pill",
    hard: "demo-pill",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="mb-2 font-bold text-2xl text-[var(--sea-ink)]">
          {recipe.name}
        </h3>
        <p className="demo-muted">{recipe.description}</p>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-4">
        <div className="demo-muted flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--lagoon-deep)]" />
          <span className="text-sm">Prep: {recipe.prepTime}</span>
        </div>
        <div className="demo-muted flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--lagoon-deep)]" />
          <span className="text-sm">Cook: {recipe.cookTime}</span>
        </div>
        <div className="demo-muted flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--lagoon-deep)]" />
          <span className="text-sm">{recipe.servings} servings</span>
        </div>
        <div
          className={`flex items-center gap-2 ${
            difficultyColors[recipe.difficulty]
          }`}
        >
          <Gauge className="h-4 w-4" />
          <span className="text-sm capitalize">{recipe.difficulty}</span>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h4 className="mb-3 font-semibold text-[var(--sea-ink)] text-lg">
          Ingredients
        </h4>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="demo-muted flex items-start gap-2">
              <span className="text-[var(--lagoon-deep)]">•</span>
              <span>
                <span className="font-medium">{ing.amount}</span> {ing.item}
                {ing.notes && <span className="text-sm"> ({ing.notes})</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div>
        <h4 className="mb-3 font-semibold text-[var(--sea-ink)] text-lg">
          Instructions
        </h4>
        <ol className="space-y-3">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="demo-muted flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--chip-bg)] font-medium text-[var(--sea-ink)] text-sm">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <div>
          <h4 className="mb-3 font-semibold text-[var(--sea-ink)] text-lg">
            Tips
          </h4>
          <ul className="space-y-2">
            {recipe.tips.map((tip, idx) => (
              <li key={idx} className="demo-muted flex items-start gap-2">
                <span className="text-[var(--lagoon-deep)]">*</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nutrition */}
      {recipe.nutritionPerServing && (
        <div>
          <h4 className="mb-3 font-semibold text-[var(--sea-ink)] text-lg">
            Nutrition (per serving)
          </h4>
          <div className="flex flex-wrap gap-4 text-sm">
            {recipe.nutritionPerServing.calories && (
              <span className="demo-pill">
                {recipe.nutritionPerServing.calories} cal
              </span>
            )}
            {recipe.nutritionPerServing.protein && (
              <span className="demo-pill">
                Protein: {recipe.nutritionPerServing.protein}
              </span>
            )}
            {recipe.nutritionPerServing.carbs && (
              <span className="demo-pill">
                Carbs: {recipe.nutritionPerServing.carbs}
              </span>
            )}
            {recipe.nutritionPerServing.fat && (
              <span className="demo-pill">
                Fat: {recipe.nutritionPerServing.fat}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StructuredPage() {
  const [recipeName, setRecipeName] = useState("");
  const [result, setResult] = useState<{
    mode: Mode;
    recipe?: Recipe;
    markdown?: string;
    provider: string;
    model: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (mode: Mode) => {
    if (!recipeName.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/demo/api/ai/structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeName, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recipe");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const canExecute = !!(!isLoading && recipeName.trim() && !error);

  return (
    <main className="demo-page demo-page-wide">
      <div>
        <div className="mb-6 flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-[var(--lagoon-deep)]" />
          <h1 className="demo-title">One-Shot & Structured Output</h1>
        </div>

        <p className="demo-muted mb-6">
          Compare two output modes:{" "}
          <strong className="text-[var(--sea-ink)]">One-Shot</strong> returns
          freeform markdown, while{" "}
          <strong className="text-[var(--sea-ink)]">Structured</strong> returns
          validated JSON conforming to a Zod schema.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium text-[var(--sea-ink)] text-sm">
              Recipe Name
            </label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              disabled={isLoading}
              placeholder="e.g., Chocolate Chip Cookies"
              className="demo-input text-sm"
            />

            <div className="mt-2">
              <label className="mb-2 block font-medium text-[var(--sea-ink)] text-sm">
                Quick Picks
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_RECIPES.map((name) => (
                  <button
                    key={name}
                    onClick={() => setRecipeName(name)}
                    disabled={isLoading}
                    className="demo-button demo-button-secondary px-2 py-1 text-xs"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleGenerate("oneshot")}
                disabled={!canExecute}
                className="demo-button"
              >
                One-Shot (Markdown)
              </button>
              <button
                onClick={() => handleGenerate("structured")}
                disabled={!canExecute}
                className="demo-button"
              >
                Structured (JSON)
              </button>
            </div>
          </div>
        </div>

        <div className="demo-panel mt-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="demo-section-title">Generated Recipe</h2>
            {result && (
              <span className="demo-pill">
                {result.mode === "structured" ? "Structured JSON" : "Markdown"}
              </span>
            )}
          </div>

          {error && (
            <div className="demo-alert demo-alert-danger mb-4">{error}</div>
          )}

          {result ? (
            <div className="space-y-4">
              {result.mode === "structured" && result.recipe ? (
                <RecipeCard recipe={result.recipe} />
              ) : result.markdown ? (
                <div className="max-w-none">
                  <Streamdown>{result.markdown}</Streamdown>
                </div>
              ) : null}
            </div>
          ) : !error && !isLoading ? (
            <div className="demo-muted flex h-64 flex-col items-center justify-center">
              <ChefHat className="mb-4 h-16 w-16 opacity-50" />
              <p>
                Enter a recipe name and click "Generate Recipe" to get started.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/demo/ai-structured")({
  component: StructuredPage,
});
