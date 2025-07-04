import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { FileManager } from './fileManager';
import { BackupManager } from './backupManager';
import * as fs from 'fs';
import { startVehicleDestructionWatcher } from './vehicleDestructionWatcher';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
// console.log('NODE_ENV (início):', process.env.NODE_ENV);

let mainWindow: BrowserWindow | null = null;
const fileManager = new FileManager();
const backupManager = new BackupManager();

// Iniciar monitoramento automático de destruição de veículos
startVehicleDestructionWatcher(fileManager).catch(() => {});

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  // console.log('Preload path:', preloadPath);
  // console.log('Icon path:', iconPath);

  mainWindow = new BrowserWindow({
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
  } else {
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
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers para comunicação com o renderer process

// Selecionar executável do servidor (SCUMServer.exe)
ipcMain.handle('select-server-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Executáveis', extensions: ['exe'] }],
      title: 'Selecionar SCUMServer.exe'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao selecionar executável do servidor:', error);
    throw error;
  }
});

// Selecionar pasta de instalação
ipcMain.handle('select-install-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Selecionar pasta de instalação do SCUM'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao selecionar pasta de instalação:', error);
    throw error;
  }
});

// Ler configurações do servidor
ipcMain.handle('read-server-config', async (event, serverPath: string) => {
  try {
    return await fileManager.readServerConfig(serverPath);
  } catch (error) {
    console.error('Erro ao ler configurações:', error);
    throw error;
  }
});

// Salvar configurações do servidor
ipcMain.handle('save-server-config', async (event, serverPath: string, config: any) => {
  try {
    // Criar backup antes de salvar
    await backupManager.createBackup(serverPath);
    
    // Salvar configurações
    await fileManager.saveServerConfig(serverPath, config);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw error;
  }
});

// Ler arquivo específico
ipcMain.handle('read-ini-file', async (event, filePath: string) => {
  try {
    return await fileManager.readIniFile(filePath);
  } catch (error) {
    console.error('Erro ao ler arquivo INI:', error);
    throw error;
  }
});

// Salvar arquivo específico
ipcMain.handle('save-ini-file', async (event, filePath: string, content: any) => {
  try {
    return await fileManager.saveIniFile(filePath, content);
  } catch (error) {
    console.error('Erro ao salvar arquivo INI:', error);
    throw error;
  }
});

// Ler arquivo JSON
ipcMain.handle('read-json-file', async (event, filePath: string) => {
  try {
    return await fileManager.readJsonFile(filePath);
  } catch (error) {
    console.error('Erro ao ler arquivo JSON:', error);
    // Retornar objeto vazio em vez de propagar o erro
    return {};
  }
});

// Salvar arquivo JSON
ipcMain.handle('save-json-file', async (event, filePath: string, content: any) => {
  try {
    return await fileManager.saveJsonFile(filePath, content);
  } catch (error) {
    console.error('Erro ao salvar arquivo JSON:', error);
    throw error;
  }
});

// Listar arquivos de backup
ipcMain.handle('list-backups', async (event, serverPath: string) => {
  try {
    return await backupManager.listBackups(serverPath);
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    throw error;
  }
});

// Restaurar backup
ipcMain.handle('restore-backup', async (event, serverPath: string, backupName: string) => {
  try {
    return await backupManager.restoreBackup(serverPath, backupName);
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    throw error;
  }
});

// Validar configurações
ipcMain.handle('validate-config', async (event, config: any) => {
  try {
    return await fileManager.validateConfig(config);
  } catch (error) {
    console.error('Erro ao validar configurações:', error);
    throw error;
  }
});

// Restaurar arquivo para o padrão
ipcMain.handle('restore-default-file', async (event, serverPath: string, fileName: string) => {
  try {
    await fileManager.restoreDefaultFile(serverPath, fileName);
    return { success: true };
  } catch (error) {
    console.error('Erro ao restaurar arquivo padrão:', error);
    throw error;
  }
});

