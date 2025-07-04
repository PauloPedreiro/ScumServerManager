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
const fs = __importStar(require("fs"));
const vehicleDestructionWatcher_1 = require("./vehicleDestructionWatcher");
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}
// console.log('NODE_ENV (início):', process.env.NODE_ENV);
let mainWindow = null;
const fileManager = new fileManager_1.FileManager();
const backupManager = new backupManager_1.BackupManager();
// Iniciar monitoramento automático de destruição de veículos
(0, vehicleDestructionWatcher_1.startVehicleDestructionWatcher)(fileManager).catch(() => { });
function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    // console.log('Preload path:', preloadPath);
    // console.log('Icon path:', iconPath);
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
    // console.log('NODE_ENV (ajustado):', nodeEnv);
    if (nodeEnv === 'development') {
        // console.log('Carregando frontend de desenvolvimento: http://localhost:5173');
        mainWindow.loadURL('http://localhost:5173').catch((err) => {
            console.error('Erro ao carregar frontend de desenvolvimento:', err);
        });
        mainWindow.webContents.openDevTools();
    }
    else {
        const prodPath = path.join(__dirname, '../renderer/index.html');
        // console.log('Carregando frontend de produção:', prodPath);
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
// Selecionar executável do servidor (SCUMServer.exe)
electron_1.ipcMain.handle('select-server-folder', async () => {
    try {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Executáveis', extensions: ['exe'] }],
            title: 'Selecionar SCUMServer.exe'
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    }
    catch (error) {
        console.error('Erro ao selecionar executável do servidor:', error);
        throw error;
    }
});
// Selecionar pasta de instalação
electron_1.ipcMain.handle('select-install-folder', async () => {
    try {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Selecionar pasta de instalação do SCUM'
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    }
    catch (error) {
        console.error('Erro ao selecionar pasta de instalação:', error);
        throw error;
    }
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
        // Retornar objeto vazio em vez de propagar o erro
        return {};
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
// Listar arquivos em um diretório
electron_1.ipcMain.handle('list-dir', async (event, dirPath) => {
    try {
        return await fileManager.listDir(dirPath);
    }
    catch (error) {
        console.error('Erro ao listar diretório:', error);
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
// Configuração persistente do caminho do servidor e steamcmd
electron_1.ipcMain.handle('save-app-config', async (event, config) => {
    await fileManager.saveAppConfig(config);
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
// Obter status do servidor
electron_1.ipcMain.handle('get-server-status', async (event, serverPath) => {
    try {
        return await fileManager.getServerStatus(serverPath);
    }
    catch (error) {
        console.error('Erro ao obter status do servidor:', error);
        throw error;
    }
});
// Obter logs do servidor
electron_1.ipcMain.handle('get-server-logs', async (event, serverPath, options) => {
    try {
        return await fileManager.getServerLogs(serverPath, options);
    }
    catch (error) {
        console.error('Erro ao obter logs do servidor:', error);
        throw error;
    }
});
// Iniciar servidor
electron_1.ipcMain.handle('start-server', async (event, serverPath) => {
    try {
        return await fileManager.startServer(serverPath);
    }
    catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        throw error;
    }
});
// Parar servidor
electron_1.ipcMain.handle('stop-server', async (event, serverPath) => {
    try {
        return await fileManager.stopServer(serverPath);
    }
    catch (error) {
        console.error('Erro ao parar servidor:', error);
        throw error;
    }
});
// Reiniciar servidor
electron_1.ipcMain.handle('restart-server', async (event, serverPath) => {
    try {
        return await fileManager.restartServer(serverPath);
    }
    catch (error) {
        console.error('Erro ao reiniciar servidor:', error);
        throw error;
    }
});
// Baixar logs
electron_1.ipcMain.handle('download-logs', async (event, serverPath) => {
    try {
        return await fileManager.downloadLogs(serverPath);
    }
    catch (error) {
        console.error('Erro ao baixar logs:', error);
        throw error;
    }
});
// Limpar logs
electron_1.ipcMain.handle('clear-logs', async (event, serverPath) => {
    try {
        return await fileManager.clearLogs(serverPath);
    }
    catch (error) {
        console.error('Erro ao limpar logs:', error);
        throw error;
    }
});
// File operations (legacy)
electron_1.ipcMain.handle('read-config-file', async (event, filePath) => {
    try {
        return await fileManager.readConfigFile(filePath);
    }
    catch (error) {
        console.error('Erro ao ler arquivo de configuração:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('write-config-file', async (event, filePath, data) => {
    try {
        return await fileManager.writeConfigFile(filePath, data);
    }
    catch (error) {
        console.error('Erro ao escrever arquivo de configuração:', error);
        throw error;
    }
});
// Backup operations (legacy)
electron_1.ipcMain.handle('get-backups', async (event) => {
    try {
        return await backupManager.getBackups();
    }
    catch (error) {
        console.error('Erro ao obter backups:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('create-backup', async (event, options) => {
    try {
        return await backupManager.createBackupWithOptions(options);
    }
    catch (error) {
        console.error('Erro ao criar backup:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('delete-backup', async (event, backupId) => {
    try {
        // Para a implementação legacy, vamos usar um serverPath padrão
        const serverPath = process.cwd(); // Usar diretório atual como fallback
        return await backupManager.deleteBackup(serverPath, backupId);
    }
    catch (error) {
        console.error('Erro ao deletar backup:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('download-backup', async (event, backupId) => {
    try {
        return await backupManager.downloadBackup(backupId);
    }
    catch (error) {
        console.error('Erro ao baixar backup:', error);
        throw error;
    }
});
// Atualizar servidor via steamcmd
electron_1.ipcMain.handle('update-server-with-steamcmd', async (event, steamcmdPath, installPath) => {
    try {
        await fileManager.updateServerWithSteamcmd(steamcmdPath, installPath);
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao atualizar servidor via steamcmd:', error);
        throw error;
    }
});
// Selecionar executável do steamcmd
electron_1.ipcMain.handle('select-steamcmd-folder', async () => {
    try {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Executáveis', extensions: ['exe'] }],
            title: 'Selecionar steamcmd.exe'
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    }
    catch (error) {
        console.error('Erro ao selecionar executável do steamcmd:', error);
        throw error;
    }
});
// Iniciar servidor com configurações
electron_1.ipcMain.handle('start-server-with-config', async (event, serverPath, serverPort, maxPlayers, enableBattleye) => {
    try {
        await fileManager.startServerWithConfig(serverPath, serverPort, maxPlayers, enableBattleye);
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao iniciar servidor com configurações:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('get-real-server-status', async (event, serverPath) => {
    try {
        return await fileManager.getRealServerStatus(serverPath);
    }
    catch (error) {
        console.error('Erro ao obter status real do servidor:', error);
        throw error;
    }
});
electron_1.ipcMain.on('start-update-server-with-steamcmd-stream', (_event, steamcmdPath, installPath) => {
    fileManager.startUpdateServerWithSteamcmdStream(steamcmdPath, installPath, _event);
});
electron_1.ipcMain.handle('load-restart-schedule', async () => {
    const filePath = path.join(process.cwd(), 'restart-schedule.json');
    try {
        if (fs.existsSync(filePath)) {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    }
    catch (e) {
        console.error('[IPC] Erro ao ler restart-schedule.json:', e);
        return [];
    }
});
electron_1.ipcMain.handle('save-restart-schedule', async (_event, hours) => {
    const filePath = path.join(process.cwd(), 'restart-schedule.json');
    try {
        await fs.promises.writeFile(filePath, JSON.stringify(hours, null, 2), 'utf8');
        return true;
    }
    catch (e) {
        console.error('[IPC] Erro ao salvar restart-schedule.json:', e);
        return false;
    }
});
// Verificar existência de caminho
electron_1.ipcMain.handle('check-path-exists', async (event, pathToCheck) => {
    try {
        return fs.existsSync(pathToCheck);
    }
    catch (error) {
        console.error('Erro ao verificar existência do caminho:', error);
        return false;
    }
});
electron_1.ipcMain.handle('save-discord-webhooks', async (event, webhooks) => {
    try {
        await fileManager.saveDiscordWebhooks(webhooks);
        return { success: true };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Erro ao salvar discordWebhooks:', errMsg);
        return { success: false, error: errMsg };
    }
});
electron_1.ipcMain.handle('load-discord-webhooks', async () => {
    try {
        return await fileManager.loadDiscordWebhooks();
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Erro ao carregar discordWebhooks:', errMsg);
        return {};
    }
});
electron_1.ipcMain.handle('send-discord-webhook-message', async (event, webhookUrl, message) => {
    try {
        return await fileManager.sendDiscordWebhookMessage(webhookUrl, message);
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Erro ao enviar mensagem para webhook do Discord:', errMsg);
        return { success: false, error: errMsg };
    }
});
// Gerenciamento de notificações de jogadores
electron_1.ipcMain.handle('clear-notified-players', async () => {
    try {
        await fileManager.clearNotifiedPlayers();
        return { success: true };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Erro ao limpar jogadores notificados:', errMsg);
        return { success: false, error: errMsg };
    }
});
electron_1.ipcMain.handle('get-notified-players', async () => {
    try {
        return await fileManager.getNotifiedPlayers();
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Erro ao obter jogadores notificados:', errMsg);
        return [];
    }
});
//# sourceMappingURL=index.js.map