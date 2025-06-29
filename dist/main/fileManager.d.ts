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
export declare class FileManager {
    private configPath;
    private cacheDir;
    private cacheFile;
    private appConfigFile;
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
    saveAppConfig(serverPath: string): Promise<void>;
    loadAppConfig(): Promise<AppConfig | null>;
    clearAppConfig(): Promise<void>;
}
//# sourceMappingURL=fileManager.d.ts.map