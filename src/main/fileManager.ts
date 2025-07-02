import * as fs from 'fs-extra';
import * as path from 'path';
import * as ini from 'ini';
import * as os from 'os';
import psList from 'ps-list';
import { spawn } from 'child_process';

export interface ServerConfig {
  serverSettings: any;
  gameSettings: any;
  economyConfig: any;
  raidTimes: any[];
  users: any;
}

export interface ServerCache {
  serverPath: string;
  lastLoaded: string;
  serverName: string;
  maxPlayers: number;
  playstyle: string;
  configDir: string;
  version: string;
}

export interface AppConfig {
  lastServerPath: string;
  steamcmdPath?: string;
  serverPath?: string;
  installPath?: string;
  iniConfigPath?: string;
  logsPath?: string;
  serverPort?: number;
  maxPlayers?: number;
  enableBattleye?: boolean;
}

export class FileManager {
  private configPath = 'Saved/Config/WindowsServer';
  private cacheDir = path.join(os.homedir(), '.scum-server-manager');
  private cacheFile = path.join(this.cacheDir, 'server-cache.json');
  private appConfigFile = path.join(process.cwd(), 'config.json');

  constructor() {
    // Garantir que o diretório de cache existe
    fs.ensureDirSync(this.cacheDir);
  }

  async saveServerCache(serverPath: string, config: ServerConfig, configDir: string): Promise<void> {
    try {
      const cache: ServerCache = {
        serverPath,
        lastLoaded: new Date().toISOString(),
        serverName: config.serverSettings?.General?.ServerName || 'Servidor SCUM',
        maxPlayers: config.serverSettings?.General?.MaxPlayers || 64,
        playstyle: config.serverSettings?.General?.ServerPlaystyle || 'PVE',
        configDir,
        version: '1.0.0'
      };

      await fs.writeJson(this.cacheFile, cache, { spaces: 2 });
      console.log('Cache do servidor salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar cache do servidor:', error);
    }
  }

  async loadServerCache(): Promise<ServerCache | null> {
    try {
      if (!await fs.pathExists(this.cacheFile)) {
        return null;
      }

      const cache = await fs.readJson(this.cacheFile) as ServerCache;
      
      // Verificar se o caminho do servidor ainda existe
      if (!await fs.pathExists(cache.serverPath)) {
        console.log('Caminho do servidor em cache não existe mais');
        return null;
      }

      // Verificar se o diretório de configuração ainda existe
      if (!await fs.pathExists(cache.configDir)) {
        console.log('Diretório de configuração em cache não existe mais');
        return null;
      }

      console.log('Cache do servidor carregado com sucesso');
      return cache;
    } catch (error) {
      console.error('Erro ao carregar cache do servidor:', error);
      return null;
    }
  }

  async clearServerCache(): Promise<void> {
    try {
      if (await fs.pathExists(this.cacheFile)) {
        await fs.remove(this.cacheFile);
        console.log('Cache do servidor removido');
      }
    } catch (error) {
      console.error('Erro ao remover cache do servidor:', error);
    }
  }

  async getServerInfo(serverPath: string): Promise<{ name: string; maxPlayers: number; playstyle: string } | null> {
    try {
      const appConfig = await this.loadAppConfig();
      const configDir = appConfig?.iniConfigPath || await this.findConfigDir(serverPath);
      const serverSettings = await this.readIniFile(path.join(configDir, 'ServerSettings.ini'));
      return {
        name: serverSettings?.General?.ServerName || 'Servidor SCUM',
        maxPlayers: serverSettings?.General?.MaxPlayers || 64,
        playstyle: serverSettings?.General?.ServerPlaystyle || 'PVE'
      };
    } catch (error) {
      console.error('Erro ao obter informações do servidor:', error);
      return null;
    }
  }

  private async findConfigDir(serverPath: string): Promise<string> {
    // Extrair o diretório do caminho do servidor (remover o nome do executável)
    const serverDir = path.dirname(serverPath);
    // Busca sempre a partir da pasta base do SCUM
    const configDir = path.join(serverDir, this.configPath);
    if (await fs.pathExists(configDir)) {
      return configDir;
    }
    // Se não existir, tenta criar
    await fs.ensureDir(configDir);
    return configDir;
  }

