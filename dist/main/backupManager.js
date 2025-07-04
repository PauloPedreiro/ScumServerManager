"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class BackupManager {
    constructor() {
        this.backupDir = 'backups';
        this.configPath = 'Saved/Config/WindowsServer';
    }
    async findConfigDir(serverPath) {
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
    async createBackup(serverPath) {
        const configDir = await this.findConfigDir(serverPath);
        const backupDir = path.join(serverPath, this.backupDir);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}`;
        const backupPath = path.join(backupDir, backupName);
        try {
            // Criar diretório de backup se não existir
            await fs.ensureDir(backupPath);
            // Copiar todos os arquivos de configuração
            const files = await fs.readdir(configDir);
            const configFiles = files.filter(file => file.endsWith('.ini') ||
                file.endsWith('.json') ||
                file.endsWith('.bak'));
            for (const file of configFiles) {
                const sourcePath = path.join(configDir, file);
                const destPath = path.join(backupPath, file);
                await fs.copy(sourcePath, destPath);
            }
            // Criar arquivo de metadados do backup
            const metadata = {
                timestamp: new Date().toISOString(),
                files: configFiles,
                serverPath: serverPath,
                configDir: configDir,
                version: '1.0.0'
            };
            await fs.writeJson(path.join(backupPath, 'backup-metadata.json'), metadata, { spaces: 2 });
            return backupName;
        }
        catch (error) {
            console.error('Erro ao criar backup:', error);
            throw error;
        }
    }
    async listBackups(serverPath) {
        const backupDir = path.join(serverPath, this.backupDir);
        try {
            if (!await fs.pathExists(backupDir)) {
                return [];
            }
            const backups = await fs.readdir(backupDir);
            return backups.filter(backup => {
                const backupPath = path.join(backupDir, backup);
                return fs.statSync(backupPath).isDirectory();
            }).sort((a, b) => {
                // Ordenar por data (mais recente primeiro)
                const aPath = path.join(backupDir, a);
                const bPath = path.join(backupDir, b);
                return fs.statSync(bPath).mtime.getTime() - fs.statSync(aPath).mtime.getTime();
            });
        }
        catch (error) {
            console.error('Erro ao listar backups:', error);
            return [];
        }
    }
    async restoreBackup(serverPath, backupName) {
        const configDir = await this.findConfigDir(serverPath);
        const backupDir = path.join(serverPath, this.backupDir);
        const backupPath = path.join(backupDir, backupName);
        try {
            // Verificar se o backup existe
            if (!await fs.pathExists(backupPath)) {
                throw new Error(`Backup não encontrado: ${backupName}`);
            }
            // Verificar se é um diretório
            const stats = await fs.stat(backupPath);
            if (!stats.isDirectory()) {
                throw new Error(`Backup inválido: ${backupName}`);
            }
            // Criar backup do estado atual antes de restaurar
            await this.createBackup(serverPath);
            // Verificar se o diretório de configuração existe
            if (!await fs.pathExists(configDir)) {
                await fs.ensureDir(configDir);
            }
            // Listar arquivos do backup
            const backupFiles = await fs.readdir(backupPath);
            const configFiles = backupFiles.filter(file => file.endsWith('.ini') ||
                file.endsWith('.json') ||
                file.endsWith('.bak'));
            // Restaurar arquivos
            for (const file of configFiles) {
                const sourcePath = path.join(backupPath, file);
                const destPath = path.join(configDir, file);
                await fs.copy(sourcePath, destPath);
            }
            console.log(`Backup ${backupName} restaurado com sucesso`);
        }
        catch (error) {
            console.error('Erro ao restaurar backup:', error);
            throw error;
        }
    }
    async deleteBackup(serverPath, backupName) {
        const backupDir = path.join(serverPath, this.backupDir);
        const backupPath = path.join(backupDir, backupName);
        try {
            if (!await fs.pathExists(backupPath)) {
                throw new Error(`Backup não encontrado: ${backupName}`);
            }
            await fs.remove(backupPath);
            console.log(`Backup ${backupName} removido com sucesso`);
        }
        catch (error) {
            console.error('Erro ao remover backup:', error);
            throw error;
        }
    }
    async getBackupInfo(serverPath, backupName) {
        const backupDir = path.join(serverPath, this.backupDir);
        const backupPath = path.join(backupDir, backupName);
        const metadataPath = path.join(backupPath, 'backup-metadata.json');
        try {
            if (!await fs.pathExists(metadataPath)) {
                return null;
            }
            const metadata = await fs.readJson(metadataPath);
            const stats = await fs.stat(backupPath);
            return {
                ...metadata,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        }
        catch (error) {
            console.error('Erro ao obter informações do backup:', error);
            return null;
        }
    }
    async cleanupOldBackups(serverPath, maxBackups = 10) {
        try {
            const backups = await this.listBackups(serverPath);
            if (backups.length > maxBackups) {
                const backupsToDelete = backups.slice(maxBackups);
                for (const backup of backupsToDelete) {
                    await this.deleteBackup(serverPath, backup);
                }
                console.log(`${backupsToDelete.length} backups antigos removidos`);
            }
        }
        catch (error) {
            console.error('Erro ao limpar backups antigos:', error);
            throw error;
        }
    }
    async getBackups() {
        try {
            // Retornar lista vazia por padrão (implementação básica)
            return [];
        }
        catch (error) {
            console.error('Erro ao obter backups:', error);
            return [];
        }
    }
    async createBackupWithOptions(options) {
        try {
            const backupName = await this.createBackup(options.serverPath);
            return {
                id: backupName,
                name: options.name,
                description: options.description,
                serverPath: options.serverPath,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Erro ao criar backup:', error);
            throw error;
        }
    }
    async downloadBackup(backupId) {
        try {
            console.log('Baixando backup:', backupId);
            // Aqui você implementaria a lógica real para baixar o backup
            // Implementação temporária - apenas log
        }
        catch (error) {
            console.error('Erro ao baixar backup:', error);
            throw error;
        }
    }
}
exports.BackupManager = BackupManager;
//# sourceMappingURL=backupManager.js.map