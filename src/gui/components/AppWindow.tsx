import React from 'react';
import { AppInfo } from '../../core/types';

interface AppWindowProps {
  app: AppInfo;
  onStartApp: (appId: string) => void;
  onStopApp: (appId: string) => void;
}

export const AppWindow: React.FC<AppWindowProps> = ({
  app,
  onStartApp,
  onStopApp
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#10b981';
      case 'stopped': return '#6b7280';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Running';
      case 'stopped': return 'Stopped';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #e1e5e9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>{app.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: getStatusColor(app.status)
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: getStatusColor(app.status)
              }} />
              {getStatusText(app.status)}
            </div>
            {app.status === 'running' && app.port && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                localhost:{app.port}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {app.status === 'stopped' ? (
            <button
              onClick={() => onStartApp(app.id)}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ▶ Start App
            </button>
          ) : (
            <button
              onClick={() => onStopApp(app.id)}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ⏸ Stop App
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {app.status === 'running' && app.port ? (
          <iframe
            src={`http://localhost:${app.port}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff'
            }}
            title={app.name}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280',
            background: '#f9fafb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {app.status === 'stopped' ? '⏸️' : '❌'}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              {app.status === 'stopped' ? 'App Stopped' : 'App Error'}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>
              {app.status === 'stopped' 
                ? 'Click "Start App" to launch this application'
                : 'There was an error running this application'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};