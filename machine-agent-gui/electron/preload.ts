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
  },
  // Review Queue Management
  fetchReviewQueue: (status: string, filters: any) => 
    ipcRenderer.invoke('fetch-review-queue', status, filters),
  approveReviewItem: (id: string, notes: string) => 
    ipcRenderer.invoke('approve-review-item', id, notes),
  rejectReviewItem: (id: string, notes: string) => 
    ipcRenderer.invoke('reject-review-item', id, notes),
  // Dataset Building
  buildDataset: (mode: string, filters: any) => 
    ipcRenderer.invoke('build-dataset', mode, filters),
  // Release Policy
  getReleasePolicy: () => ipcRenderer.invoke('get-release-policy'),
  updateReleasePolicy: (payload: any) => 
    ipcRenderer.invoke('update-release-policy', payload),
  triggerBurstMode: (reason: string) => 
    ipcRenderer.invoke('trigger-burst-mode', reason),
  getTrendingSignals: () => ipcRenderer.invoke('get-trending-signals')
});
