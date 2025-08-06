import React, { useState } from 'react';

interface CreateAppFlowProps {
  onCreateApp: (appSpec: { name: string; description: string }) => void;
  loading: boolean;
}

export const CreateAppFlow: React.FC<CreateAppFlowProps> = ({
  onCreateApp,
  loading
}) => {
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');

  const handleNext = () => {
    if (step === 1 && appName.trim()) {
      setStep(2);
    } else if (step === 2 && appDescription.trim()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = () => {
    if (appName.trim() && appDescription.trim()) {
      onCreateApp({
        name: appName.trim(),
        description: appDescription.trim()
      });
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !appName.trim();
    if (step === 2) return !appDescription.trim();
    return false;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '24px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid #e1e5e9'
      }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>
            Create New App
          </h2>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Step {step} of 3
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: '30%',
                  height: '4px',
                  background: i <= step ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
              What would you like to call your app?
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName((e.target as HTMLInputElement).value)}
              placeholder="e.g., Todo Manager, Photo Gallery, Budget Tracker"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              Choose a clear, descriptive name for your app
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Describe what your app should do
            </label>
            <textarea
              value={appDescription}
              onChange={(e) => setAppDescription((e.target as HTMLTextAreaElement).value)}
              placeholder="e.g., A simple todo app with categories and due dates, or A photo gallery that lets me organize and tag my pictures"
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              Be as specific as possible about features you want
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              Review Your App
            </h3>
            
            <div style={{
              background: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  APP NAME
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {appName}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  DESCRIPTION
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {appDescription}
                </div>
              </div>
            </div>
            
            <div style={{
              background: '#eff6ff',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '13px', color: '#1d4ed8' }}>
                <strong>🤖 AI will generate:</strong> A complete Next.js app with SQLite database and Tailwind CSS styling based on your description.
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '32px'
        }}>
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: step === 1 ? '#9ca3af' : '#374151',
              opacity: step === 1 ? 0.5 : 1
            }}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled()}
              style={{
                background: isNextDisabled() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: isNextDisabled() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating App...
                </>
              ) : (
                '🚀 Create App'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};