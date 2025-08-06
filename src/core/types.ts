export interface AppInfo {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  path: string;
  createdAt: string;
}