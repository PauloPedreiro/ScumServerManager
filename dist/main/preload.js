"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expor APIs seguras para o renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Seleção de pasta
    selectServerFolder: () => electron_1.ipcRenderer.invoke('select-server-folder'),
    // Configurações do servidor
    readServerConfig: (serverPath) => electron_1.ipcRenderer.invoke('read-server-config', serverPath),
    saveServerConfig: (serverPath, config) => electron_1.ipcRenderer.invoke('save-server-config', serverPath, config),
    // Cache do servidor
    loadServerCache: () => electron_1.ipcRenderer.invoke('load-server-cache'),
    clearServerCache: () => electron_1.ipcRenderer.invoke('clear-server-cache'),
    getServerInfo: (serverPath) => electron_1.ipcRenderer.invoke('get-server-info', serverPath),
    // Arquivos INI
    readIniFile: (filePath) => electron_1.ipcRenderer.invoke('read-ini-file', filePath),
    saveIniFile: (filePath, content) => electron_1.ipcRenderer.invoke('save-ini-file', filePath, content),
    // Arquivos JSON
    readJsonFile: (filePath) => electron_1.ipcRenderer.invoke('read-json-file', filePath),
    saveJsonFile: (filePath, content) => electron_1.ipcRenderer.invoke('save-json-file', filePath, content),
    // Backup
    listBackups: (serverPath) => electron_1.ipcRenderer.invoke('list-backups', serverPath),
    restoreBackup: (serverPath, backupName) => electron_1.ipcRenderer.invoke('restore-backup', serverPath, backupName),
    // Validação
    validateConfig: (config) => electron_1.ipcRenderer.invoke('validate-config', config),
    // Restaurar arquivo
    restoreDefaultFile: (serverPath, fileName) => electron_1.ipcRenderer.invoke('restore-default-file', serverPath, fileName),
    // Listar arquivos de configuração
    listConfigFiles: (serverPath) => electron_1.ipcRenderer.invoke('list-config-files', serverPath),
    // Configurações persistentes
    saveAppConfig: (serverPath) => electron_1.ipcRenderer.invoke('save-app-config', serverPath),
    loadAppConfig: () => electron_1.ipcRenderer.invoke('load-app-config'),
    clearAppConfig: () => electron_1.ipcRenderer.invoke('clear-app-config')
});
//# sourceMappingURL=preload.js.map