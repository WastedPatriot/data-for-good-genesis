export interface ElectronAPI {
  loadConfig: () => Promise<any>;
  saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
  fetchProcessedRecords: () => Promise<{ success: boolean; data?: any; error?: string }>;
  publishDataset: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  generateBadgeCodes: (count: number, datasetId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  checkDatasetStatus: (datasetId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  querySupabase: (query: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  readLogs: () => Promise<{ success: boolean; logs?: string; error?: string }>;
  startAutomation: () => Promise<{ success: boolean; error?: string }>;
  stopAutomation: () => Promise<{ success: boolean; error?: string }>;
  onAutomationTick: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
