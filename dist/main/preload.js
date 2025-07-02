"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expor APIs seguras para o renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Seleção de pasta
    selectServerFolder: () => electron_1.ipcRenderer.invoke('select-server-folder'),
    selectSteamcmdFolder: () => electron_1.ipcRenderer.invoke('select-steamcmd-folder'),
    selectInstallFolder: () => electron_1.ipcRenderer.invoke('select-install-folder'),
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
    saveAppConfig: (serverPath, steamcmdPath, installPath, serverPort, maxPlayers, enableBattleye) => electron_1.ipcRenderer.invoke('save-app-config', serverPath, steamcmdPath, installPath, serverPort, maxPlayers, enableBattleye),
    loadAppConfig: () => electron_1.ipcRenderer.invoke('load-app-config'),
    clearAppConfig: () => electron_1.ipcRenderer.invoke('clear-app-config'),
    // Listar arquivos em um diretório
    listDir: (dirPath) => electron_1.ipcRenderer.invoke('list-dir', dirPath),
    // Verificar existência de caminho
    checkPathExists: (path) => electron_1.ipcRenderer.invoke('check-path-exists', path),
    // File operations (legacy)
    readConfigFile: (filePath) => electron_1.ipcRenderer.invoke('read-config-file', filePath),
    writeConfigFile: (filePath, data) => electron_1.ipcRenderer.invoke('write-config-file', filePath, data),
    // Backup operations (legacy)
    getBackups: () => electron_1.ipcRenderer.invoke('get-backups'),
    createBackup: (options) => electron_1.ipcRenderer.invoke('create-backup', options),
    deleteBackup: (backupId) => electron_1.ipcRenderer.invoke('delete-backup', backupId),
    downloadBackup: (backupId) => electron_1.ipcRenderer.invoke('download-backup', backupId),
    // Server operations (legacy)
    getServerStatus: (serverPath) => electron_1.ipcRenderer.invoke('get-server-status', serverPath),
    getServerLogs: (serverPath, options) => electron_1.ipcRenderer.invoke('get-server-logs', serverPath, options),
    startServer: (serverPath) => electron_1.ipcRenderer.invoke('start-server', serverPath),
    stopServer: (serverPath) => electron_1.ipcRenderer.invoke('stop-server', serverPath),
    restartServer: (serverPath) => electron_1.ipcRenderer.invoke('restart-server', serverPath),
    downloadLogs: (serverPath) => electron_1.ipcRenderer.invoke('download-logs', serverPath),
    clearLogs: (serverPath) => electron_1.ipcRenderer.invoke('clear-logs', serverPath),
    // New function
    updateServerWithSteamcmd: (steamcmdPath, installPath) => electron_1.ipcRenderer.invoke('update-server-with-steamcmd', steamcmdPath, installPath),
    startServerWithConfig: (serverPath, serverPort, maxPlayers, enableBattleye) => electron_1.ipcRenderer.invoke('start-server-with-config', serverPath, serverPort, maxPlayers, enableBattleye),
    // Added function
    getRealServerStatus: (serverPath) => electron_1.ipcRenderer.invoke('get-real-server-status', serverPath),
    // New function
    sendUpdateServerWithSteamcmdStream: (steamcmdPath, installPath) => electron_1.ipcRenderer.send('start-update-server-with-steamcmd-stream', steamcmdPath, installPath),
    onUpdateServerLog: (callback) => electron_1.ipcRenderer.on('update-server-log', callback),
    onUpdateServerLogEnd: (callback) => electron_1.ipcRenderer.on('update-server-log-end', callback),
    removeUpdateServerLog: (callback) => electron_1.ipcRenderer.removeListener('update-server-log', callback),
    removeUpdateServerLogEnd: (callback) => electron_1.ipcRenderer.removeListener('update-server-log-end', callback),
    loadRestartSchedule: () => electron_1.ipcRenderer.invoke('load-restart-schedule'),
    saveRestartSchedule: (hours) => electron_1.ipcRenderer.invoke('save-restart-schedule', hours),
});
//# sourceMappingURL=preload.js.map