import { useEffect, useState } from "react";
import { getRecipeImage } from "../lib/replicate";

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  substitutions?: string[];
  tips?: string[];
  nutrition?: string;
  servings?: string;
  servingSize?: string;
  totalTime?: string;
}

interface RecipeCardProps {
  recipe: Recipe | string;
}

function sanitizeText(text: string): string {
  // Remove *, #, and leading/trailing whitespace
  return text.replace(/[\*#]/g, '').trim();
}

function extractIngredientsFlexible(recipe: string): string[] {
  const lines = recipe.split('\n').map(line => line.trim());
  // Find the start of the ingredients section
  const ingIdx = lines.findIndex(line => /ingredient/i.test(line));
  if (ingIdx === -1) return [];
  const ingredients: string[] = [];
  for (let i = ingIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop if we hit the next section (Instructions, Substitutions, etc.)
    if (/^(\d+\.|step|instruction|substitution|tip|nutritional|time)/i.test(line)) break;
    // Accept lines that look like ingredients
    if (line &&
      (line.startsWith('-') ||
       line.startsWith('*') ||
       /^\d+\./.test(line) ||
       /^[A-Za-z0-9]/.test(line)) &&
      !/ingredient/i.test(line)
    ) {
      // Remove only a single leading '-', '*', or bullet, and a single space, but keep numbers/fractions
      ingredients.push(sanitizeText(line.replace(/^[-*•]\s?/, '')));
    }
  }
  // Filter out empty or section heading lines
  return ingredients.filter(Boolean).filter(l => !/^(instructions?|substitutions?|tips?|nutritional|time)/i.test(l));
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  // If recipe is a string, parse it into sections
  const parsedRecipe = typeof recipe === 'string' 
    ? parseRecipeString(recipe)
    : recipe;

  // Fallback: If ingredients are missing, try to extract from raw string (flexible)
  let ingredients = parsedRecipe.ingredients?.length
    ? parsedRecipe.ingredients.map(sanitizeText)
    : (typeof recipe === 'string' ? extractIngredientsFlexible(recipe) : []);

  // Clean and parse nutrition facts for display
  let nutritionFacts: { [key: string]: string } = {};
  let nutritionNote = '';
  const stripMarkdown = (str: string) => str.replace(/\*\*|\*/g, '').trim();
  const caloriesRegex = /^(calories( per serving)?|estimated calories|energy)[:]?/i;
  if (parsedRecipe.nutrition) {
    parsedRecipe.nutrition.split('\n').forEach(line => {
      const clean = line.replace(/^\*+|\*+$/g, '').trim();
      if (/note[:]?/i.test(clean)) {
        nutritionNote = stripMarkdown(clean.replace(/note[:]?/i, ''));
      } else if (caloriesRegex.test(clean)) {
        const [label, ...rest] = clean.split(':');
        if (label && rest.length) nutritionFacts['Calories'] = stripMarkdown(rest.join(':'));
      } else if (/^protein|carb|fat|sodium|fiber|vitamin|iron|calcium|potassium/i.test(clean)) {
        const [label, ...rest] = clean.split(':');
        if (label && rest.length) nutritionFacts[stripMarkdown(label)] = stripMarkdown(rest.join(':'));
      }
    });
  }

  // Parse times from nutrition or totalTime
  let prepTime = '', cookTime = '', totalTime = '';
  if (parsedRecipe.nutrition) {
    parsedRecipe.nutrition.split('\n').forEach(line => {
      const clean = line.replace(/^\*+|\*+$/g, '').trim();
      if (/prep time[:]?/i.test(clean)) prepTime = stripMarkdown(clean.replace(/prep time[:]?/i, ''));
      if (/cook time[:]?/i.test(clean)) cookTime = stripMarkdown(clean.replace(/cook time[:]?/i, ''));
      if (/total time[:]?/i.test(clean)) totalTime = stripMarkdown(clean.replace(/total time[:]?/i, ''));
    });
  }
  // Prefer parsedRecipe.totalTime if it is a valid value and not just 'Required:'
  if (parsedRecipe.totalTime && parsedRecipe.totalTime.toLowerCase() !== 'required:' && parsedRecipe.totalTime.trim() !== '') {
    totalTime = stripMarkdown(parsedRecipe.totalTime);
  }

  // Always show these nutrition facts
  const nutritionLabels = ['Calories', 'Protein', 'Carbs', 'Fat'];
  // Find the first valid serving size
  let displayServingSize = '';
  if (parsedRecipe.servingSize && !/^\(|note[:]?/i.test(stripMarkdown(parsedRecipe.servingSize))) {
    displayServingSize = stripMarkdown(parsedRecipe.servingSize);
  } else if (parsedRecipe.servings) {
    displayServingSize = `1 of ${stripMarkdown(parsedRecipe.servings)} portions (estimated)`;
  }

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      if (parsedRecipe.title) {
        const url = await getRecipeImage(parsedRecipe.title);
        setImageUrl(url);
      }
    }
    fetchImage();
  }, [parsedRecipe.title]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Image Section */}
      {imageUrl && (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={parsedRecipe.title}
            className="object-cover w-full h-full rounded-t-lg"
          />
        </div>
      )}
      {/* Title Section */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">
          {sanitizeText(parsedRecipe.title)}
        </h2>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Nutrition & Servings (moved above Ingredients) */}
        {(parsedRecipe.nutrition || displayServingSize || prepTime || cookTime || totalTime) && (
          <div className="mt-0 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Nutrition & Servings</h3>
            {/* Nutrition facts row (always show main 4) */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2 text-sm text-gray-800">
              {nutritionLabels.map(label => (
                <div key={label}><span className="font-semibold">{label}:</span> {nutritionFacts[label] || '—'}</div>
              ))}
            </div>
            {/* Times row */}
            {(prepTime || cookTime || totalTime) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2 text-sm text-gray-700">
                {prepTime && <div><span className="font-semibold">Prep Time:</span> {prepTime}</div>}
                {cookTime && <div><span className="font-semibold">Cook Time:</span> {cookTime}</div>}
                {totalTime && totalTime.toLowerCase() !== 'required:' && <div><span className="font-semibold">Total Time:</span> {totalTime}</div>}
              </div>
            )}
            {/* Serving Size row (only once) */}
            {displayServingSize && (
              <div className="mb-2 text-sm text-gray-700"><span className="font-semibold">Serving Size:</span> {displayServingSize}</div>
            )}
            {/* Nutrition note */}
            {nutritionNote && (
              <div className="text-xs text-gray-500 mt-2">{nutritionNote}</div>
            )}
          </div>
        )}
        {/* Ingredients */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
          <ul className="space-y-2">
            {ingredients.length > 0 ? (
              ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-500 mr-2">•</span>
                  <span className="text-gray-700">
                    <span className="font-medium">{ingredient}</span>
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">No ingredients listed.</li>
            )}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
          <ol className="space-y-3">
            {parsedRecipe.instructions.map((step, index) => (
              <li key={index} className="flex">
                <span className="text-gray-500 font-medium mr-3">{index + 1}.</span>
                <span className="text-gray-700">{sanitizeText(step)}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {parsedRecipe.tips && parsedRecipe.tips.length > 0 && (
          <div className="rounded-lg p-4" style={{ backgroundColor: '#C0E1B6' }}>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Cooking Tips</h3>
            <ul className="space-y-2">
              {parsedRecipe.tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">💡</span>
                  <span className="text-green-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to parse a string recipe into sections
function parseRecipeString(recipe: string): Recipe {
  const lines = recipe.split('\n').map(line => line.trim()).filter(Boolean);

  // Helper to find section indices
  const findSection = (header: string) =>
    lines.findIndex(line => line.toLowerCase().includes(header.toLowerCase()));

  // Section indices
  const titleIndex = 0;
  const ingredientsIndex = findSection('ingredient');
  const instructionsIndex = findSection('instruction');
  const substitutionsIndex = findSection('substitution');
  const tipsIndex = findSection('tip');
  const nutritionIndex = findSection('nutrition');
  const timeIndex = findSection('total time');
  const servesIndex = findSection('serves');
  const servingSizeIndex = lines.findIndex(line => /serving size|portion size|yield/i.test(line));

  // Section extraction helpers
  function extractSection(start: number, end: number) {
    return lines.slice(start, end).filter(Boolean);
  }

  // Ingredients: Remove bullets, numbers, and pointer artifacts
  const ingredients = ingredientsIndex !== -1 && instructionsIndex !== -1
    ? extractSection(ingredientsIndex + 1, instructionsIndex)
        .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(line => line.length > 0 && !/^(instructions?|substitutions?|tips?|nutritional|time)/i.test(line))
    : [];

  // Instructions: Remove leading numbers and pointer artifacts
  const instructions = instructionsIndex !== -1
    ? extractSection(instructionsIndex + 1, substitutionsIndex !== -1 ? substitutionsIndex : lines.length)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
    : [];

  // Substitutions and tips (optional)
  const substitutions = substitutionsIndex !== -1 && tipsIndex !== -1
    ? extractSection(substitutionsIndex + 1, tipsIndex)
        .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(line => line.length > 0)
    : [];
  const tips = tipsIndex !== -1
    ? extractSection(tipsIndex + 1, nutritionIndex !== -1 ? nutritionIndex : lines.length)
        .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(line => line.length > 0)
    : [];

  // Nutrition extraction
  let nutrition = '';
  if (nutritionIndex !== -1) {
    for (let i = nutritionIndex + 1; i < lines.length; i++) {
      if (/^(serves|prep|cook|total time|yield|serving size)/i.test(lines[i])) break;
      nutrition += lines[i] + '\n';
    }
    nutrition = nutrition.trim();
  }

  // Title, servings, serving size, total time
  const title = lines[titleIndex] || 'Untitled Recipe';
  const servings = servesIndex !== -1 ? lines[servesIndex].replace(/serves:?/i, '').trim() : '';
  const servingSize = servingSizeIndex !== -1
    ? lines[servingSizeIndex].replace(/(serving size|portion size|yield)[:]?/i, '').trim()
    : '';
  const totalTime = timeIndex !== -1 ? lines[timeIndex].replace(/total time required:?/i, '').trim() : '';

  return {
    title,
    ingredients,
    instructions,
    substitutions,
    tips,
    nutrition,
    servings,
    servingSize,
    totalTime,
  };
} 