  async readServerConfig(serverPath: string): Promise<ServerConfig> {
    const appConfig = await this.loadAppConfig();
    const configDir = appConfig?.iniConfigPath || await this.findConfigDir(serverPath);
    try {
      // Ler todos os arquivos de configuração
      const serverSettings = await this.readIniFile(path.join(configDir, 'ServerSettings.ini'));
      const gameSettings = await this.readIniFile(path.join(configDir, 'GameUserSettings.ini'));
      const economyConfig = await this.readJsonFile(path.join(configDir, 'EconomyOverride.json'));
      const raidTimes = await this.readJsonFile(path.join(configDir, 'RaidTimes.json'));
      // Ler arquivos de usuários
      const users = {
        adminUsers: await this.readUserFile(path.join(configDir, 'AdminUsers.ini')),
        serverSettingsAdminUsers: await this.readUserFile(path.join(configDir, 'ServerSettingsAdminUsers.ini')),
        exclusiveUsers: await this.readUserFile(path.join(configDir, 'ExclusiveUsers.ini')),
        whitelistedUsers: await this.readUserFile(path.join(configDir, 'WhitelistedUsers.ini')),
        bannedUsers: await this.readUserFile(path.join(configDir, 'BannedUsers.ini')),
        silencedUsers: await this.readUserFile(path.join(configDir, 'SilencedUsers.ini'))
      };
      const config = {
        serverSettings,
        gameSettings,
        economyConfig,
        raidTimes: raidTimes.raidingTimes || [],
        users
      };
      // Salvar cache após carregar com sucesso
      await this.saveServerCache(serverPath, config, configDir);
      return config;
    } catch (error) {
      console.error('Erro ao ler configurações do servidor:', error);
      throw error;
    }
  }

  async saveServerConfig(serverPath: string, config: ServerConfig): Promise<void> {
    const appConfig = await this.loadAppConfig();
    let configDir = appConfig?.iniConfigPath || serverPath;
    try {
      // Verificar se o diretório existe
      if (!await fs.pathExists(configDir)) {
        await fs.ensureDir(configDir);
      }
      // Salvar arquivos de configuração
      await this.saveIniFile(path.join(configDir, 'ServerSettings.ini'), config.serverSettings);
      await this.saveIniFile(path.join(configDir, 'GameUserSettings.ini'), config.gameSettings);
      await this.saveJsonFile(path.join(configDir, 'EconomyOverride.json'), config.economyConfig);
      await this.saveJsonFile(path.join(configDir, 'RaidTimes.json'), { raidingTimes: config.raidTimes });
      // Salvar arquivos de usuários
      await this.saveUserFile(path.join(configDir, 'AdminUsers.ini'), config.users.adminUsers);
      await this.saveUserFile(path.join(configDir, 'ServerSettingsAdminUsers.ini'), config.users.serverSettingsAdminUsers);
      await this.saveUserFile(path.join(configDir, 'ExclusiveUsers.ini'), config.users.exclusiveUsers);
      await this.saveUserFile(path.join(configDir, 'WhitelistedUsers.ini'), config.users.whitelistedUsers);
      await this.saveUserFile(path.join(configDir, 'BannedUsers.ini'), config.users.bannedUsers);
      await this.saveUserFile(path.join(configDir, 'SilencedUsers.ini'), config.users.silencedUsers);
    } catch (error) {
      console.error('Erro ao salvar configurações do servidor:', error);
      throw error;
    }
  }

