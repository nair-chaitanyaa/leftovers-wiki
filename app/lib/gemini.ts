interface RecipeOptions {
  diet: string;
  customDiet: string;
  quick: boolean;
  healthy: boolean;
  cuisine: string;
  customCuisine: string;
  allergens: string;
  difficulty: number;
  dishType: string;
  customDishType: string;
}

export async function getRecipeFromGemini(
  ingredients: string,
  options: RecipeOptions
): Promise<{ recipe: string; warning?: string }> {
  // Check for API key in both possible locations
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('API Key missing. Environment variables:', {
      NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    });
    throw new Error('Gemini API key is not set. Please check your .env.local file.');
  }

  if (!ingredients.trim()) {
    throw new Error('Where are the ingredients at, bro?');
  }

  const prompt = constructPrompt(ingredients, options);
  
  try {
    console.log('Making API call to Gemini...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      if (response.status === 429 || errorText.toLowerCase().includes('rate limit')) {
        throw new Error("Currently I can't process your request. Please try again in a bit.");
      }
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    const recipeText = data.candidates[0].content.parts[0].text;
    // Friendlier validation for Calories and Protein
    const hasCalories = /Calories\s*:\s*[~≈]?(Approximately\s*)?\d+/i.test(recipeText);
    const hasProtein = /Protein\s*:\s*[~≈]?(Approximately\s*)?\d+/i.test(recipeText);
    let warning = undefined;
    if (!hasCalories || !hasProtein) {
      warning = 'Nutrition information is incomplete: Calories or Protein is missing.';
    }
    return { recipe: recipeText, warning };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

function constructPrompt(ingredients: string, options: RecipeOptions): string {
  let prompt = `You are a helpful home cook. Given these ingredients: ${ingredients}, return a detailed recipe with:
1. Recipe Title
2. Ingredients List (format each ingredient as "quantity unit ingredient", e.g. "2 cups rice", "1 medium onion", "3 tablespoons oil")
3. Instructions (step-by-step)
4. Substitutions
5. Cooking Tips
6. Nutritional Information (calories, protein, carbs, fat per serving)
7. Total Time Required (prep + cook time in minutes)
8. Estimate and include a serving size (e.g., "serves 2-3 people", "1 cup per serving", or "makes 4 portions") based on the recipe.

Only return the recipe.`;

  if (options.dishType === 'other' && options.customDishType) {
    prompt += `\n- This should be a ${options.customDishType} dish.`;
  } else if (options.dishType) {
    prompt += `\n- This should be a ${options.dishType} dish.`;
  }
  if (options.diet === 'other' && options.customDiet) {
    prompt += `\n- Only use ingredients and methods suitable for: ${options.customDiet}.`;
  } else if (options.diet) {
    prompt += `\n- Only use ingredients and methods suitable for: ${options.diet}.`;
  }
  if (options.healthy) prompt += "\n- Only show healthy recipes. Avoid deep frying, excess oil, sugar, and processed foods. Prefer whole grains, lean proteins, and lots of vegetables.";
  if (options.cuisine === 'other' && options.customCuisine) {
    prompt += `\n- Focus on ${options.customCuisine} cuisine.`;
  } else if (options.cuisine !== 'other') {
    prompt += `\n- Focus on ${options.cuisine} cuisine.`;
  }
  if (options.quick) prompt += "\n- Limit prep time to under 20 minutes.";
  if (options.allergens && options.allergens.trim().length > 0) {
    prompt += `\n- Avoid all of these allergens: ${options.allergens}`;
  }
  if (options.difficulty) {
    prompt += `\n- Set the recipe difficulty to: ${options.difficulty} (1=easy, 5=hard).`;
  }
  if (options.difficulty >= 4) {
    prompt += "\n- Make the recipe especially innovative, creative, or unique. Use advanced or unexpected techniques, flavor combinations, or presentation ideas.";
  } else if (options.difficulty === 3) {
    prompt += "\n- Add a touch of creativity or a unique twist to the recipe.";
  }

  return prompt;
}

export async function getSubstitutionsFromGemini(
  ingredients: string[],
  options: RecipeOptions
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is not set. Please check your .env.local file.');
  }

  const prompt = `Given these ingredients that need substitutions: ${ingredients.join(', ')}, suggest possible substitutions for each ingredient that would work well in the same recipe. 

For each ingredient, provide the information in this exact format:

• [original ingredient name]
  [substitution option 1] (Note: [brief note about taste/texture/cooking changes])
  [substitution option 2] (Note: [brief note about taste/texture/cooking changes])
  [substitution option 3] (Note: [brief note about taste/texture/cooking changes])

Do NOT add a hyphen, dash, or bullet before each substitution. Just start each substitution on a new line, indented under the ingredient. Make sure to:
- Keep each substitution concise and clear
- Include specific quantities where relevant
- Make notes brief but informative
- Consider the cuisine style (${options.cuisine === 'other' ? options.customCuisine : options.cuisine})
- Add a blank line between different ingredients
- Keep the response clean and easy to read`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
} 