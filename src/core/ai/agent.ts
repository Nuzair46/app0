import axios from 'axios';
import { PromptTemplate } from './prompts';

export interface AppSpec {
  name: string;
  description: string;
}

export interface GeneratedAppFile {
  path: string;
  content: string;
}

export interface GeneratedApp {
  files: GeneratedAppFile[];
  packageJson: any;
}

export class AIAgent {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY not found in environment variables');
    }
  }

  async generateApp(appSpec: AppSpec): Promise<GeneratedApp> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const prompt = PromptTemplate.createAppGenerationPrompt(appSpec);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful Next.js developer assistant. Create functional web applications with React, TypeScript, and Tailwind CSS based on user specifications. Always provide complete, working code examples.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedCode = response.data.choices[0].message.content;
      return this.parseGeneratedApp(generatedCode, appSpec);
      
    } catch (error: any) {
      console.error('Error generating app with AI:', error);
      throw new Error(`Failed to generate app: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private parseGeneratedApp(generatedCode: string, appSpec: AppSpec): GeneratedApp {
    try {
      console.log('Parsing AI generated code...');
      console.log('Raw AI response length:', generatedCode.length);
      console.log('AI response preview:', generatedCode.substring(0, 800));
      
      const jsonMatch = generatedCode.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        console.error('No JSON block found in AI response');
        console.log('Full AI response:', generatedCode);
        throw new Error('Could not find JSON response in generated code');
      }

      console.log('Found JSON block, parsing...');
      let jsonContent = jsonMatch[1];
      
      // Clean up common JSON formatting issues from AI responses
      jsonContent = jsonContent
        .replace(/`{/g, '"{')  // Replace backticks with quotes
        .replace(/}`/g, '}"')  // Replace backticks with quotes
        .replace(/`/g, '"')    // Replace remaining backticks with quotes
        .replace(/\n\s*\n/g, '\n'); // Remove extra newlines
      
      console.log('Cleaned JSON preview:', jsonContent.substring(0, 200));
      const parsed = JSON.parse(jsonContent);
      
      if (!parsed.files || !Array.isArray(parsed.files)) {
        console.error('Invalid response structure:', Object.keys(parsed));
        throw new Error('Invalid response format: missing files array');
      }

      console.log(`✓ Parsed ${parsed.files.length} files from AI response`);
      
      // Validate that this is not a placeholder app
      this.validateAppIsNotPlaceholder(parsed, appSpec);
      
      if (!parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid response format: missing files array');
      }

      // Process and validate all files
      parsed.files = parsed.files.map((file: any) => {
        // Handle JSON files that might be double-encoded
        if (file.path.endsWith('.json')) {
          try {
            // Try to parse as JSON to validate and reformat
            const jsonContent = JSON.parse(file.content);
            file.content = JSON.stringify(jsonContent, null, 2);
          } catch {
            // If it fails, it might be a string-encoded JSON, try to parse that
            try {
              const stringContent = JSON.parse(`"${file.content}"`);
              const jsonContent = JSON.parse(stringContent);
              file.content = JSON.stringify(jsonContent, null, 2);
            } catch {
              console.warn(`Invalid JSON in file ${file.path}, using fallback`);
              if (file.path === 'package.json') {
                file.content = JSON.stringify(this.generateDefaultPackageJson(appSpec), null, 2);
              } else if (file.path === 'tsconfig.json') {
                file.content = JSON.stringify(this.generateDefaultTsConfig(), null, 2);
              }
            }
          }
        }
        return file;
      });

      // Ensure we have a valid package.json
      const packageJsonFile = parsed.files.find((f: any) => f.path === 'package.json');
      let packageJson;
      
      if (packageJsonFile) {
        try {
          packageJson = JSON.parse(packageJsonFile.content);
        } catch {
          packageJson = this.generateDefaultPackageJson(appSpec);
          packageJsonFile.content = JSON.stringify(packageJson, null, 2);
        }
      } else {
        packageJson = this.generateDefaultPackageJson(appSpec);
        parsed.files.push({
          path: 'package.json',
          content: JSON.stringify(packageJson, null, 2)
        });
      }

      return {
        files: parsed.files,
        packageJson
      };
      
    } catch (error: any) {
      console.error('Error parsing generated app:', error);
      console.error('This means either:');
      console.error('1. AI generated placeholder/template instead of functional app');
      console.error('2. AI response was malformed or incomplete');
      console.error('3. Network/connectivity issues with OpenAI API');
      
      // Force user to see the real error instead of falling back to placeholder
      throw new Error(`AI failed to generate functional app: ${error.message}. Please try again with a more specific description.`);
    }
  }

  private generateDefaultPackageJson(appSpec: AppSpec) {
    return {
      name: appSpec.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^13.5.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        sqlite3: '^5.1.0',
        '@tailwindcss/typography': '^0.5.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        autoprefixer: '^10.0.0',
        postcss: '^8.0.0',
        tailwindcss: '^3.0.0',
        typescript: '^5.0.0'
      }
    };
  }

  private generateDefaultTsConfig() {
    return {
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules']
    };
  }

  private validateAppIsNotPlaceholder(parsed: any, appSpec: AppSpec): void {
    // Find main page component
    const mainPageFile = parsed.files.find((f: any) => 
      f.path === 'pages/index.tsx' || f.path === 'pages/index.js'
    );
    
    if (!mainPageFile) {
      throw new Error('No main page component found in generated app');
    }

    const content = mainPageFile.content.toLowerCase();
    
    // Check for placeholder indicators
    const placeholderIndicators = [
      'placeholder app generated by app0',
      'this is a placeholder',
      'add functionality here',
      'todo: implement',
      'coming soon',
      'under construction',
      'template only'
    ];

    for (const indicator of placeholderIndicators) {
      if (content.includes(indicator)) {
        console.error(`❌ AI generated placeholder app with text: "${indicator}"`);
        throw new Error(`AI generated a placeholder app instead of functional code. Rejecting response.`);
      }
    }

    // Check for minimal functionality indicators
    const functionalIndicators = [
      'usestate',
      'onclick',
      'onsubmit',
      'setstate', 
      'handleclick',
      'handlesave',
      'handleadd',
      'handledelete',
      'handleedit'
    ];

    const hasFunction = functionalIndicators.some(indicator => content.includes(indicator));
    
    if (!hasFunction) {
      console.error('❌ AI generated app lacks functional components (no state management or event handlers)');
      throw new Error('Generated app appears to lack functional components. Rejecting response.');
    }

    console.log('✅ App validation passed - appears to be functional');
  }

  private generateFallbackApp(appSpec: AppSpec): GeneratedApp {
    const packageJson = this.generateDefaultPackageJson(appSpec);
    
    const files: GeneratedAppFile[] = [
      {
        path: 'package.json',
        content: JSON.stringify(packageJson, null, 2)
      },
      {
        path: 'pages/index.tsx',
        content: `import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          ${appSpec.name}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ${appSpec.description}
        </p>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">
            This is a placeholder app generated by App0. 
            The AI will create more sophisticated functionality based on your requirements.
          </p>
        </div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'pages/_app.tsx',
        content: `import '../styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}`
      },
      {
        path: 'styles/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      },
      {
        path: 'tailwind.config.js',
        content: `module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
      },
      {
        path: 'postcss.config.js',
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
      },
      {
        path: 'next.config.js',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;`
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'es5',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'node',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
          exclude: ['node_modules']
        }, null, 2)
      }
    ];

    return { files, packageJson };
  }
}