  // Função utilitária para remover prefixo 'scum.' das chaves
  private removeScumPrefix(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = key.startsWith('scum.') ? key.slice(5) : key;
        result[newKey] = this.removeScumPrefix(obj[key]);
      }
    }
    return result;
  }

  // Função utilitária para adicionar prefixo 'scum.' nas chaves
  private addScumPrefix(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = key.startsWith('scum.') ? key : `scum.${key}`;
        result[newKey] = this.addScumPrefix(obj[key]);
      }
    }
    return result;
  }

  async readIniFile(filePath: string): Promise<any> {
    try {
      if (!await fs.pathExists(filePath)) {
        return {};
      }
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = ini.parse(content);
      return this.removeScumPrefix(parsed);
    } catch (error) {
      console.error(`Erro ao ler arquivo INI ${filePath}:`, error);
      throw error;
    }
  }

  async saveIniFile(filePath: string, content: any): Promise<void> {
    try {
      const iniContent = ini.stringify(this.addScumPrefix(content));
      await fs.writeFile(filePath, iniContent, 'utf8');
    } catch (error) {
      console.error(`Erro ao salvar arquivo INI ${filePath}:`, error);
      throw error;
    }
  }

  async readJsonFile(filePath: string): Promise<any> {
    try {
      if (!await fs.pathExists(filePath)) {
        return {};
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Erro ao ler arquivo JSON ${filePath}:`, error);
      throw error;
    }
  }

  async saveJsonFile(filePath: string, content: any): Promise<void> {
    try {
      const jsonContent = JSON.stringify(content, null, 2);
      await fs.writeFile(filePath, jsonContent, 'utf8');
    } catch (error) {
      console.error(`Erro ao salvar arquivo JSON ${filePath}:`, error);
      throw error;
    }
  }

  async readUserFile(filePath: string): Promise<string[]> {
    try {
      if (!await fs.pathExists(filePath)) {
        return [];
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (error) {
      console.error(`Erro ao ler arquivo de usuários ${filePath}:`, error);
      return [];
    }
  }

  async saveUserFile(filePath: string, users: string[]): Promise<void> {
    try {
      const content = users.filter(user => user.trim().length > 0).join('\n');
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      console.error(`Erro ao salvar arquivo de usuários ${filePath}:`, error);
      throw error;
    }
  }

  async validateConfig(config: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validar configurações básicas
      if (!config.serverSettings?.General?.ServerName) {
        errors.push('Nome do servidor é obrigatório');
      }

      if (!config.serverSettings?.General?.MaxPlayers || 
          config.serverSettings.General.MaxPlayers < 1 || 
          config.serverSettings.General.MaxPlayers > 100) {
        errors.push('MaxPlayers deve estar entre 1 e 100');
      }

      // Validar configurações de respawn
      if (config.serverSettings?.Respawn?.RandomRespawnPrice < 0) {
        errors.push('Preço de respawn aleatório não pode ser negativo');
      }

      // Validar configurações de veículos
      if (config.serverSettings?.Vehicles?.FuelDrainFromEngineMultiplier < 0) {
        errors.push('Multiplicador de drenagem de combustível não pode ser negativo');
      }

      // Validar horários de raid
      if (config.raidTimes && Array.isArray(config.raidTimes)) {
        config.raidTimes.forEach((raid: any, index: number) => {
          if (!raid.time || !raid.day) {
            errors.push(`Raid ${index + 1}: Horário e dia são obrigatórios`);
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push('Erro durante a validação: ' + (error as Error).message);
      return {
        valid: false,
        errors
      };
    }
  }

  async listConfigFiles(serverPath: string): Promise<string[]> {
    // Extrair o diretório do caminho do servidor (remover o nome do executável)
    const serverDir = path.dirname(serverPath);
    const configDir = path.join(serverDir, this.configPath);
    
    try {
      if (!await fs.pathExists(configDir)) {
        return [];
      }
      
      const files = await fs.readdir(configDir);
      return files.filter(file => 
        file.endsWith('.ini') || 
        file.endsWith('.json') ||
        file.endsWith('.bak')
      );
    } catch (error) {
      console.error('Erro ao listar arquivos de configuração:', error);
      return [];
    }
  }

  async restoreDefaultFile(serverPath: string, fileName: string): Promise<void> {
    // Extrair o diretório do caminho do servidor (remover o nome do executável)
    const serverDir = path.dirname(serverPath);
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    const defaultFile = path.join(serverDir, `${base}.default${ext}`);
    const targetFile = path.join(serverDir, fileName);
    if (!await fs.pathExists(defaultFile)) {
      throw new Error(`Arquivo padrão não encontrado: ${defaultFile}`);
    }
    const content = await fs.readFile(defaultFile);
    await fs.writeFile(targetFile, content);
  }

  async saveAppConfig(
    serverPath: string, 
    steamcmdPath?: string,
    installPath?: string,
    serverPort?: number,
    maxPlayers?: number,
    enableBattleye?: boolean,
    iniConfigPath?: string,
    logsPath?: string
  ): Promise<void> {
    const config: AppConfig = { 
      lastServerPath: serverPath, 
      steamcmdPath,
      installPath,
      serverPort,
      maxPlayers,
      enableBattleye,
      iniConfigPath,
      logsPath
    };
    await fs.writeJson(this.appConfigFile, config, { spaces: 2 });
  }

  async loadAppConfig(): Promise<AppConfig | null> {
    const defaultConfig: AppConfig = {
      lastServerPath: 'C:\\Servers\\scum\\SCUM\\Binaries\\Win64',
      steamcmdPath: 'C:\\Servers\\steamcmd\\steamcmd.exe',
      serverPath: 'C:\\Servers\\scum\\SCUM\\Binaries\\Win64\\SCUMServer.exe',
      installPath: 'C:\\Servers\\scum',
      iniConfigPath: 'C:\\Servers\\scum\\SCUM\\Saved\\Config\\WindowsServer',
      logsPath: 'C:\\Servers\\scum\\SCUM\\Saved\\Logs',
      serverPort: 8900,
      maxPlayers: 64,
      enableBattleye: true
    };
    let config: AppConfig = defaultConfig;
    if (await fs.pathExists(this.appConfigFile)) {
      try {
        const loaded = await fs.readJson(this.appConfigFile);
        config = { ...defaultConfig, ...loaded };
        (Object.keys(defaultConfig) as (keyof AppConfig)[]).forEach((key) => {
          if (config[key] === undefined || config[key] === "") {
            (config as any)[key] = defaultConfig[key];
          }
        });
        await fs.writeJson(this.appConfigFile, config, { spaces: 2 });
      } catch (err) {
        // Se der erro de parse, sobrescreve com padrão
        await fs.writeJson(this.appConfigFile, defaultConfig, { spaces: 2 });
        config = defaultConfig;
      }
    } else {
      await fs.writeJson(this.appConfigFile, defaultConfig, { spaces: 2 });
    }
    return config;
  }

  async clearAppConfig(): Promise<void> {
    try {
      if (await fs.pathExists(this.appConfigFile)) {
        await fs.remove(this.appConfigFile);
      }
    } catch (error) {
      console.error('Erro ao limpar configuração do app:', error);
    }
  }

  async listDir(dirPath: string): Promise<string[]> {
    try {
      if (!await fs.pathExists(dirPath)) {
        return [];
      }
      
      const files = await fs.readdir(dirPath);
      return files;
    } catch (error) {
      console.error('Erro ao listar diretório:', error);
      return [];
    }
  }

  async getServerStatus(serverPath: string): Promise<any> {
    try {
      // Simular status do servidor (em uma implementação real, você verificaria processos)
      const isRunning = Math.random() > 0.5; // Simulação aleatória
      
      return {
        running: isRunning,
        uptime: isRunning ? '2h 15m' : '0m',
        players: isRunning ? Math.floor(Math.random() * 20) : 0,
        maxPlayers: 64,
        cpu: isRunning ? Math.floor(Math.random() * 100) : 0,
        memory: isRunning ? Math.floor(Math.random() * 100) : 0,
        network: {
          in: isRunning ? Math.floor(Math.random() * 1000) : 0,
          out: isRunning ? Math.floor(Math.random() * 1000) : 0
        }
      };
    } catch (error) {
      console.error('Erro ao obter status do servidor:', error);
      return {
        running: false,
        uptime: '0m',
        players: 0,
        maxPlayers: 64,
        cpu: 0,
        memory: 0,
        network: { in: 0, out: 0 }
      };
    }
  }

  async getServerLogs(serverPath: string, options: { level: string; filter: string; limit: number }): Promise<any[]> {
    try {
      const appConfig = await this.loadAppConfig();
      // Extrair o diretório do caminho do servidor (remover o nome do executável)
      const serverDir = path.dirname(serverPath);
      const logsDir = appConfig?.logsPath || path.join(serverDir, 'Saved', 'Logs');
      // Simular logs do servidor
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Servidor iniciado com sucesso',
          source: 'SCUM Server'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'INFO',
          message: 'Jogador conectado: SANDMAN',
          source: 'SCUM Server'
        }
      ];
      
      return logs.filter(log => 
        log.level === options.level || options.level === 'ALL'
      ).slice(0, options.limit);
    } catch (error) {
      console.error('Erro ao obter logs do servidor:', error);
      return [];
    }
  }

  async startServer(serverPath: string): Promise<boolean> {
    try {
      console.log('Iniciando servidor em:', serverPath);
      
      // Carrega a configuração atual
      const config = await this.loadAppConfig();
      if (!config) {
        throw new Error('Configuração não encontrada');
      }
      
      // Inicia o servidor com as configurações atuais
      await this.startServerWithConfig(
        serverPath,
        config.serverPort || 8900,
        config.maxPlayers || 64,
        config.enableBattleye !== false
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao iniciar servidor:', error);
      return false;
    }
  }

  async stopServer(serverPath: string): Promise<boolean> {
    try {
      console.log('Parando servidor em:', serverPath);
      const { exec } = require('child_process');
      
      return new Promise((resolve, reject) => {
        // Comando para parar o processo SCUMServer.exe
        const cmd = 'taskkill /f /im SCUMServer.exe';
        exec(cmd, (error: any, stdout: any, stderr: any) => {
          if (error) {
            // Se o processo não estiver rodando, não é um erro
            if (error.code === 1) {
              console.log('Servidor não estava rodando');
              resolve(true);
            } else {
              console.error('Erro ao parar servidor:', error);
              reject(error);
            }
          } else {
            console.log('Servidor parado com sucesso');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Erro ao parar servidor:', error);
      return false;
    }
  }

  async restartServer(serverPath: string): Promise<boolean> {
    try {
      console.log('Reiniciando servidor em:', serverPath);
      
      // Primeiro para o servidor
      await this.stopServer(serverPath);
      
      // Aguarda um pouco para garantir que o processo foi finalizado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Carrega a configuração atual
      const config = await this.loadAppConfig();
      if (!config) {
        throw new Error('Configuração não encontrada');
      }
      
      // Reinicia o servidor com as configurações atuais
      await this.startServerWithConfig(
        serverPath,
        config.serverPort || 8900,
        config.maxPlayers || 64,
        config.enableBattleye !== false
      );
      
      console.log('Servidor reiniciado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao reiniciar servidor:', error);
      return false;
    }
  }

  async downloadLogs(serverPath: string): Promise<void> {
    try {
      console.log('Baixando logs do servidor:', serverPath);
      // Aqui você implementaria a lógica real para baixar logs
    } catch (error) {
      console.error('Erro ao baixar logs:', error);
      throw error;
    }
  }

  async clearLogs(serverPath: string): Promise<void> {
    try {
      console.log('Limpando logs do servidor:', serverPath);
      // Aqui você implementaria a lógica real para limpar logs
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      throw error;
    }
  }

  async readConfigFile(filePath: string): Promise<string> {
    try {
      if (!await fs.pathExists(filePath)) {
        return '';
      }
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`Erro ao ler arquivo de configuração ${filePath}:`, error);
      throw error;
    }
  }

  async writeConfigFile(filePath: string, data: any): Promise<void> {
    try {
      const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      console.error(`Erro ao escrever arquivo de configuração ${filePath}:`, error);
      throw error;
    }
  }

  async updateServerWithSteamcmd(steamcmdPath: string, installPath: string): Promise<{ success: boolean, output: string }> {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      const cmd = `"${steamcmdPath}" +force_install_dir "${installPath}" +login anonymous +app_update 3792580 +quit`;
      exec(cmd, (error: any, stdout: any, stderr: any) => {
        const output = (stdout || '') + '\n' + (stderr || '');
        if (error) {
          console.error('Erro ao atualizar servidor via steamcmd:', error);
          resolve({ success: false, output });
        } else {
          resolve({ success: true, output });
        }
      });
    });
  }

  async startServerWithConfig(serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean): Promise<void> {
    const { exec } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    // Se serverPath não for absoluto, busque do config.json
    if (!path.isAbsolute(serverPath) || !serverPath.toLowerCase().endsWith('scumserver.exe')) {
      try {
        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
        if (config.serverPath) {
          console.log('[startServerWithConfig] Corrigindo serverPath para:', config.serverPath);
          serverPath = config.serverPath;
        }
      } catch (e) {
        console.error('[startServerWithConfig] Erro ao ler config.json:', e);
      }
    }
    const serverDir = path.dirname(serverPath);
    console.log('[startServerWithConfig] Usando diretório:', serverDir);
    return new Promise((resolve, reject) => {
      let cmd = `cd /d "${serverDir}" && start SCUMServer.exe -log -port=${serverPort}`;
      if (maxPlayers) {
        cmd += ` -MaxPlayers=${maxPlayers}`;
      }
      if (!enableBattleye) {
        cmd += ` -nobattleye`;
      }
      exec(cmd, (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error('Erro ao iniciar servidor:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getRealServerStatus(serverPath: string): Promise<any> {
    try {
      // 1. Verificar processo
      const processList = await psList();
      const scumProc = processList.find((p: any) => p.name.toLowerCase().includes('scumserver.exe'));
      const running = !!scumProc;
      let uptime = running ? 'Rodando' : 'Parado';
      let cpu = 0;
      let memory = 0;
      
      if (scumProc) {
        cpu = scumProc.cpu || 0;
        memory = Math.round((scumProc.memory || 0) / 1024 / 1024); // MB
      }

      // 2. Ler log mais recente para contar jogadores
      // Extrair o diretório do servidor (remover o nome do executável)
      const serverDir = path.dirname(serverPath);
      const logsDir = path.join(serverDir, 'Saved', 'SaveFiles', 'Logs');
      let players = 0;
      let maxPlayers = 64;
      
      try {
        if (await fs.pathExists(logsDir)) {
          const files = await fs.readdir(logsDir);
          const loginLogs = files.filter(f => f.startsWith('login_') && f.endsWith('.log'));
          if (loginLogs.length > 0) {
            const latestLog = loginLogs.sort().reverse()[0];
            const logContent = await fs.readFile(path.join(logsDir, latestLog), 'utf8');
            // Contar jogadores online pelo último evento de cada SteamID
            const lines = logContent.split(/\r?\n/).filter(Boolean);
            const playerStatus: Record<string, string> = {};
            for (const line of lines) {
              const match = line.match(/SteamID: (\d+).*(Login|Logout)/);
              if (match) {
                playerStatus[match[1]] = match[2];
              }
            }
            players = Object.values(playerStatus).filter(status => status === 'Login').length;
          }
        }
      } catch (error) {
        console.log('Erro ao ler logs de jogadores:', error);
      }

      return { 
        running, 
        uptime, 
        cpu, 
        memory, 
        players, 
        maxPlayers,
        processId: scumProc?.pid || null
      };
    } catch (error) {
      console.error('Erro ao obter status real do servidor:', error);
      return {
        running: false,
        uptime: 'Erro',
        cpu: 0,
        memory: 0,
        players: 0,
        maxPlayers: 64,
        processId: null
      };
    }
  }

  startUpdateServerWithSteamcmdStream(steamcmdPath: string, installPath: string, event: any) {
    console.log('[SteamCMD] Iniciando atualização via stream...');
    const cmd = `"${steamcmdPath}" +force_install_dir "${installPath}" +login anonymous +app_update 3792580 +quit`;
    const child = spawn(cmd, { shell: true });
    child.stdout.on('data', (data: Buffer) => {
      console.log('[SteamCMD][stdout]', data.toString());
      event.sender.send('update-server-log', data.toString());
    });
    child.stderr.on('data', (data: Buffer) => {
      console.log('[SteamCMD][stderr]', data.toString());
      event.sender.send('update-server-log', data.toString());
    });
    child.on('close', (code: number) => {
      console.log('[SteamCMD] Processo finalizado com código:', code);
      event.sender.send('update-server-log-end', code);
    });
  }
} 