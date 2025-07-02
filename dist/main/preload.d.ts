declare global {
    interface Window {
        electronAPI: {
            selectServerFolder: () => Promise<string | null>;
            readServerConfig: (serverPath: string) => Promise<any>;
            saveServerConfig: (serverPath: string, config: any) => Promise<any>;
            readIniFile: (filePath: string) => Promise<any>;
            saveIniFile: (filePath: string, content: any) => Promise<any>;
            readJsonFile: (filePath: string) => Promise<any>;
            saveJsonFile: (filePath: string, content: any) => Promise<any>;
            listBackups: (serverPath: string) => Promise<string[]>;
            restoreBackup: (serverPath: string, backupName: string) => Promise<any>;
            validateConfig: (config: any) => Promise<any>;
            restoreDefaultFile: (serverPath: string, fileName: string) => Promise<any>;
            listConfigFiles: (serverPath: string) => Promise<string[]>;
            saveAppConfig: (serverPath: string, steamcmdPath?: string, installPath?: string, serverPort?: number, maxPlayers?: number, enableBattleye?: boolean) => Promise<any>;
            loadAppConfig: () => Promise<any>;
            clearAppConfig: () => Promise<any>;
            listDir: (dirPath: string) => Promise<any>;
            checkPathExists: (path: string) => Promise<boolean>;
            readConfigFile: (filePath: string) => Promise<any>;
            writeConfigFile: (filePath: string, data: any) => Promise<any>;
            getBackups: () => Promise<any>;
            createBackup: (options: any) => Promise<any>;
            deleteBackup: (backupId: string) => Promise<any>;
            downloadBackup: (backupId: string) => Promise<any>;
            getServerStatus: (serverPath: string) => Promise<any>;
            getServerLogs: (serverPath: string, options: any) => Promise<any>;
            startServer: (serverPath: string) => Promise<any>;
            stopServer: (serverPath: string) => Promise<any>;
            restartServer: (serverPath: string) => Promise<any>;
            downloadLogs: (serverPath: string) => Promise<any>;
            clearLogs: (serverPath: string) => Promise<any>;
            updateServerWithSteamcmd: (steamcmdPath: string, installPath: string) => Promise<any>;
            startServerWithConfig: (serverPath: string, serverPort: number, maxPlayers: number, enableBattleye: boolean) => Promise<any>;
            getRealServerStatus: (serverPath: string) => Promise<any>;
            sendUpdateServerWithSteamcmdStream: (steamcmdPath: string, installPath: string) => Promise<void>;
            onUpdateServerLog: (callback: (event: any, data: string) => void) => void;
            onUpdateServerLogEnd: (callback: (event: any, code: number) => void) => void;
            removeUpdateServerLog: (callback: (event: any, data: string) => void) => void;
            removeUpdateServerLogEnd: (callback: (event: any, code: number) => void) => void;
            loadRestartSchedule: () => Promise<any>;
            saveRestartSchedule: (hours: number[]) => Promise<any>;
        };
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map