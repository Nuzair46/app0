import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { GeneratedApp } from '../ai/agent';

export class AppBuilder {
  private appsDir: string;
  private bunPath: string;

  constructor() {
    this.appsDir = path.join(process.cwd(), 'apps');
    this.bunPath = path.join(process.cwd(), 'runtime', 'bun');
    
    // Ensure apps directory exists
    if (!fs.existsSync(this.appsDir)) {
      fs.mkdirSync(this.appsDir, { recursive: true });
    }
  }

  async buildApp(appName: string, generatedApp: GeneratedApp): Promise<string> {
    const sanitizedName = this.sanitizeAppName(appName);
    const appPath = path.join(this.appsDir, sanitizedName);

    try {
      // Create app directory
      if (fs.existsSync(appPath)) {
        throw new Error(`App directory ${sanitizedName} already exists`);
      }
      
      fs.mkdirSync(appPath, { recursive: true });
      console.log(`Created app directory: ${appPath}`);

      // Write all generated files
      console.log(`Writing ${generatedApp.files.length} files...`);
      for (const file of generatedApp.files) {
        await this.writeFile(appPath, file.path, file.content);
        console.log(`Written: ${file.path}`);
      }

      // Validate package.json before installation
      await this.validateAndFixPackageJson(appPath);

      // Install dependencies
      console.log(`Installing dependencies...`);
      await this.installDependencies(appPath);

      // Post-install validation
      await this.validateAppSetup(appPath);

      console.log(`App built successfully at: ${appPath}`);
      return appPath;
      
    } catch (error: any) {
      console.error(`Failed to build app: ${error.message}`);
      // Clean up on failure
      if (fs.existsSync(appPath)) {
        this.removeDirectory(appPath);
      }
      throw error;
    }
  }

  async deleteApp(appId: string): Promise<void> {
    const appPath = path.join(this.appsDir, appId);
    
    if (fs.existsSync(appPath)) {
      this.removeDirectory(appPath);
    }
  }

  private async writeFile(basePath: string, filePath: string, content: string): Promise<void> {
    const fullPath = path.join(basePath, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  private async installDependencies(appPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try to use bundled bun first, fallback to npm
      const useBun = fs.existsSync(this.bunPath);
      const command = useBun ? this.bunPath : 'npm';
      const args = ['install'];
      
      console.log(`Using ${useBun ? 'bun' : 'npm'} for dependency installation`);

      const installProcess = spawn(command, args, {
        cwd: appPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });

      let stdout = '';
      let stderr = '';

      installProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`[${command}]`, output.trim());
      });

      installProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // Some package managers output normal info to stderr
        console.log(`[${command}]`, output.trim());
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✓ Dependencies installed successfully using ${command}`);
          resolve();
        } else {
          console.error(`✗ Dependency installation failed with exit code ${code}`);
          console.error(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          reject(new Error(`Dependency installation failed with exit code ${code}: ${stderr || stdout}`));
        }
      });

      installProcess.on('error', (error) => {
        console.error(`✗ Failed to spawn ${command}:`, error);
        reject(new Error(`Failed to start dependency installation: ${error.message}`));
      });

      // Set timeout for installation (10 minutes)
      setTimeout(() => {
        console.error(`✗ Installation timeout after 10 minutes`);
        installProcess.kill('SIGKILL');
        reject(new Error('Dependency installation timed out after 10 minutes'));
      }, 600000);
    });
  }

  private sanitizeAppName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }

  private removeDirectory(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            this.removeDirectory(filePath);
          } else {
            fs.unlinkSync(filePath);
          }
        }
        
        fs.rmdirSync(dirPath);
      }
    } catch (error) {
      console.error(`Error removing directory ${dirPath}:`, error);
      throw error;
    }
  }

  getAppPath(appId: string): string {
    return path.join(this.appsDir, appId);
  }

  appExists(appId: string): boolean {
    const appPath = this.getAppPath(appId);
    return fs.existsSync(appPath) && fs.existsSync(path.join(appPath, 'package.json'));
  }

  private async validateAndFixPackageJson(appPath: string): Promise<void> {
    const packageJsonPath = path.join(appPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    try {
      const rawContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(rawContent);
      
      // Fix/validate package.json structure
      const fixedPackageJson = {
        name: packageJson.name || 'generated-app',
        version: packageJson.version || '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
          ...(packageJson.scripts || {})
        },
        dependencies: {
          next: '^13.5.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          ...(packageJson.dependencies || {})
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          autoprefixer: '^10.0.0',
          postcss: '^8.0.0',
          tailwindcss: '^3.0.0',
          typescript: '^5.0.0',
          ...(packageJson.devDependencies || {})
        }
      };

      // Rewrite package.json with proper formatting
      fs.writeFileSync(packageJsonPath, JSON.stringify(fixedPackageJson, null, 2));
      console.log('✓ Package.json validated and fixed');
      
    } catch (error: any) {
      throw new Error(`Invalid package.json: ${error.message}`);
    }
  }

  private async validateAppSetup(appPath: string): Promise<void> {
    // Check if essential files exist
    const essentialFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      'pages/index.tsx',
      'pages/_app.tsx'
    ];

    for (const file of essentialFiles) {
      const filePath = path.join(appPath, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠ Missing file: ${file}`);
      }
    }

    // Check if node_modules exists (dependencies installed)
    const nodeModulesPath = path.join(appPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error('Dependencies not installed - node_modules missing');
    }

    // Check if key dependencies are installed
    const keyDependencies = ['next', 'react', 'react-dom'];
    for (const dep of keyDependencies) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!fs.existsSync(depPath)) {
        throw new Error(`Key dependency missing: ${dep}`);
      }
    }

    console.log('✓ App setup validation passed');
  }
}