# App0

App0 is a desktop application that allows users to generate and run small personal apps ("applets") using AI — without coding, terminals, or installing anything else.

## Features

- **Graphical Desktop App**: Built with Electron for cross-platform compatibility
- **AI-Powered App Generation**: Uses OpenAI GPT-4 to generate complete Next.js applications
- **Embedded Runtime**: Includes bundled Bun runtime so users never need to install Node.js/npm
- **App Management**: Built-in interface to create, start, stop, and delete generated apps
- **Sandboxed Execution**: Each app runs in isolation on its own port
- **Local-First**: Everything runs locally unless user chooses to upload apps

## Getting Started

### Prerequisites

- Node.js 22
- npm or yarn
- **OpenAI API Key** (required for app generation)

### Quick Setup

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd app0
   yarn install  # or npm install
   ```
   > This automatically downloads the bundled Bun runtime (~2 minutes)

2. **Set your OpenAI API key**:
   ```bash
   export OPENAI_API_KEY="sk-your-actual-openai-api-key-here"
   ```
   > ⚠️ **Important**: Use a real OpenAI API key, not "test" or placeholder values

3. **Start App0**:
   ```bash
   yarn dev  # or npm run dev
   ```
   > This builds the app and launches Electron (~30 seconds first time)

4. **Create your first app**:
   - Click "Create New App" in the App0 interface
   - Describe what you want (e.g., "A todo app with categories")
   - Wait for AI generation (~30-60 seconds)
   - Click "Start" to launch your generated app!

## How It Works

1. **App Generation**: Describe your app → GPT-4 generates complete Next.js code → App0 builds it automatically
2. **App Management**: All apps appear in your App0 dashboard with start/stop/delete controls
3. **Embedded Viewing**: Running apps appear inside App0's interface (no separate browser tabs needed)
4. **Local Development**: All apps run locally on ports 3001-3100 using the bundled Bun runtime

## Architecture

```
App0/
├── src/
│   ├── core/              # Core functionality
│   │   ├── ai/            # AI agent for GPT-4 communication
│   │   ├── builder/       # App building, dependency installation
│   │   ├── runner/        # Process management for running apps
│   │   └── registry.ts    # App metadata storage
│   ├── gui/               # React frontend
│   │   ├── components/    # UI components (AppList, AppWindow, etc.)
│   │   └── App.tsx        # Main application
│   └── main.ts            # Electron main process
├── apps/                  # Generated user applications
├── runtime/bun            # Bundled Bun runtime (auto-downloaded)
└── dist/                  # Built application files
```

## Generated App Structure

Each AI-generated app includes:
- **Complete Next.js application** with TypeScript and functional components
- **Working React functionality** (useState, event handlers, forms)
- **Tailwind CSS styling** with responsive design
- **Real interactivity** (not just templates or placeholders)
- **SQLite database integration** when needed
- **Ready-to-run configuration** (package.json, tsconfig.json, etc.)

## Development Commands

```bash
# Development
yarn dev              # Start App0 in development mode
yarn build            # Build the application
yarn build:main       # Build only the main Electron process
yarn build:renderer   # Build only the React frontend

# Runtime Management
yarn setup-bun        # Re-download bundled Bun runtime

# Production
yarn electron:pack    # Package App0 for distribution
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - **Required**: Your OpenAI API key for app generation
- `NODE_ENV` - Development/production environment

### App Ports

- Generated apps run on ports **3001-3100**
- Port allocation is automatic and managed by App0
- Each app gets its own isolated port

## Troubleshooting

### App Generation Issues

**❌ "I'm sorry, but I can't assist with that"**
- Your OpenAI API key may be invalid or expired
- Try a simpler app description to avoid content filters

**❌ "AI failed to generate functional app"**
- The AI returned malformed code or templates instead of functional apps
- Try again with a more specific description (e.g., "todo app with add/delete buttons")

**❌ "Could not find JSON response"**
- Network connectivity issues with OpenAI API
- Check your internet connection and API key

### App Startup Issues

**❌ Apps fail to start with "script 'dev' exited with code 1"**
- Dependencies may not have installed correctly
- Check the app's `package.json` for correct versions
- Try deleting and regenerating the app

**❌ Node.js version compatibility**
- App0 uses Next.js 13.5 for compatibility with Node.js 18.12+
- If you have an older Node.js version, update to 18.12 or later

### Development Issues

**❌ White screen when starting App0**
- Run `yarn build` before `yarn dev`
- Check for TypeScript compilation errors

**❌ Bun runtime not found**
- Run `yarn setup-bun` to re-download the bundled runtime

## Example App Types

App0 can generate functional applications like:

- **Todo Apps**: Add/edit/delete tasks, categories, completion status
- **Note-taking Apps**: Rich text editing, save/load, organization
- **Calculators**: Working buttons, mathematical operations, display
- **Data Management**: Forms, CRUD operations, search/filter
- **Simple Games**: Interactive gameplay, scoring, state management

## Logs and Debugging

- **Electron Console**: Main process logs (open DevTools in App0)
- **Generated App Files**: Check `apps/[app-name]/` for created files
- **Build Logs**: TypeScript compilation and webpack build output
- **AI Generation**: Console logs show AI response parsing and validation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test with real app generation
4. Commit your changes: `git commit -m 'Add feature'`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Ensure you have a valid OpenAI API key
- Try generating simpler apps first to test functionality
- Create a GitHub issue with detailed logs if problems persist