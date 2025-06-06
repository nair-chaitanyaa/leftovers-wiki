import { useEffect, useState } from "react";

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

function parseTimeToMinutes(timeStr: string): number {
  const hours = timeStr.match(/(\d+)\s*h/i)?.[1] || '0';
  const minutes = timeStr.match(/(\d+)\s*m/i)?.[1] || '0';
  return parseInt(hours) * 60 + parseInt(minutes);
}

function formatTimeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }
  return `${minutes}m`;
}

// Helper function to parse fractions and numbers
function parseNumber(str: string): number {
  // Handle fractions like "1/2", "3/4"
  const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [_, numerator, denominator] = fractionMatch;
    return parseInt(numerator) / parseInt(denominator);
  }
  // Handle decimal numbers
  return parseFloat(str) || 0;
}

// Helper function to scale ingredient quantities
function scaleIngredient(ingredient: string, scaleFactor: number): string {
  // Match common quantity patterns
  const patterns = [
    // Match fractions like "1/2", "3/4"
    /(\d+\/\d+)/g,
    // Match decimal numbers like "1.5", "2.0"
    /(\d+\.\d+)/g,
    // Match whole numbers
    /(\d+)/g
  ];

  let scaledIngredient = ingredient;
  
  // Try each pattern
  for (const pattern of patterns) {
    scaledIngredient = scaledIngredient.replace(pattern, (match) => {
      const num = parseNumber(match);
      const scaled = num * scaleFactor;
      
      // Format the result
      if (Number.isInteger(scaled)) {
        return scaled.toString();
      } else {
        // Convert to fraction if it's a common fraction
        const commonFractions: { [key: number]: string } = {
          0.25: '1/4',
          0.33: '1/3',
          0.5: '1/2',
          0.67: '2/3',
          0.75: '3/4'
        };
        return commonFractions[scaled] || scaled.toFixed(1);
      }
    });
  }

  return scaledIngredient;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [desiredServings, setDesiredServings] = useState<number>(1);
  const [originalServings, setOriginalServings] = useState<number>(1);
  
  // If recipe is a string, parse it into sections
  const parsedRecipe = typeof recipe === 'string' 
    ? parseRecipeString(recipe)
    : recipe;

  // Extract original servings from recipe
  useEffect(() => {
    if (parsedRecipe.servings) {
      const match = parsedRecipe.servings.match(/\d+/);
      if (match) {
        setOriginalServings(parseInt(match[0]));
        setDesiredServings(parseInt(match[0])); // Initialize with original servings
      }
    }
  }, [parsedRecipe.servings]);

  // Fallback: If ingredients are missing, try to extract from raw string (flexible)
  let ingredients = parsedRecipe.ingredients?.length
    ? parsedRecipe.ingredients.map(sanitizeText)
    : (typeof recipe === 'string' ? extractIngredientsFlexible(recipe) : []);

  // Scale ingredients based on desired servings
  const scaledIngredients = ingredients.map(ingredient => 
    scaleIngredient(ingredient, desiredServings / originalServings)
  );

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

  // Fallback: Estimate calories if missing
  if (!nutritionFacts['Calories'] && ingredients.length > 0) {
    // Simple calorie lookup for common ingredients (per unit)
    const calorieLookup: { [key: string]: number } = {
      'olive oil': 120, // per tablespoon
      'onion': 45, // per medium
      'garlic': 4, // per clove
      'ginger': 2, // per 1/2 inch
      'turmeric powder': 8, // per teaspoon
      'cumin powder': 8, // per teaspoon
      'coriander powder': 6, // per teaspoon
      'garam masala': 8, // per teaspoon
      'red pepper flakes': 6, // per teaspoon
      'spinach': 7, // per 1 cup raw
      'vegetable broth': 10, // per 1/4 cup
      'goat cheese': 75, // per 30g
      'cilantro': 1, // per tablespoon
      'brown rice': 110 // per 1/2 cup cooked
    };
    let totalCalories = 0;
    ingredients.forEach(ingredient => {
      for (const key in calorieLookup) {
        if (ingredient.toLowerCase().includes(key)) {
          // Estimate quantity multiplier
          let multiplier = 1;
          if (/\d+/.test(ingredient)) {
            const numMatch = ingredient.match(/\d+(\.\d+)?/);
            if (numMatch) multiplier = parseFloat(numMatch[0]);
          }
          // Special handling for goat cheese (per 30g)
          if (key === 'goat cheese' && /\d+/.test(ingredient)) {
            const gMatch = ingredient.match(/(\d+)g/);
            if (gMatch) multiplier = parseFloat(gMatch[1]) / 30;
          }
          totalCalories += calorieLookup[key] * multiplier;
          break;
        }
      }
    });
    if (totalCalories > 0) {
      nutritionFacts['Calories'] = `~${Math.round(totalCalories)} (estimated)`;
    }
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
  
  // Compute total time from prep and cook time if available
  if (prepTime && cookTime) {
    const prepMinutes = parseTimeToMinutes(prepTime);
    const cookMinutes = parseTimeToMinutes(cookTime);
    const computedTotalMinutes = prepMinutes + cookMinutes;
    if (computedTotalMinutes > 0) {
      totalTime = formatTimeFromMinutes(computedTotalMinutes);
    }
  }
  // Prefer parsedRecipe.totalTime if it is a valid value and not just 'Required:'
  else if (parsedRecipe.totalTime && parsedRecipe.totalTime.toLowerCase() !== 'required:' && parsedRecipe.totalTime.trim() !== '') {
    totalTime = stripMarkdown(parsedRecipe.totalTime);
  }

  // Always show these nutrition facts
  const nutritionLabels = ['Calories', 'Protein', 'Carbs', 'Fat'];
  // Find the first valid serving size
  let displayServingSize = '';
  if (parsedRecipe.servingSize && !/\(|note[:]?/i.test(stripMarkdown(parsedRecipe.servingSize))) {
    // Try to match the format 'X per serving' (e.g., '1 cup per serving')
    const match = parsedRecipe.servingSize.match(/([\d.]+\s*\w+)\s+per\s+serving/i);
    if (match) {
      displayServingSize = match[0];
    } else {
      // If not in the right format, try to reformat
      displayServingSize = `1 ${parsedRecipe.servingSize.replace(/^(a|an)\s+/i, '').replace(/\.$/, '')} per serving`;
    }
  } else if (parsedRecipe.servings) {
    displayServingSize = `1 of ${stripMarkdown(parsedRecipe.servings)} portions (estimated)`;
  } else {
    displayServingSize = 'Serving size not specified';
  }

  // Helper to extract numbers from nutrition facts
  function extractNumber(str: string) {
    const match = str.match(/\d+/g);
    return match ? match.join('-') : '';
  }

  // Format nutrition facts
  const formattedNutrition = {
    Calories: nutritionFacts['Calories']
      ? `Approximately ${extractNumber(nutritionFacts['Calories'])} calories`
      : 'Approximately — calories',
    Protein: nutritionFacts['Protein']
      ? `${extractNumber(nutritionFacts['Protein'])} grams`
      : '— grams',
    Carbs: nutritionFacts['Carbs']
      ? `${extractNumber(nutritionFacts['Carbs'])} grams`
      : '— grams',
    Fat: nutritionFacts['Fat']
      ? `${extractNumber(nutritionFacts['Fat'])} grams`
      : '— grams',
  };

  // Format time values
  function getMinutes(timeStr: string): string {
    if (!timeStr) return '—';
    const minutes = parseTimeToMinutes(timeStr);
    return minutes > 0 ? `${minutes} minutes` : '—';
  }
  const formattedPrepTime = getMinutes(prepTime);
  const formattedCookTime = getMinutes(cookTime);
  let totalMinutes = 0;
  if (prepTime) totalMinutes += parseTimeToMinutes(prepTime);
  if (cookTime) totalMinutes += parseTimeToMinutes(cookTime);
  const formattedTotalTime = totalMinutes > 0 ? `${totalMinutes} minutes` : '—';

  // Format serving size
  let formattedServingSize = '— servings';
  if (parsedRecipe.servings && parsedRecipe.servings !== '') {
    formattedServingSize = `${extractNumber(parsedRecipe.servings)} servings`;
  } else if (parsedRecipe.servingSize && parsedRecipe.servingSize !== '') {
    formattedServingSize = `${extractNumber(parsedRecipe.servingSize)} servings`;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Title Section */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">
          {sanitizeText(parsedRecipe.title)}
        </h2>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Portion Size Control */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label htmlFor="servings" className="text-sm font-medium text-gray-700">
            Adjust servings:
          </label>
          <input
            type="number"
            id="servings"
            min="1"
            value={desiredServings}
            onChange={(e) => setDesiredServings(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          />
          <span className="text-sm text-gray-500">
            {originalServings > 1 ? `(Original recipe serves ${originalServings})` : ''}
          </span>
        </div>

        {/* Nutrition & Servings */}
        {(parsedRecipe.nutrition || displayServingSize || prepTime || cookTime || totalTime) && (
          <div className="mt-0 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Nutrition & Servings</h3>
            {/* Top line: Calories and Serving size */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2 text-sm text-gray-800">
              <div><span className="font-semibold">Calories:</span> {formattedNutrition.Calories}</div>
              <div><span className="font-semibold">Serving size:</span> {formattedServingSize}</div>
            </div>
            {/* Second line: Carbs, Protein, Fat */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2 text-sm text-gray-800">
              <div><span className="font-semibold">Carbs:</span> {formattedNutrition.Carbs}</div>
              <div><span className="font-semibold">Protein:</span> {formattedNutrition.Protein}</div>
              <div><span className="font-semibold">Fat:</span> {formattedNutrition.Fat}</div>
            </div>
            {/* Third line: Prep, Cook, Total time */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2 text-sm text-gray-700">
              <div><span className="font-semibold">Prep time:</span> {formattedPrepTime}</div>
              <div><span className="font-semibold">Cook time:</span> {formattedCookTime}</div>
              <div><span className="font-semibold">Total time:</span> {formattedTotalTime}</div>
            </div>
            {nutritionNote && (
              <div className="text-xs text-gray-500 mt-2">{nutritionNote}</div>
            )}
          </div>
        )}

        {/* Ingredients */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
          <ul className="space-y-2">
            {scaledIngredients.length > 0 ? (
              scaledIngredients.map((ingredient, index) => (
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
                  <span className="text-green-700">{stripMarkdown(tip)}</span>
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