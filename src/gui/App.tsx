import React, { useState, useEffect } from 'react';
import { AppList } from './components/AppList';
import { AppWindow } from './components/AppWindow';
import { CreateAppFlow } from './components/CreateAppFlow';

const { ipcRenderer } = (window as any).require('electron');

import { AppInfo } from '../core/types';

type ViewMode = 'list' | 'create' | 'app';

export const App: React.FC = () => {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const appsList = await ipcRenderer.invoke('get-apps');
      setApps(appsList);
    } catch (error) {
      console.error('Error loading apps:', error);
    }
  };

  const handleCreateApp = async (appSpec: { name: string; description: string }) => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('create-app', appSpec);
      if (result.success) {
        await loadApps();
        setCurrentView('list');
      } else {
        window.alert('Error creating app: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating app:', error);
      window.alert('Error creating app: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartApp = async (appId: string) => {
    try {
      const result = await ipcRenderer.invoke('start-app', appId);
      if (result.success) {
        await loadApps();
        const app = apps.find(a => a.id === appId);
        if (app) {
          setSelectedApp({ ...app, status: 'running', port: result.port });
          setCurrentView('app');
        }
      } else {
        window.alert('Error starting app: ' + result.error);
      }
    } catch (error) {
      console.error('Error starting app:', error);
      window.alert('Error starting app: ' + (error as any).message);
    }
  };

  const handleStopApp = async (appId: string) => {
    try {
      const result = await ipcRenderer.invoke('stop-app', appId);
      if (result.success) {
        await loadApps();
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp({ ...selectedApp, status: 'stopped', port: undefined });
        }
      } else {
        window.alert('Error stopping app: ' + result.error);
      }
    } catch (error) {
      console.error('Error stopping app:', error);
      window.alert('Error stopping app: ' + (error as any).message);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm('Are you sure you want to delete this app?')) return;
    
    try {
      const result = await ipcRenderer.invoke('delete-app', appId);
      if (result.success) {
        await loadApps();
        if (selectedApp && selectedApp.id === appId) {
          setCurrentView('list');
          setSelectedApp(null);
        }
      } else {
        window.alert('Error deleting app: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting app:', error);
      window.alert('Error deleting app: ' + (error as any).message);
    }
  };

  const handleViewApp = (app: AppInfo) => {
    setSelectedApp(app);
    setCurrentView('app');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <header style={{ 
        background: '#fff', 
        padding: '16px 24px', 
        borderBottom: '1px solid #e1e5e9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>App0</h1>
          {currentView !== 'list' && (
            <button
              onClick={() => setCurrentView('list')}
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Apps
            </button>
          )}
        </div>
        
        {currentView === 'list' && (
          <button
            onClick={() => setCurrentView('create')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            disabled={loading}
          >
            {loading ? 'Creating...' : '+ Create New App'}
          </button>
        )}
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        {currentView === 'list' && (
          <AppList
            apps={apps}
            onStartApp={handleStartApp}
            onStopApp={handleStopApp}
            onDeleteApp={handleDeleteApp}
            onViewApp={handleViewApp}
          />
        )}
        
        {currentView === 'create' && (
          <CreateAppFlow
            onCreateApp={handleCreateApp}
            loading={loading}
          />
        )}
        
        {currentView === 'app' && selectedApp && (
          <AppWindow
            app={selectedApp}
            onStartApp={handleStartApp}
            onStopApp={handleStopApp}
          />
        )}
      </main>
    </div>
  );
};