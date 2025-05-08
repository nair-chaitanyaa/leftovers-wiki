'use client';

import { useState, useEffect } from 'react';
import InputBox from './components/InputBox';
import RecipeCard from './components/RecipeCard';
import Loader from './components/Loader';
import { getRecipeFromGemini, getSubstitutionsFromGemini } from './lib/gemini';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<string | null>(null);
  const [isLoadingSubstitutions, setIsLoadingSubstitutions] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    vegetarian: false,
    quick: false,
    cuisine: 'indian',
    customCuisine: ''
  });

  // Define available cuisines
  const cuisines = [
    { value: 'indian', label: 'Indian (Default)' },
    { value: 'italian', label: 'Italian' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'thai', label: 'Thai' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'american', label: 'American' },
    { value: 'other', label: 'Other' }
  ];

  // Load sample recipe on first render
  useEffect(() => {
    const loadSampleRecipe = async () => {
      setIsLoading(true);
      try {
        const sampleIngredients = "leftover rice, onion, capsicum";
        setIngredients(sampleIngredients);
        const result = await getRecipeFromGemini(sampleIngredients, filters);
        setRecipe(result);
      } catch (err) {
        console.error('Error loading sample recipe:', err);
        setError('Failed to load sample recipe');
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleRecipe();
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) {
      setError('Please enter some ingredients');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const result = await getRecipeFromGemini(ingredients, filters);
      setRecipe(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const handleGetSubstitutions = async () => {
    if (!recipe || selectedIngredients.length === 0) return;
    
    setIsLoadingSubstitutions(true);
    setSubstitutions(null);
    
    try {
      const result = await getSubstitutionsFromGemini(selectedIngredients, filters);
      setSubstitutions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate substitutions');
    } finally {
      setIsLoadingSubstitutions(false);
    }
  };

  // Extract ingredients when recipe is set
  useEffect(() => {
    if (recipe) {
      // Split the recipe into lines and find the ingredients section
      const lines = recipe.split('\n');
      const ingredientsStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('ingredients') || 
        line.toLowerCase().includes('ingredient list')
      );
      
      if (ingredientsStartIndex !== -1) {
        let foundNextSection = false;
        const ingredients = lines
          .slice(ingredientsStartIndex + 1)
          .filter((line: string) => {
            if (foundNextSection) return false;
            
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('instructions') || 
                lowerLine.includes('directions') || 
                lowerLine.includes('method')) {
              foundNextSection = true;
              return false;
            }
            
            return line.trim() !== '';
          })
          .map((line: string) => line.trim())
          .filter((line: string) => {
            // Remove section headers and empty lines
            const lowerLine = line.toLowerCase();
            return !lowerLine.includes('ingredients') && 
                   !lowerLine.includes('ingredient list') &&
                   line.trim() !== '';
          })
          .map((line: string) => {
            // Remove bullet points, numbers, and extra spaces
            return line.replace(/^[-*•\d.]+\s*/, '').trim();
          });

        setAvailableIngredients(ingredients);
        setSelectedIngredients([]); // Reset selections when new recipe is loaded
      }
    }
  }, [recipe]);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  return (
    <div className="min-h-screen bg-[#C0E1B6]">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {/* Removed title and subtitle from here */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputBox
            value={ingredients}
            onChange={setIngredients}
          />

          <div className="flex flex-wrap gap-4 justify-center">
            {/* Cuisine Dropdown */}
            <select
              value={filters.cuisine}
              onChange={(e) => setFilters(prev => ({ ...prev, cuisine: e.target.value, customCuisine: '' }))}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {cuisines.map((cuisine) => (
                <option key={cuisine.value} value={cuisine.value}>
                  {cuisine.label}
                </option>
              ))}
            </select>

            {/* Custom Cuisine Input - Only show when "Other" is selected */}
            {filters.cuisine === 'other' && (
              <input
                type="text"
                value={filters.customCuisine}
                onChange={(e) => setFilters(prev => ({ ...prev, customCuisine: e.target.value }))}
                placeholder="Enter cuisine type..."
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}

            <button
              type="button"
              onClick={() => toggleFilter('vegetarian')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filters.vegetarian
                  ? 'bg-[#388E3C] text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Vegetarian Only
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('quick')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filters.quick
                  ? 'bg-[#388E3C] text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Under 20 Minutes
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-[#CF5A81] text-white font-medium rounded-lg hover:bg-[#BF3764] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D285E0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              What can I make?
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <Loader />}

        {/* Recipe Output */}
        {recipe && !isLoading && (
          <div className="mt-8 space-y-6">
            <RecipeCard recipe={recipe} />
            
            {/* Ingredient Selection for Substitutions */}
            <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Ingredients for Substitutions</h2>
              <p className="text-gray-600 mb-4">Check the ingredients you need substitutions for:</p>
              <div className="space-y-2">
                {availableIngredients.map((ingredient, index) => (
                  <label
                    key={index}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(ingredient)}
                      onChange={() => toggleIngredient(ingredient)}
                      className="h-4 w-4 text-[#388E3C] border-gray-300 rounded focus:ring-[#388E3C]"
                    />
                    <span className="text-gray-900 text-sm">{ingredient}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Substitutions Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGetSubstitutions}
                disabled={isLoadingSubstitutions || selectedIngredients.length === 0}
                className="px-6 py-3 bg-[#CF5A81] text-white font-medium rounded-lg hover:bg-[#BF3764] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D285E0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingSubstitutions 
                  ? 'Generating Substitutions...' 
                  : selectedIngredients.length === 0
                    ? 'Select Ingredients First'
                    : `Show Substitutions for ${selectedIngredients.length} Ingredient${selectedIngredients.length === 1 ? '' : 's'}`
                }
              </button>
            </div>

            {/* Substitutions Output */}
            {substitutions && !isLoadingSubstitutions && (
              <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredient Substitutions</h2>
                <div className="space-y-6">
                  {substitutions.split(/\n\n+/).map((section, index) => {
                    const lines = section.split('\n').filter(line => line.trim());
                    if (lines.length === 0) return null;
                    const ingredient = lines[0].replace(/^•\s*/, '').trim();
                    // Omit if ingredient is in the user's input
                    const userIngredients = ingredients
                      .split(',')
                      .map(i => i.trim().toLowerCase())
                      .filter(Boolean);
                    if (userIngredients.some(ui => ingredient.toLowerCase().includes(ui))) return null;
                    // Substitutions: lines that are not empty and not the ingredient line
                    const subs = lines.slice(1).filter(line => line.trim() !== '');
                    return (
                      <div key={index} className="space-y-2">
                        <div className="font-semibold text-gray-900">{ingredient}</div>
                        <ul className="list-disc ml-6 space-y-1">
                          {subs.map((sub, subIdx) => {
                            // Remove any leading hyphens/dashes/bullets and split substitution and note
                            const match = sub.match(/^[-•]?\s*(.*?)(\(Note:.*\))?$/i);
                            return (
                              <li key={subIdx} className="text-gray-800">
                                {match ? (
                                  <>
                                    <span>{match[1].replace(/^[-•]?\s*/, '').trim()}</span>
                                    {match[2] && (
                                      <span className="block text-xs text-gray-500 ml-1">{match[2].replace(/^\(Note:\s*|\)$/g, '')}</span>
                                    )}
                                  </>
                                ) : sub.replace(/^[-•]?\s*/, '')}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State - Only show if no recipe and not loading */}
        {!recipe && !isLoading && !error && (
          <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe Suggestions</h2>
            <div className="text-gray-500 text-center py-8">
              Enter your ingredients above to get recipe suggestions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
