import { config } from 'dotenv';
import { resolve } from 'path';
import { getRecipeFromGemini } from './gemini';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testGeminiAPI() {
  console.log('Testing Gemini API integration...');
  
  // Debug environment variables
  console.log('\nEnvironment Variables Check:');
  console.log('NEXT_PUBLIC_GEMINI_API_KEY exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  console.log('NEXT_PUBLIC_GEMINI_API_KEY length:', process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length);
  console.log('NEXT_PUBLIC_GEMINI_API_KEY first 4 chars:', process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 4));
  console.log('Current working directory:', process.cwd());
  
  try {
    const testIngredients = "leftover rice, onion, capsicum";
    const testOptions = {
      vegetarian: true,
      quick: true,
      cuisine: 'indian',
      customCuisine: ''
    };

    console.log('\nSending test request with:');
    console.log('Ingredients:', testIngredients);
    console.log('Options:', testOptions);
    console.log('\nWaiting for response...\n');

    const result = await getRecipeFromGemini(testIngredients, testOptions);
    
    console.log('✅ API Response received successfully!');
    console.log('\nRecipe:');
    console.log('----------------------------------------');
    console.log(result);
    console.log('----------------------------------------');
  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('\nTroubleshooting:');
        console.error('1. Check if .env.local exists');
        console.error('2. Verify NEXT_PUBLIC_GEMINI_API_KEY is set');
        console.error('3. Make sure the API key is valid');
        console.error('4. Try restarting your terminal/IDE');
        console.error('5. Check if the API key is properly formatted (no extra spaces or quotes)');
      }
    }
  }
}

// Run the test
testGeminiAPI(); 