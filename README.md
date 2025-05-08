# Leftovers.wiki

A Next.js application that helps you create recipes from leftover ingredients using Google's Gemini AI.

## Features

- Input leftover ingredients
- Filter by dietary preferences (vegetarian, Indian cuisine, quick recipes)
- AI-powered recipe suggestions
- Clean, responsive UI
- Mobile-friendly design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Google Gemini AI API

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/leftovers_wiki.git
cd leftovers_wiki
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Deployment to Vercel

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [Vercel](https://vercel.com) and sign in with your GitHub account

3. Click "New Project"

4. Import your repository

5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: .next

6. Add Environment Variables:
   - Click "Environment Variables"
   - Add `NEXT_PUBLIC_GEMINI_API_KEY` with your Gemini API key
   - Click "Save"

7. Click "Deploy"

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key

## Project Structure

```
leftovers_wiki/
├── app/
│   ├── components/
│   │   ├── InputBox.tsx
│   │   ├── Loader.tsx
│   │   └── RecipeCard.tsx
│   ├── lib/
│   │   └── gemini.ts
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .env.local
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
