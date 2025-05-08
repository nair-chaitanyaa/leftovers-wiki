interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  substitutions?: string[];
  tips?: string[];
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

        {/* Substitutions */}
        {parsedRecipe.substitutions && parsedRecipe.substitutions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Substitutions</h3>
            <ul className="space-y-2">
              {parsedRecipe.substitutions.map((sub, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-blue-700">{sub}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        {parsedRecipe.tips && parsedRecipe.tips.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
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
  
  // Find section indices
  const titleIndex = lines.findIndex(line => line.startsWith('1. Recipe Title'));
  const ingredientsIndex = lines.findIndex(line => line.startsWith('2. Ingredients'));
  const instructionsIndex = lines.findIndex(line => line.startsWith('3. Instructions'));
  const substitutionsIndex = lines.findIndex(line => line.startsWith('4. Substitutions'));
  const tipsIndex = lines.findIndex(line => line.startsWith('5. Cooking Tips'));

  // Extract sections
  const title = lines[titleIndex + 1] || 'Untitled Recipe';
  const ingredients = lines.slice(ingredientsIndex + 1, instructionsIndex)
    .filter(line => line.startsWith('-'))
    .map(line => line.replace('-', '').trim())
    .filter(line => line.length > 0); // Filter out empty lines
  
  const instructions = lines.slice(instructionsIndex + 1, substitutionsIndex)
    .filter(line => /^\d+\./.test(line))
    .map(line => line.replace(/^\d+\./, '').trim());
  
  const substitutions = substitutionsIndex !== -1 
    ? lines.slice(substitutionsIndex + 1, tipsIndex)
      .filter(line => line.startsWith('-'))
      .map(line => line.replace('-', '').trim())
    : [];
  
  const tips = tipsIndex !== -1
    ? lines.slice(tipsIndex + 1)
      .filter(line => line.startsWith('-'))
      .map(line => line.replace('-', '').trim())
    : [];

  return {
    title,
    ingredients,
    instructions,
    substitutions,
    tips
  };
} 