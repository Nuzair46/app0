import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AppRegistry } from './core/registry';
import { AIAgent } from './core/ai/agent';
import { AppBuilder } from './core/builder/builder';
import { AppRunner } from './core/runner/runner';

let mainWindow: BrowserWindow;
let appRegistry: AppRegistry;
let aiAgent: AIAgent;
let appBuilder: AppBuilder;
let appRunner: AppRunner;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();
  
  // Initialize core services
  appRegistry = new AppRegistry();
  aiAgent = new AIAgent();
  appBuilder = new AppBuilder();
  appRunner = new AppRunner();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    appRunner.stopAllApps();
    app.quit();
  }
});

// IPC handlers for communication with renderer process
ipcMain.handle('get-apps', async () => {
  return await appRegistry.getAllApps();
});

ipcMain.handle('create-app', async (event, appSpec: any) => {
  try {
    // Generate app code using AI
    const appCode = await aiAgent.generateApp(appSpec);
    
    // Build the app files
    const appPath = await appBuilder.buildApp(appSpec.name, appCode);
    
    // Register the app
    const appInfo = await appRegistry.registerApp({
      name: appSpec.name,
      description: appSpec.description,
      path: appPath,
      status: 'stopped'
    });
    
    return { success: true, app: appInfo };
  } catch (error: any) {
    console.error('Error creating app:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-app', async (event, appId: string) => {
  try {
    const app = await appRegistry.getApp(appId);
    if (!app) throw new Error('App not found');
    
    const port = await appRunner.startApp(app);
    await appRegistry.updateAppStatus(appId, 'running', port);
    
    return { success: true, port };
  } catch (error: any) {
    console.error('Error starting app:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-app', async (event, appId: string) => {
  try {
    await appRunner.stopApp(appId);
    await appRegistry.updateAppStatus(appId, 'stopped');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error stopping app:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-app', async (event, appId: string) => {
  try {
    await appRunner.stopApp(appId);
    await appBuilder.deleteApp(appId);
    await appRegistry.deleteApp(appId);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting app:', error);
    return { success: false, error: error.message };
  }
});