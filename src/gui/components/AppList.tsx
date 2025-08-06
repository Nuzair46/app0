import React from 'react';
import { AppInfo } from '../../core/types';

interface AppListProps {
  apps: AppInfo[];
  onStartApp: (appId: string) => void;
  onStopApp: (appId: string) => void;
  onDeleteApp: (appId: string) => void;
  onViewApp: (app: AppInfo) => void;
}

export const AppList: React.FC<AppListProps> = ({
  apps,
  onStartApp,
  onStopApp,
  onDeleteApp,
  onViewApp
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

  if (apps.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#6b7280'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>No apps yet</h2>
        <p style={{ margin: 0, fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
          Create your first AI-powered app to get started. Click "Create New App" to begin.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {apps.map((app) => (
          <div
            key={app.id}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e1e5e9',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => onViewApp(app)}
          >
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{app.name}</h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '500',
                color: getStatusColor(app.status),
                background: getStatusColor(app.status) + '20',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getStatusColor(app.status)
                }} />
                {getStatusText(app.status)}
              </div>
            </div>
            
            <p style={{ 
              margin: '0 0 16px 0', 
              fontSize: '14px', 
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              {app.description}
            </p>
            
            {app.status === 'running' && app.port && (
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginBottom: '16px',
                background: '#f3f4f6',
                padding: '6px 8px',
                borderRadius: '4px'
              }}>
                Running on localhost:{app.port}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
              {app.status === 'stopped' ? (
                <button
                  onClick={() => onStartApp(app.id)}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  ▶ Start
                </button>
              ) : (
                <button
                  onClick={() => onStopApp(app.id)}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  ⏸ Stop
                </button>
              )}
              
              <button
                onClick={() => onDeleteApp(app.id)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};