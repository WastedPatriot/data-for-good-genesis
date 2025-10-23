import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  fetchProcessedRecords: () => ipcRenderer.invoke('fetch-processed-records'),
  publishDataset: (payload: any) => ipcRenderer.invoke('publish-dataset', payload),
  generateBadgeCodes: (count: number, datasetId: string) => 
    ipcRenderer.invoke('generate-badge-codes', count, datasetId),
  checkDatasetStatus: (datasetId: string) => 
    ipcRenderer.invoke('check-dataset-status', datasetId),
  querySupabase: (query: string) => ipcRenderer.invoke('query-supabase', query),
  readLogs: () => ipcRenderer.invoke('read-logs'),
  startAutomation: () => ipcRenderer.invoke('start-automation'),
  stopAutomation: () => ipcRenderer.invoke('stop-automation'),
  onAutomationTick: (callback: () => void) => {
    ipcRenderer.on('automation-tick', callback);
  }
});
