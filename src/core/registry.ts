import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppInfo } from './types';

export interface AppRegistryData {
  apps: { [id: string]: AppInfo };
  version: string;
  lastUpdated: string;
}

export interface CreateAppData {
  name: string;
  description: string;
  path: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
}

export class AppRegistry {
  private registryPath: string;
  private data: AppRegistryData = { apps: {}, version: '1.0.0', lastUpdated: '' };

  constructor() {
    this.registryPath = path.join(process.cwd(), 'src', 'core', 'registry.json');
    this.ensureRegistryExists();
    this.loadRegistry();
  }

  private ensureRegistryExists(): void {
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.registryPath)) {
      const initialData: AppRegistryData = {
        apps: {},
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.registryPath, JSON.stringify(initialData, null, 2));
    }
  }

  private loadRegistry(): void {
    try {
      const rawData = fs.readFileSync(this.registryPath, 'utf8');
      this.data = JSON.parse(rawData);
      
      // Ensure data structure is valid
      if (!this.data.apps) {
        this.data.apps = {};
      }
    } catch (error) {
      console.error('Error loading registry:', error);
      this.data = {
        apps: {},
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private saveRegistry(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      const jsonData = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.registryPath, jsonData);
    } catch (error) {
      console.error('Error saving registry:', error);
      throw new Error('Failed to save app registry');
    }
  }

  async registerApp(appData: CreateAppData): Promise<AppInfo> {
    const id = uuidv4();
    const app: AppInfo = {
      id,
      name: appData.name,
      description: appData.description,
      status: appData.status,
      port: appData.port,
      path: appData.path,
      createdAt: new Date().toISOString()
    };

    this.data.apps[id] = app;
    this.saveRegistry();
    
    return app;
  }

  async getAllApps(): Promise<AppInfo[]> {
    return Object.values(this.data.apps);
  }

  async getApp(id: string): Promise<AppInfo | null> {
    return this.data.apps[id] || null;
  }

  async updateApp(id: string, updates: Partial<AppInfo>): Promise<AppInfo | null> {
    const app = this.data.apps[id];
    if (!app) {
      return null;
    }

    this.data.apps[id] = { ...app, ...updates };
    this.saveRegistry();
    
    return this.data.apps[id];
  }

  async updateAppStatus(id: string, status: 'running' | 'stopped' | 'error', port?: number): Promise<void> {
    const app = this.data.apps[id];
    if (!app) {
      throw new Error(`App with id ${id} not found`);
    }

    app.status = status;
    if (port !== undefined) {
      app.port = port;
    } else if (status === 'stopped') {
      delete app.port;
    }

    this.saveRegistry();
  }

  async deleteApp(id: string): Promise<boolean> {
    if (this.data.apps[id]) {
      delete this.data.apps[id];
      this.saveRegistry();
      return true;
    }
    return false;
  }

  async getAppsByStatus(status: 'running' | 'stopped' | 'error'): Promise<AppInfo[]> {
    return Object.values(this.data.apps).filter(app => app.status === status);
  }

  async searchApps(query: string): Promise<AppInfo[]> {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(this.data.apps).filter(app =>
      app.name.toLowerCase().includes(lowercaseQuery) ||
      app.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  getRegistryStats(): { totalApps: number; runningApps: number; stoppedApps: number; errorApps: number } {
    const apps = Object.values(this.data.apps);
    return {
      totalApps: apps.length,
      runningApps: apps.filter(app => app.status === 'running').length,
      stoppedApps: apps.filter(app => app.status === 'stopped').length,
      errorApps: apps.filter(app => app.status === 'error').length
    };
  }

  // Cleanup methods
  async cleanupOrphanedApps(): Promise<string[]> {
    const orphanedApps: string[] = [];
    
    for (const [id, app] of Object.entries(this.data.apps)) {
      if (!fs.existsSync(app.path)) {
        delete this.data.apps[id];
        orphanedApps.push(id);
      }
    }
    
    if (orphanedApps.length > 0) {
      this.saveRegistry();
    }
    
    return orphanedApps;
  }

  async exportRegistry(): Promise<string> {
    return JSON.stringify(this.data, null, 2);
  }

  async importRegistry(registryData: string): Promise<void> {
    try {
      const importedData = JSON.parse(registryData);
      
      // Validate structure
      if (!importedData.apps || typeof importedData.apps !== 'object') {
        throw new Error('Invalid registry data structure');
      }
      
      this.data = {
        apps: importedData.apps,
        version: importedData.version || '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      
      this.saveRegistry();
    } catch (error: any) {
      throw new Error(`Failed to import registry: ${error.message}`);
    }
  }
}