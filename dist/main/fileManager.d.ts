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
export declare class FileManager {
    private configPath;
    private cacheDir;
    private cacheFile;
    private appConfigFile;
    private lastNotifiedSteamId;
    private discordRateLimit;
    constructor();
    saveServerCache(serverPath: string, config: ServerConfig, configDir: string): Promise<void>;
    loadServerCache(): Promise<ServerCache | null>;
    clearServerCache(): Promise<void>;
    getServerInfo(serverPath: string): Promise<{
        name: string;
        maxPlayers: number;
        playstyle: string;
    } | null>;
    private findConfigDir;
    readServerConfig(serverPath: string): Promise<ServerConfig>;
    saveServerConfig(serverPath: string, config: ServerConfig): Promise<void>;
    private removeScumPrefix;
    private addScumPrefix;
    readIniFile(filePath: string): Promise<any>;
    saveIniFile(filePath: string, content: any): Promise<void>;
    readJsonFile(filePath: string): Promise<any>;
    saveJsonFile(filePath: string, content: any): Promise<void>;
    readUserFile(filePath: string): Promise<string[]>;
    saveUserFile(filePath: string, users: string[]): Promise<void>;
    validateConfig(config: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    listConfigFiles(serverPath: string): Promise<string[]>;
    restoreDefaultFile(serverPath: string, fileName: string): Promise<void>;
    saveAppConfig(config: AppConfig): Promise<void>;
    loadAppConfig(): Promise<AppConfig | null>;
    clearAppConfig(): Promise<void>;
    listDir(dirPath: string): Promise<string[]>;
    getServerStatus(_serverPath: string): Promise<any>;
    getServerLogs(serverPath: string, options: {
        level: string;
        filter: string;
        limit: number;
    }): Promise<any[]>;
    startServer(serverPath: string): Promise<boolean>;
    stopServer(serverPath: string): Promise<boolean>;
    restartServer(serverPath: string): Promise<boolean>;
    downloadLogs(serverPath: string): Promise<void>;
    clearLogs(serverPath: string): Promise<void>;
    readConfigFile(filePath: string): Promise<string>;
    writeConfigFile(filePath: string, data: any): Promise<void>;
    updateServerWithSteamcmd(steamcmdPath: string, installPath: string): Promise<{
        success: boolean;
        output: string;
    }>;
    startServerWithConfig(serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean): Promise<void>;
    getRealServerStatus(serverPath: string): Promise<any>;
    startUpdateServerWithSteamcmdStream(steamcmdPath: string, installPath: string, event: any): void;
    saveDiscordWebhooks(webhooks: any): Promise<void>;
    loadDiscordWebhooks(): Promise<any>;
    sendDiscordWebhookMessage(webhookUrl: string, message: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    clearNotifiedPlayers(): Promise<void>;
    getNotifiedPlayers(): Promise<string[]>;
    validateDiscordWebhook(webhookUrl: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    sendDiscordMessageWithFallback(primaryWebhook: string, message: string, fallbackWebhooks?: string[]): Promise<{
        success: boolean;
        error?: string;
        usedFallback?: boolean;
    }>;
    getDiscordSendStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        lastError?: string;
    }>;
}
//# sourceMappingURL=fileManager.d.ts.map