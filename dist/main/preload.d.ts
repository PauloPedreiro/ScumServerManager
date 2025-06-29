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
            saveAppConfig: (serverPath: string) => Promise<any>;
            loadAppConfig: () => Promise<any>;
            clearAppConfig: () => Promise<any>;
        };
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map