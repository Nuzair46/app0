import { AppSpec } from './agent';

export class PromptTemplate {
  static createAppGenerationPrompt(appSpec: AppSpec): string {
    return `
You are an expert Next.js developer. Create a FULLY FUNCTIONAL, COMPLETE Next.js application (not a placeholder or template) based on this specification:

**App Name:** ${appSpec.name}
**Description:** ${appSpec.description}

CRITICAL REQUIREMENTS:
- Create a WORKING application with REAL functionality (NO placeholders)
- Include ALL necessary components and logic to make the app actually work
- Add complete CRUD operations where applicable (Create, Read, Update, Delete)  
- Use React useState and useEffect hooks for real state management
- Include proper form handling and validation
- Add real interactive features based on the app description

**Technical Stack:**
- Next.js 13.5+ with TypeScript (compatible with Node 18+)
- Tailwind CSS for styling
- SQLite database integration where needed (use better-sqlite3 if database needed)
- Pages Router (not App Router)
- Responsive design

**Technical Specifications:**
- Use the App Router (app/ directory) if complex routing is needed, otherwise use Pages Router
- Include proper TypeScript types
- Use React hooks for state management
- Create reusable components
- Include proper form validation where applicable
- Add loading states for better UX

CRITICAL: RESPONSE FORMAT

You must return your response in this exact JSON structure:

\`\`\`json
{
  "files": [
    {
      "path": "package.json",
      "content": "{\"name\":\"my-app\",\"version\":\"1.0.0\",\"private\":true,\"scripts\":{\"dev\":\"next dev\",\"build\":\"next build\",\"start\":\"next start\"},\"dependencies\":{\"next\":\"^13.5.0\",\"react\":\"^18.2.0\",\"react-dom\":\"^18.2.0\",\"tailwindcss\":\"^3.0.0\"}}"
    },
    {
      "path": "pages/index.tsx", 
      "content": "import React, { useState } from 'react';\n\nexport default function Home() {\n  const [todos, setTodos] = useState([]);\n  // REAL FUNCTIONAL CODE HERE\n  return <div>WORKING APP</div>;\n}"
    },
    {
      "path": "pages/_app.tsx",
      "content": "import '../styles/globals.css';\nimport type { AppProps } from 'next/app';\n\nexport default function App({ Component, pageProps }: AppProps) {\n  return <Component {...pageProps} />;\n}"
    },
    {
      "path": "styles/globals.css",
      "content": "@tailwind base;\n@tailwind components;\n@tailwind utilities;"
    },
    {
      "path": "next.config.js", 
      "content": "/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n};\n\nmodule.exports = nextConfig;"
    },
    {
      "path": "tsconfig.json",
      "content": "{\"compilerOptions\":{\"target\":\"es5\",\"lib\":[\"dom\",\"dom.iterable\",\"esnext\"],\"allowJs\":true,\"skipLibCheck\":true,\"strict\":true,\"forceConsistentCasingInFileNames\":true,\"noEmit\":true,\"esModuleInterop\":true,\"module\":\"esnext\",\"moduleResolution\":\"node\",\"resolveJsonModule\":true,\"isolatedModules\":true,\"jsx\":\"preserve\",\"incremental\":true},\"include\":[\"next-env.d.ts\",\"**/*.ts\",\"**/*.tsx\"],\"exclude\":[\"node_modules\"]}"
    },
    {
      "path": "tailwind.config.js",
      "content": "module.exports = {\n  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: []\n};"
    },
    {
      "path": "postcss.config.js",
      "content": "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};"
    }
  ]
}
\`\`\`

❌ DO NOT RETURN: A single package.json object
❌ DO NOT RETURN: Individual files outside the "files" array
✅ MUST RETURN: The exact structure shown above with "files" array

**IMPORTANT:** Your response must be ONLY the JSON object above. No explanation text before or after.

🎯 **SPECIFIC FUNCTIONAL REQUIREMENTS:**

For TODO APPS: Create add/edit/delete/complete functionality, local state management, categories
For NOTEPAD/TEXT APPS: Real text editing, save/load functionality, formatting options  
For CALCULATORS: Working buttons, mathematical operations, display results
For GAMES: Interactive gameplay, scoring, win/lose conditions
For DATA APPS: Forms that work, data persistence, search/filter functionality

**MANDATORY IMPLEMENTATION:**
1. ✅ Complete file content - every file must be production-ready
2. ✅ Real React components with working useState/useEffect
3. ✅ Functional forms with proper onSubmit handlers 
4. ✅ Interactive UI elements that actually respond to clicks
5. ✅ Proper TypeScript interfaces and types
6. ✅ Modern React patterns (no class components)
7. ✅ All dependencies included in package.json
8. ✅ Responsive Tailwind CSS styling
9. ✅ Error handling and loading states
10. ✅ Local storage or state persistence where needed

ABSOLUTELY FORBIDDEN:
- Placeholder text like "This is a placeholder app"
- Comments saying "Add functionality here"  
- Empty function bodies
- TODO comments for missing features
- Non-functional buttons or forms
- Template-only apps without real logic

VALIDATION CHECK:
Before responding, ensure your app has:
- Working interactive elements (buttons, forms, inputs)
- Real state management with React hooks
- Actual functionality that matches the app description
- Complete implementation, not a starting template

Create a REAL, WORKING application that a user can immediately use for its intended purpose!
`;
  }
}