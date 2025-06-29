import { contextBridge, ipcRenderer } from 'electron';

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Seleção de pasta
  selectServerFolder: () => ipcRenderer.invoke('select-server-folder'),
  
  // Configurações do servidor
  readServerConfig: (serverPath: string) => ipcRenderer.invoke('read-server-config', serverPath),
  saveServerConfig: (serverPath: string, config: any) => ipcRenderer.invoke('save-server-config', serverPath, config),
  
  // Cache do servidor
  loadServerCache: () => ipcRenderer.invoke('load-server-cache'),
  clearServerCache: () => ipcRenderer.invoke('clear-server-cache'),
  getServerInfo: (serverPath: string) => ipcRenderer.invoke('get-server-info', serverPath),
  
  // Arquivos INI
  readIniFile: (filePath: string) => ipcRenderer.invoke('read-ini-file', filePath),
  saveIniFile: (filePath: string, content: any) => ipcRenderer.invoke('save-ini-file', filePath, content),
  
  // Arquivos JSON
  readJsonFile: (filePath: string) => ipcRenderer.invoke('read-json-file', filePath),
  saveJsonFile: (filePath: string, content: any) => ipcRenderer.invoke('save-json-file', filePath, content),
  
  // Backup
  listBackups: (serverPath: string) => ipcRenderer.invoke('list-backups', serverPath),
  restoreBackup: (serverPath: string, backupName: string) => ipcRenderer.invoke('restore-backup', serverPath, backupName),
  
  // Validação
  validateConfig: (config: any) => ipcRenderer.invoke('validate-config', config),
  
  // Restaurar arquivo
  restoreDefaultFile: (serverPath: string, fileName: string) => ipcRenderer.invoke('restore-default-file', serverPath, fileName),
  
  // Listar arquivos de configuração
  listConfigFiles: (serverPath: string) => ipcRenderer.invoke('list-config-files', serverPath),
  
  // Configurações persistentes
  saveAppConfig: (serverPath: string) => ipcRenderer.invoke('save-app-config', serverPath),
  loadAppConfig: () => ipcRenderer.invoke('load-app-config'),
  clearAppConfig: () => ipcRenderer.invoke('clear-app-config')
});

// Declaração de tipos para TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectServerFolder: () => Promise<string | null>;
      readServerConfig: (serverPath: string) => Promise<any>;
      saveServerConfig: (serverPath: string, config: any) => Promise<any>;
      readIniFile: (filePath: string) => Promise<any>;
      saveIniFile: (filePath: string, content: any) => Promise<any>;
      readJsonFile: (filePath: string) => Promise<any>;
      saveJsonFile: (filePath: string, content: any) => Promise<any>;
      listBackups: (serverPath: string) => Promise<string[]>;
      restoreBackup: (serverPath: string, backupName: string) => Promise<any>;
      validateConfig: (config: any) => Promise<any>;
      restoreDefaultFile: (serverPath: string, fileName: string) => Promise<any>;
      listConfigFiles: (serverPath: string) => Promise<string[]>;
      saveAppConfig: (serverPath: string) => Promise<any>;
      loadAppConfig: () => Promise<any>;
      clearAppConfig: () => Promise<any>;
    };
  }
} 