// Listar arquivos de configuração
ipcMain.handle('list-config-files', async (event, serverPath: string) => {
  try {
    return await fileManager.listConfigFiles(serverPath);
  } catch (error) {
    console.error('Erro ao listar arquivos de configuração:', error);
    throw error;
  }
});

// Listar arquivos em um diretório
ipcMain.handle('list-dir', async (event, dirPath: string) => {
  try {
    return await fileManager.listDir(dirPath);
  } catch (error) {
    console.error('Erro ao listar diretório:', error);
    throw error;
  }
});

// Carregar cache do servidor
ipcMain.handle('load-server-cache', async () => {
  try {
    return await fileManager.loadServerCache();
  } catch (error) {
    console.error('Erro ao carregar cache do servidor:', error);
    throw error;
  }
});

// Limpar cache do servidor
ipcMain.handle('clear-server-cache', async () => {
  try {
    await fileManager.clearServerCache();
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar cache do servidor:', error);
    throw error;
  }
});

// Obter informações básicas do servidor
ipcMain.handle('get-server-info', async (event, serverPath: string) => {
  try {
    return await fileManager.getServerInfo(serverPath);
  } catch (error) {
    console.error('Erro ao obter informações do servidor:', error);
    throw error;
  }
});

// Configuração persistente do caminho do servidor e steamcmd
ipcMain.handle('save-app-config', async (event, config) => {
  await fileManager.saveAppConfig(config);
});

ipcMain.handle('load-app-config', async () => {
  try {
    return await fileManager.loadAppConfig();
  } catch (error) {
    console.error('Erro ao carregar config.json:', error);
    throw error;
  }
});

ipcMain.handle('clear-app-config', async () => {
  try {
    await fileManager.clearAppConfig();
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar config.json:', error);
    throw error;
  }
});

// Obter status do servidor
ipcMain.handle('get-server-status', async (event, serverPath: string) => {
  try {
    return await fileManager.getServerStatus(serverPath);
  } catch (error) {
    console.error('Erro ao obter status do servidor:', error);
    throw error;
  }
});

// Obter logs do servidor
ipcMain.handle('get-server-logs', async (event, serverPath: string, options: any) => {
  try {
    return await fileManager.getServerLogs(serverPath, options);
  } catch (error) {
    console.error('Erro ao obter logs do servidor:', error);
    throw error;
  }
});

// Iniciar servidor
ipcMain.handle('start-server', async (event, serverPath: string) => {
  try {
    return await fileManager.startServer(serverPath);
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    throw error;
  }
});

// Parar servidor
ipcMain.handle('stop-server', async (event, serverPath: string) => {
  try {
    return await fileManager.stopServer(serverPath);
  } catch (error) {
    console.error('Erro ao parar servidor:', error);
    throw error;
  }
});

// Reiniciar servidor
ipcMain.handle('restart-server', async (event, serverPath: string) => {
  try {
    return await fileManager.restartServer(serverPath);
  } catch (error) {
    console.error('Erro ao reiniciar servidor:', error);
    throw error;
  }
});

// Baixar logs
ipcMain.handle('download-logs', async (event, serverPath: string) => {
  try {
    return await fileManager.downloadLogs(serverPath);
  } catch (error) {
    console.error('Erro ao baixar logs:', error);
    throw error;
  }
});

// Limpar logs
ipcMain.handle('clear-logs', async (event, serverPath: string) => {
  try {
    return await fileManager.clearLogs(serverPath);
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    throw error;
  }
});

// File operations (legacy)
ipcMain.handle('read-config-file', async (event, filePath: string) => {
  try {
    return await fileManager.readConfigFile(filePath);
  } catch (error) {
    console.error('Erro ao ler arquivo de configuração:', error);
    throw error;
  }
});

ipcMain.handle('write-config-file', async (event, filePath: string, data: any) => {
  try {
    return await fileManager.writeConfigFile(filePath, data);
  } catch (error) {
    console.error('Erro ao escrever arquivo de configuração:', error);
    throw error;
  }
});

// Backup operations (legacy)
ipcMain.handle('get-backups', async (event) => {
  try {
    return await backupManager.getBackups();
  } catch (error) {
    console.error('Erro ao obter backups:', error);
    throw error;
  }
});

