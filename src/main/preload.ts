import { contextBridge, ipcRenderer } from 'electron';

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Seleção de pasta
  selectServerFolder: () => ipcRenderer.invoke('select-server-folder'),
  selectSteamcmdFolder: () => ipcRenderer.invoke('select-steamcmd-folder'),
  selectInstallFolder: () => ipcRenderer.invoke('select-install-folder'),
  
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
  saveAppConfig: (config: any) => ipcRenderer.invoke('save-app-config', config),
  loadAppConfig: () => ipcRenderer.invoke('load-app-config'),
  clearAppConfig: () => ipcRenderer.invoke('clear-app-config'),
  
  // Listar arquivos em um diretório
  listDir: (dirPath: string) => ipcRenderer.invoke('list-dir', dirPath),
  
  // Verificar existência de caminho
  checkPathExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),
  
  // File operations (legacy)
  readConfigFile: (filePath: string) => ipcRenderer.invoke('read-config-file', filePath),
  writeConfigFile: (filePath: string, data: any) => ipcRenderer.invoke('write-config-file', filePath, data),
  
  // Backup operations (legacy)
  getBackups: () => ipcRenderer.invoke('get-backups'),
  createBackup: (options: any) => ipcRenderer.invoke('create-backup', options),
  deleteBackup: (backupId: string) => ipcRenderer.invoke('delete-backup', backupId),
  downloadBackup: (backupId: string) => ipcRenderer.invoke('download-backup', backupId),
  
  // Server operations (legacy)
  getServerStatus: (serverPath: string) => ipcRenderer.invoke('get-server-status', serverPath),
  getServerLogs: (serverPath: string, options: any) => ipcRenderer.invoke('get-server-logs', serverPath, options),
  startServer: (serverPath: string) => ipcRenderer.invoke('start-server', serverPath),
  stopServer: (serverPath: string) => ipcRenderer.invoke('stop-server', serverPath),
  restartServer: (serverPath: string) => ipcRenderer.invoke('restart-server', serverPath),
  downloadLogs: (serverPath: string) => ipcRenderer.invoke('download-logs', serverPath),
  clearLogs: (serverPath: string) => ipcRenderer.invoke('clear-logs', serverPath),
  
  // New function
  updateServerWithSteamcmd: (steamcmdPath: string, installPath: string) => ipcRenderer.invoke('update-server-with-steamcmd', steamcmdPath, installPath),
  startServerWithConfig: (serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean) => ipcRenderer.invoke('start-server-with-config', serverPath, serverPort, maxPlayers, enableBattleye),
  
  // Added function
  getRealServerStatus: (serverPath: string) => ipcRenderer.invoke('get-real-server-status', serverPath),
  
  // New function
  sendUpdateServerWithSteamcmdStream: (steamcmdPath: string, installPath: string) =>
    ipcRenderer.send('start-update-server-with-steamcmd-stream', steamcmdPath, installPath),
  onUpdateServerLog: (callback: (event: any, data: string) => void) =>
    ipcRenderer.on('update-server-log', callback),
  onUpdateServerLogEnd: (callback: (event: any, code: number) => void) =>
    ipcRenderer.on('update-server-log-end', callback),
  removeUpdateServerLog: (callback: (event: any, data: string) => void) =>
    ipcRenderer.removeListener('update-server-log', callback),
  removeUpdateServerLogEnd: (callback: (event: any, code: number) => void) =>
    ipcRenderer.removeListener('update-server-log-end', callback),
  loadRestartSchedule: () => ipcRenderer.invoke('load-restart-schedule'),
  saveRestartSchedule: (hours: number[]) => ipcRenderer.invoke('save-restart-schedule', hours),
  saveDiscordWebhooks: (webhooks: any) => ipcRenderer.invoke('save-discord-webhooks', webhooks),
  loadDiscordWebhooks: () => ipcRenderer.invoke('load-discord-webhooks'),
  sendDiscordWebhookMessage: (webhookUrl: string, message: string) => ipcRenderer.invoke('send-discord-webhook-message', webhookUrl, message),
  
  // Gerenciamento de notificações de jogadores
  clearNotifiedPlayers: () => ipcRenderer.invoke('clear-notified-players'),
  getNotifiedPlayers: () => ipcRenderer.invoke('get-notified-players'),
  
  // Novas funções robustas do Discord
  validateDiscordWebhook: (webhookUrl: string) => ipcRenderer.invoke('validate-discord-webhook', webhookUrl),
  sendDiscordMessageWithFallback: (primaryWebhook: string, message: string, fallbackWebhooks: string[]) => 
    ipcRenderer.invoke('send-discord-message-with-fallback', primaryWebhook, message, fallbackWebhooks),
  getDiscordSendStats: () => ipcRenderer.invoke('get-discord-send-stats'),
});

