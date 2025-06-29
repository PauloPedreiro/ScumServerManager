import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { FileManager } from './fileManager';
import { BackupManager } from './backupManager';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
console.log('NODE_ENV (início):', process.env.NODE_ENV);

let mainWindow: BrowserWindow | null = null;
const fileManager = new FileManager();
const backupManager = new BackupManager();

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  console.log('Preload path:', preloadPath);
  console.log('Icon path:', iconPath);

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
  console.log('NODE_ENV (ajustado):', nodeEnv);
  if (nodeEnv === 'development') {
    console.log('Carregando frontend de desenvolvimento: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('Erro ao carregar frontend de desenvolvimento:', err);
    });
    mainWindow.webContents.openDevTools();
  } else {
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

// Selecionar pasta do servidor SCUM
ipcMain.handle('select-server-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Selecionar pasta do servidor SCUM'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
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
    throw error;
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

// Configuração persistente do caminho do servidor
ipcMain.handle('save-app-config', async (event, serverPath: string) => {
  try {
    await fileManager.saveAppConfig(serverPath);
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar config.json:', error);
    throw error;
  }
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