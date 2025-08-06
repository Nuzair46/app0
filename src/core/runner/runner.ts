import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import { AppInfo } from '../types';

interface RunningApp {
  id: string;
  process: ChildProcess;
  port: number;
  startTime: Date;
}

export class AppRunner {
  private runningApps: Map<string, RunningApp> = new Map();
  private bunPath: string;
  private usedPorts: Set<number> = new Set();

  constructor() {
    this.bunPath = path.join(process.cwd(), 'runtime', 'bun');
  }

  async startApp(app: AppInfo): Promise<number> {
    if (this.runningApps.has(app.id)) {
      throw new Error(`App ${app.id} is already running`);
    }

    const appPath = app.path;
    if (!fs.existsSync(appPath)) {
      throw new Error(`App path does not exist: ${appPath}`);
    }

    const packageJsonPath = path.join(appPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at: ${packageJsonPath}`);
    }

    try {
      const port = await this.findAvailablePort();
      const childProcess = await this.spawnAppProcess(app.id, appPath, port);
      
      this.runningApps.set(app.id, {
        id: app.id,
        process: childProcess,
        port,
        startTime: new Date()
      });

      this.usedPorts.add(port);
      
      // Wait a moment for the app to start
      await this.waitForAppToStart(port, 30000); // 30 second timeout
      
      return port;
    } catch (error) {
      console.error(`Failed to start app ${app.id}:`, error);
      throw error;
    }
  }

  async stopApp(appId: string): Promise<void> {
    const runningApp = this.runningApps.get(appId);
    if (!runningApp) {
      throw new Error(`App ${appId} is not running`);
    }

    try {
      // Gracefully terminate the process
      runningApp.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if graceful shutdown fails
          if (!runningApp.process.killed) {
            runningApp.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        runningApp.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.usedPorts.delete(runningApp.port);
      this.runningApps.delete(appId);
      
    } catch (error) {
      console.error(`Error stopping app ${appId}:`, error);
      throw error;
    }
  }

  async stopAllApps(): Promise<void> {
    const stopPromises = Array.from(this.runningApps.keys()).map(appId => 
      this.stopApp(appId).catch(error => 
        console.error(`Error stopping app ${appId}:`, error)
      )
    );
    
    await Promise.allSettled(stopPromises);
  }

  isAppRunning(appId: string): boolean {
    return this.runningApps.has(appId);
  }

  getRunningAppPort(appId: string): number | undefined {
    return this.runningApps.get(appId)?.port;
  }

  getRunningApps(): string[] {
    return Array.from(this.runningApps.keys());
  }

  private async spawnAppProcess(appId: string, appPath: string, port: number): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      // Determine which command to use
      const command = fs.existsSync(this.bunPath) ? this.bunPath : 'npm';
      const args = fs.existsSync(this.bunPath) ? ['run', 'dev'] : ['run', 'dev'];

      const env = {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: 'development'
      };

      const childProcess = spawn(command, args, {
        cwd: appPath,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });

      let hasStarted = false;
      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Look for signs that the Next.js app has started
        if (output.includes('ready') || output.includes('started') || output.includes(`localhost:${port}`)) {
          if (!hasStarted) {
            hasStarted = true;
            resolve(childProcess);
          }
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`App ${appId} stderr:`, output);
      });

      childProcess.on('error', (error) => {
        if (!hasStarted) {
          reject(new Error(`Failed to start app process: ${error.message}`));
        }
      });

      childProcess.on('exit', (code, signal) => {
        if (!hasStarted) {
          reject(new Error(`App process exited early with code ${code}, signal ${signal}. stderr: ${stderr}`));
        } else {
          console.log(`App ${appId} process exited with code ${code}`);
          this.runningApps.delete(appId);
        }
      });

      // Timeout if app doesn't start within reasonable time
      setTimeout(() => {
        if (!hasStarted) {
          childProcess.kill('SIGKILL');
          reject(new Error(`App startup timeout. stdout: ${stdout}, stderr: ${stderr}`));
        }
      }, 60000); // 60 second timeout
    });
  }

  private async findAvailablePort(): Promise<number> {
    for (let port = 3001; port <= 3100; port++) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error('No available ports found in range 3001-3100');
  }

  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      
      server.on('error', () => resolve(false));
    });
  }

  private async waitForAppToStart(port: number, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const isAvailable = await this.isPortAvailable(port);
        if (!isAvailable) {
          // Port is in use, which means the app is likely running
          return;
        }
      } catch (error) {
        // Continue trying
      }
      
      // Wait 1 second before trying again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`App failed to start within ${timeout}ms`);
  }
}