// Declaração de tipos para TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectServerFolder: () => Promise<string | null>;
      selectSteamcmdFolder: () => Promise<string | null>;
      selectInstallFolder: () => Promise<string | null>;
      readServerConfig: (serverPath: string) => Promise<any>;
      saveServerConfig: (serverPath: string, config: any) => Promise<any>;
      loadServerCache: () => Promise<any>;
      clearServerCache: () => Promise<any>;
      getServerInfo: (serverPath: string) => Promise<any>;
      readIniFile: (filePath: string) => Promise<any>;
      saveIniFile: (filePath: string, content: any) => Promise<any>;
      readJsonFile: (filePath: string) => Promise<any>;
      saveJsonFile: (filePath: string, content: any) => Promise<any>;
      listBackups: (serverPath: string) => Promise<string[]>;
      restoreBackup: (serverPath: string, backupName: string) => Promise<any>;
      validateConfig: (config: any) => Promise<any>;
      restoreDefaultFile: (serverPath: string, fileName: string) => Promise<any>;
      listConfigFiles: (serverPath: string) => Promise<string[]>;
      saveAppConfig: (config: any) => Promise<any>;
      loadAppConfig: () => Promise<any>;
      clearAppConfig: () => Promise<any>;
      listDir: (dirPath: string) => Promise<any>;
      checkPathExists: (path: string) => Promise<boolean>;
      readConfigFile: (filePath: string) => Promise<any>;
      writeConfigFile: (filePath: string, data: any) => Promise<any>;
      getBackups: () => Promise<any>;
      createBackup: (options: any) => Promise<any>;
      deleteBackup: (backupId: string) => Promise<any>;
      downloadBackup: (backupId: string) => Promise<any>;
      getServerStatus: (serverPath: string) => Promise<any>;
      getServerLogs: (serverPath: string, options: any) => Promise<any>;
      startServer: (serverPath: string) => Promise<any>;
      stopServer: (serverPath: string) => Promise<any>;
      restartServer: (serverPath: string) => Promise<any>;
      downloadLogs: (serverPath: string) => Promise<any>;
      clearLogs: (serverPath: string) => Promise<any>;
      updateServerWithSteamcmd: (steamcmdPath: string, installPath: string) => Promise<any>;
      startServerWithConfig: (serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean) => Promise<any>;
      getRealServerStatus: (serverPath: string) => Promise<any>;
      sendUpdateServerWithSteamcmdStream: (steamcmdPath: string, installPath: string) => Promise<void>;
      onUpdateServerLog: (callback: (event: any, data: string) => void) => void;
      onUpdateServerLogEnd: (callback: (event: any, code: number) => void) => void;
      removeUpdateServerLog: (callback: (event: any, data: string) => void) => void;
      removeUpdateServerLogEnd: (callback: (event: any, code: number) => void) => void;
      loadRestartSchedule: () => Promise<any>;
      saveRestartSchedule: (hours: number[]) => Promise<any>;
      saveDiscordWebhooks: (webhooks: any) => Promise<any>;
      loadDiscordWebhooks: () => Promise<any>;
      sendDiscordWebhookMessage: (webhookUrl: string, message: string) => Promise<any>;
      clearNotifiedPlayers: () => Promise<any>;
      getNotifiedPlayers: () => Promise<any>;
      validateDiscordWebhook: (webhookUrl: string) => Promise<any>;
      sendDiscordMessageWithFallback: (primaryWebhook: string, message: string, fallbackWebhooks: string[]) => Promise<any>;
      getDiscordSendStats: () => Promise<any>;
    };
  }
} 