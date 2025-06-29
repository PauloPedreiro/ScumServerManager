"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fileManager_1 = require("./fileManager");
const backupManager_1 = require("./backupManager");
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}
console.log('NODE_ENV (início):', process.env.NODE_ENV);
let mainWindow = null;
const fileManager = new fileManager_1.FileManager();
const backupManager = new backupManager_1.BackupManager();
function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    console.log('Preload path:', preloadPath);
    console.log('Icon path:', iconPath);
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath
        },
        icon: iconPath,
        titleBarStyle: 'default',
        show: false
    });
    // Carrega a aplicação React
    const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
    console.log('NODE_ENV (ajustado):', nodeEnv);
    if (nodeEnv === 'development') {
        console.log('Carregando frontend de desenvolvimento: http://localhost:5173');
        mainWindow.loadURL('http://localhost:5173').catch((err) => {
            console.error('Erro ao carregar frontend de desenvolvimento:', err);
        });
        mainWindow.webContents.openDevTools();
    }
    else {
        const prodPath = path.join(__dirname, '../renderer/index.html');
        console.log('Carregando frontend de produção:', prodPath);
        mainWindow.loadFile(prodPath).catch((err) => {
            console.error('Erro ao carregar frontend de produção:', err);
        });
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Eventos da aplicação
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// IPC Handlers para comunicação com o renderer process
// Selecionar pasta do servidor SCUM
electron_1.ipcMain.handle('select-server-folder', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Selecionar pasta do servidor SCUM'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});
// Ler configurações do servidor
electron_1.ipcMain.handle('read-server-config', async (event, serverPath) => {
    try {
        return await fileManager.readServerConfig(serverPath);
    }
    catch (error) {
        console.error('Erro ao ler configurações:', error);
        throw error;
    }
});
// Salvar configurações do servidor
electron_1.ipcMain.handle('save-server-config', async (event, serverPath, config) => {
    try {
        // Criar backup antes de salvar
        await backupManager.createBackup(serverPath);
        // Salvar configurações
        await fileManager.saveServerConfig(serverPath, config);
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao salvar configurações:', error);
        throw error;
    }
});
// Ler arquivo específico
electron_1.ipcMain.handle('read-ini-file', async (event, filePath) => {
    try {
        return await fileManager.readIniFile(filePath);
    }
    catch (error) {
        console.error('Erro ao ler arquivo INI:', error);
        throw error;
    }
});
// Salvar arquivo específico
electron_1.ipcMain.handle('save-ini-file', async (event, filePath, content) => {
    try {
        return await fileManager.saveIniFile(filePath, content);
    }
    catch (error) {
        console.error('Erro ao salvar arquivo INI:', error);
        throw error;
    }
});
// Ler arquivo JSON
electron_1.ipcMain.handle('read-json-file', async (event, filePath) => {
    try {
        return await fileManager.readJsonFile(filePath);
    }
    catch (error) {
        console.error('Erro ao ler arquivo JSON:', error);
        throw error;
    }
});
// Salvar arquivo JSON
electron_1.ipcMain.handle('save-json-file', async (event, filePath, content) => {
    try {
        return await fileManager.saveJsonFile(filePath, content);
    }
    catch (error) {
        console.error('Erro ao salvar arquivo JSON:', error);
        throw error;
    }
});
// Listar arquivos de backup
electron_1.ipcMain.handle('list-backups', async (event, serverPath) => {
    try {
        return await backupManager.listBackups(serverPath);
    }
    catch (error) {
        console.error('Erro ao listar backups:', error);
        throw error;
    }
});
// Restaurar backup
electron_1.ipcMain.handle('restore-backup', async (event, serverPath, backupName) => {
    try {
        return await backupManager.restoreBackup(serverPath, backupName);
    }
    catch (error) {
        console.error('Erro ao restaurar backup:', error);
        throw error;
    }
});
// Validar configurações
electron_1.ipcMain.handle('validate-config', async (event, config) => {
    try {
        return await fileManager.validateConfig(config);
    }
    catch (error) {
        console.error('Erro ao validar configurações:', error);
        throw error;
    }
});
// Restaurar arquivo para o padrão
electron_1.ipcMain.handle('restore-default-file', async (event, serverPath, fileName) => {
    try {
        await fileManager.restoreDefaultFile(serverPath, fileName);
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao restaurar arquivo padrão:', error);
        throw error;
    }
});
// Listar arquivos de configuração
electron_1.ipcMain.handle('list-config-files', async (event, serverPath) => {
    try {
        return await fileManager.listConfigFiles(serverPath);
    }
    catch (error) {
        console.error('Erro ao listar arquivos de configuração:', error);
        throw error;
    }
});
// Carregar cache do servidor
electron_1.ipcMain.handle('load-server-cache', async () => {
    try {
        return await fileManager.loadServerCache();
    }
    catch (error) {
        console.error('Erro ao carregar cache do servidor:', error);
        throw error;
    }
});
// Limpar cache do servidor
electron_1.ipcMain.handle('clear-server-cache', async () => {
    try {
        await fileManager.clearServerCache();
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao limpar cache do servidor:', error);
        throw error;
    }
});
// Obter informações básicas do servidor
electron_1.ipcMain.handle('get-server-info', async (event, serverPath) => {
    try {
        return await fileManager.getServerInfo(serverPath);
    }
    catch (error) {
        console.error('Erro ao obter informações do servidor:', error);
        throw error;
    }
});
// Configuração persistente do caminho do servidor
electron_1.ipcMain.handle('save-app-config', async (event, serverPath) => {
    try {
        await fileManager.saveAppConfig(serverPath);
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao salvar config.json:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('load-app-config', async () => {
    try {
        return await fileManager.loadAppConfig();
    }
    catch (error) {
        console.error('Erro ao carregar config.json:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('clear-app-config', async () => {
    try {
        await fileManager.clearAppConfig();
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao limpar config.json:', error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map