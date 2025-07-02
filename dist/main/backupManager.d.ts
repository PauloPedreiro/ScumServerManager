export declare class BackupManager {
    private backupDir;
    private configPath;
    private findConfigDir;
    createBackup(serverPath: string): Promise<string>;
    listBackups(serverPath: string): Promise<string[]>;
    restoreBackup(serverPath: string, backupName: string): Promise<void>;
    deleteBackup(serverPath: string, backupName: string): Promise<void>;
    getBackupInfo(serverPath: string, backupName: string): Promise<any>;
    cleanupOldBackups(serverPath: string, maxBackups?: number): Promise<void>;
    getBackups(): Promise<any[]>;
    createBackupWithOptions(options: {
        name: string;
        description?: string;
        serverPath: string;
    }): Promise<any>;
    downloadBackup(backupId: string): Promise<void>;
}
//# sourceMappingURL=backupManager.d.ts.map