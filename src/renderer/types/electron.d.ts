declare global {
  interface Window {
    electronAPI: {
      // Seleção de pasta
      selectServerFolder: () => Promise<string | null>;
      selectSteamcmdFolder: () => Promise<string | null>;
      selectInstallFolder: () => Promise<string | null>;
      
      // Configurações do servidor
      readServerConfig: (serverPath: string) => Promise<any>;
      saveServerConfig: (serverPath: string, config: any) => Promise<any>;
      
      // Cache do servidor
      loadServerCache: () => Promise<any>;
      clearServerCache: () => Promise<any>;
      getServerInfo: (serverPath: string) => Promise<any>;
      
      // Arquivos INI
      readIniFile: (filePath: string) => Promise<any>;
      saveIniFile: (filePath: string, content: any) => Promise<any>;
      
      // Arquivos JSON
      readJsonFile: (filePath: string) => Promise<any>;
      saveJsonFile: (filePath: string, content: any) => Promise<any>;
      
      // Backup
      listBackups: (serverPath: string) => Promise<any>;
      restoreBackup: (serverPath: string, backupName: string) => Promise<any>;
      
      // Validação
      validateConfig: (config: any) => Promise<any>;
      
      // Listar arquivos de configuração
      listConfigFiles: (serverPath: string) => Promise<any>;
      
      // Listar arquivos em um diretório
      listDir: (dirPath: string) => Promise<string[]>;
      
      // Verificar existência de caminho
      checkPathExists: (path: string) => Promise<boolean>;
      
      // Restaurar arquivo
      restoreDefaultFile: (serverPath: string, fileName: string) => Promise<any>;
      
      // File operations (legacy)
      readConfigFile: (filePath: string) => Promise<any>;
      writeConfigFile: (filePath: string, data: any) => Promise<void>;
      
      // Backup operations (legacy)
      getBackups: () => Promise<any[]>;
      createBackup: (options: { name: string; description?: string; serverPath: string }) => Promise<any>;
      deleteBackup: (backupId: string) => Promise<boolean>;
      downloadBackup: (backupId: string) => Promise<void>;
      
      // Server operations (legacy)
      getServerStatus: (serverPath: string) => Promise<any>;
      getServerLogs: (serverPath: string, options: { level: string; filter: string; limit: number }) => Promise<any[]>;
      startServer: (serverPath: string) => Promise<boolean>;
      stopServer: (serverPath: string) => Promise<boolean>;
      restartServer: (serverPath: string) => Promise<boolean>;
      downloadLogs: (serverPath: string) => Promise<void>;
      clearLogs: (serverPath: string) => Promise<void>;
      
      // New config operations
      saveAppConfig: (
        serverPath: string,
        steamcmdPath?: string,
        installPath?: string,
        serverPort?: number,
        maxPlayers?: number,
        enableBattleye?: boolean,
        iniConfigPath?: string,
        logsPath?: string
      ) => Promise<any>;
      loadAppConfig: () => Promise<{
        lastServerPath: string;
        steamcmdPath?: string;
        serverPath?: string;
        installPath?: string;
        iniConfigPath?: string;
        logsPath?: string;
        serverPort?: number;
        maxPlayers?: number;
        enableBattleye?: boolean;
      } | null>;
      clearAppConfig: () => Promise<any>;
      
      // New API operations
      updateServerWithSteamcmd: (steamcmdPath: string, installPath: string) => Promise<any>;
      sendUpdateServerWithSteamcmdStream: (steamcmdPath: string, installPath: string) => void;
      onUpdateServerLog: (callback: (event: any, data: string) => void) => void;
      onUpdateServerLogEnd: (callback: (event: any, code: number) => void) => void;
      removeUpdateServerLog: (callback: (event: any, data: string) => void) => void;
      removeUpdateServerLogEnd: (callback: (event: any, code: number) => void) => void;
      startServerWithConfig: (serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean) => Promise<any>;
      getRealServerStatus: (serverPath: string) => Promise<{ running: boolean; uptime: string; cpu: number; memory: number; players: number; maxPlayers: number }>;
      loadRestartSchedule: () => Promise<number[]>;
      saveRestartSchedule: (hours: number[]) => Promise<boolean>;
    };
  }
}

export {}; 