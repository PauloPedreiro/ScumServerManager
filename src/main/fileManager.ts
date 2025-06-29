import * as fs from 'fs-extra';
import * as path from 'path';
import * as ini from 'ini';
import * as os from 'os';

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
      const configDir = await this.findConfigDir(serverPath);
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
    let configDir = serverPath;
    
    // Verificar se o caminho já é o diretório de configuração
    if (!serverPath.replace(/\\/g, '/').endsWith('Saved/Config/WindowsServer')) {
      configDir = path.join(serverPath, this.configPath);
    }
    
    // Verificar se o diretório existe
    if (!await fs.pathExists(configDir)) {
      // Tentar encontrar o diretório de configuração em subpastas
      const possiblePaths = [
        path.join(serverPath, 'SCUM', this.configPath),
        path.join(serverPath, 'Saved', 'Config', 'WindowsServer'),
        path.join(serverPath, this.configPath)
      ];
      
      for (const possiblePath of possiblePaths) {
        if (await fs.pathExists(possiblePath)) {
          configDir = possiblePath;
          break;
        }
      }
      
      if (!await fs.pathExists(configDir)) {
        throw new Error(`Diretório de configuração não encontrado. Procurado em:\n${possiblePaths.join('\n')}`);
      }
    }
    
    return configDir;
  }

  async readServerConfig(serverPath: string): Promise<ServerConfig> {
    const configDir = await this.findConfigDir(serverPath);
    
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
    let configDir = serverPath;
    
    // Verificar se o caminho já é o diretório de configuração
    if (!serverPath.replace(/\\/g, '/').endsWith('Saved/Config/WindowsServer')) {
      configDir = path.join(serverPath, this.configPath);
    }
    
    try {
      // Verificar se o diretório existe
      if (!await fs.pathExists(configDir)) {
        // Tentar encontrar o diretório de configuração em subpastas
        const possiblePaths = [
          path.join(serverPath, 'SCUM', this.configPath),
          path.join(serverPath, 'Saved', 'Config', 'WindowsServer'),
          path.join(serverPath, this.configPath)
        ];
        
        for (const possiblePath of possiblePaths) {
          if (await fs.pathExists(possiblePath)) {
            configDir = possiblePath;
            break;
          }
        }
        
        if (!await fs.pathExists(configDir)) {
          // Criar o diretório se não existir
          await fs.ensureDir(configDir);
        }
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
    const configDir = path.join(serverPath, this.configPath);
    
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
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    const defaultFile = path.join(serverPath, `${base}.default${ext}`);
    const targetFile = path.join(serverPath, fileName);
    if (!await fs.pathExists(defaultFile)) {
      throw new Error(`Arquivo padrão não encontrado: ${defaultFile}`);
    }
    const content = await fs.readFile(defaultFile);
    await fs.writeFile(targetFile, content);
  }

  async saveAppConfig(serverPath: string): Promise<void> {
    const config: AppConfig = { lastServerPath: serverPath };
    await fs.writeJson(this.appConfigFile, config, { spaces: 2 });
  }

  async loadAppConfig(): Promise<AppConfig | null> {
    if (!await fs.pathExists(this.appConfigFile)) return null;
    return await fs.readJson(this.appConfigFile);
  }

  async clearAppConfig(): Promise<void> {
    if (await fs.pathExists(this.appConfigFile)) {
      await fs.remove(this.appConfigFile);
    }
  }
} 