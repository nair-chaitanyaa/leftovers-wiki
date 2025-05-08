'use client';

import { useState, useEffect } from 'react';
import InputBox from './components/InputBox';
import RecipeCard from './components/RecipeCard';
import Loader from './components/Loader';
import { getRecipeFromGemini } from './lib/gemini';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    vegetarian: false,
    indian: false,
    quick: false,
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            leftovers.wiki
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Enter your leftover ingredients and discover what you can make
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputBox
            value={ingredients}
            onChange={setIngredients}
          />

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              type="button"
              onClick={() => toggleFilter('vegetarian')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filters.vegetarian
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Vegetarian Only
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('indian')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filters.indian
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Indian Cuisine Only
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('quick')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filters.quick
                  ? 'bg-blue-100 text-blue-800'
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
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-8">
            <RecipeCard recipe={recipe} />
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