ipcMain.handle('create-backup', async (event, options: any) => {
  try {
    return await backupManager.createBackupWithOptions(options);
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    throw error;
  }
});

ipcMain.handle('delete-backup', async (event, backupId: string) => {
  try {
    // Para a implementação legacy, vamos usar um serverPath padrão
    const serverPath = process.cwd(); // Usar diretório atual como fallback
    return await backupManager.deleteBackup(serverPath, backupId);
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    throw error;
  }
});

ipcMain.handle('download-backup', async (event, backupId: string) => {
  try {
    return await backupManager.downloadBackup(backupId);
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    throw error;
  }
});

// Atualizar servidor via steamcmd
ipcMain.handle('update-server-with-steamcmd', async (event, steamcmdPath: string, installPath: string) => {
  try {
    await fileManager.updateServerWithSteamcmd(steamcmdPath, installPath);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar servidor via steamcmd:', error);
    throw error;
  }
});

// Selecionar executável do steamcmd
ipcMain.handle('select-steamcmd-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Executáveis', extensions: ['exe'] }],
      title: 'Selecionar steamcmd.exe'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao selecionar executável do steamcmd:', error);
    throw error;
  }
});

// Iniciar servidor com configurações
ipcMain.handle('start-server-with-config', async (event, serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean) => {
  try {
    await fileManager.startServerWithConfig(serverPath, serverPort, maxPlayers, enableBattleye);
    return { success: true };
  } catch (error) {
    console.error('Erro ao iniciar servidor com configurações:', error);
    throw error;
  }
});

ipcMain.handle('get-real-server-status', async (event, serverPath: string) => {
  try {
    return await fileManager.getRealServerStatus(serverPath);
  } catch (error) {
    console.error('Erro ao obter status real do servidor:', error);
    throw error;
  }
});

ipcMain.on('start-update-server-with-steamcmd-stream', (_event, steamcmdPath, installPath) => {
  fileManager.startUpdateServerWithSteamcmdStream(steamcmdPath, installPath, _event);
});

ipcMain.handle('load-restart-schedule', async () => {
  const filePath = path.join(process.cwd(), 'restart-schedule.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (e) {
    console.error('[IPC] Erro ao ler restart-schedule.json:', e);
    return [];
  }
});

ipcMain.handle('save-restart-schedule', async (_event, hours: number[]) => {
  const filePath = path.join(process.cwd(), 'restart-schedule.json');
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(hours, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[IPC] Erro ao salvar restart-schedule.json:', e);
    return false;
  }
});

// Verificar existência de caminho
ipcMain.handle('check-path-exists', async (event, pathToCheck: string) => {
  try {
    return fs.existsSync(pathToCheck);
  } catch (error) {
    console.error('Erro ao verificar existência do caminho:', error);
    return false;
  }
});

ipcMain.handle('save-discord-webhooks', async (event, webhooks) => {
  try {
    await fileManager.saveDiscordWebhooks(webhooks);
    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro ao salvar discordWebhooks:', errMsg);
    return { success: false, error: errMsg };
  }
});

ipcMain.handle('load-discord-webhooks', async () => {
  try {
    return await fileManager.loadDiscordWebhooks();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro ao carregar discordWebhooks:', errMsg);
    return {};
  }
});

ipcMain.handle('send-discord-webhook-message', async (event, webhookUrl, message) => {
  try {
    return await fileManager.sendDiscordWebhookMessage(webhookUrl, message);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro ao enviar mensagem para webhook do Discord:', errMsg);
    return { success: false, error: errMsg };
  }
});

// Gerenciamento de notificações de jogadores
ipcMain.handle('clear-notified-players', async () => {
  try {
    await fileManager.clearNotifiedPlayers();
    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro ao limpar jogadores notificados:', errMsg);
    return { success: false, error: errMsg };
  }
});

ipcMain.handle('get-notified-players', async () => {
  try {
    return await fileManager.getNotifiedPlayers();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro ao obter jogadores notificados:', errMsg);
    return [];
  }
}); 