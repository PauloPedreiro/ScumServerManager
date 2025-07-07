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
exports.startAdminLogWatcher = startAdminLogWatcher;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const OFFSETS_FILE = path.join(process.cwd(), 'admin_log_offsets.json');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function readOffsets() {
    try {
        if (await fs.pathExists(OFFSETS_FILE)) {
            return JSON.parse(await fs.readFile(OFFSETS_FILE, 'utf8'));
        }
    }
    catch (error) {
        console.error('[AdminLogWatcher] ❌ Erro ao ler offsets:', error);
    }
    return {};
}
async function writeOffsets(offsets) {
    await fs.writeFile(OFFSETS_FILE, JSON.stringify(offsets, null, 2), 'utf8');
}
// Função para salvar eventos processados
async function saveProcessedEvents(events) {
    try {
        const eventsPath = path.join(process.cwd(), 'admin_processed_events.json');
        await fs.writeFile(eventsPath, JSON.stringify(Array.from(events), null, 2), 'utf8');
    }
    catch (error) {
        console.error('[AdminLogWatcher] ❌ Erro ao salvar eventos processados:', error);
    }
}
// Função para carregar eventos processados
async function loadProcessedEvents() {
    try {
        const eventsPath = path.join(process.cwd(), 'admin_processed_events.json');
        if (await fs.pathExists(eventsPath)) {
            const eventsArray = JSON.parse(await fs.readFile(eventsPath, 'utf8'));
            return new Set(eventsArray);
        }
    }
    catch (error) {
        console.error('[AdminLogWatcher] ❌ Erro ao carregar eventos processados:', error);
    }
    return new Set();
}
// Função para limpar eventos antigos (mais de 24 horas)
function cleanOldEvents(events) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    for (const eventKey of events) {
        try {
            const [timestamp] = eventKey.split('|');
            const eventDate = new Date(timestamp.replace(/(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/, '$1-$2-$3T$4:$5:$6'));
            if (eventDate < oneDayAgo) {
                events.delete(eventKey);
            }
        }
        catch (error) {
            // Se não conseguir parsear a data, remover o evento
            events.delete(eventKey);
        }
    }
}
async function startAdminLogWatcher(fileManager) {
    console.log('[AdminLogWatcher] 🚀 Iniciando AdminLogWatcher...');
    // Ler config.json para pegar logsPath
    const configPath = path.join(process.cwd(), 'config.json');
    if (!await fs.pathExists(configPath)) {
        console.log('[AdminLogWatcher] ❌ config.json não encontrado');
        return;
    }
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const logsPath = config.logsPath;
    if (!logsPath) {
        console.log('[AdminLogWatcher] ❌ logsPath não configurado');
        return;
    }
    // Função para carregar webhook dinamicamente
    async function loadWebhook() {
        const webhookPath = path.join(process.cwd(), 'discordWebhooks.json');
        if (!await fs.pathExists(webhookPath)) {
            console.log('[AdminLogWatcher] ❌ discordWebhooks.json não encontrado');
            return null;
        }
        try {
            const webhooks = JSON.parse(await fs.readFile(webhookPath, 'utf8'));
            const webhookUrl = webhooks.logsAdm;
            if (!webhookUrl) {
                console.log('[AdminLogWatcher] ❌ webhook de logs adm não configurado');
                return null;
            }
            return webhookUrl;
        }
        catch (error) {
            console.error('[AdminLogWatcher] ❌ Erro ao carregar webhook:', error);
            return null;
        }
    }
    // Variáveis globais
    let processedEvents = new Set();
    let processingFiles = new Set();
    let debounceTimer = null;
    // Carregar estado salvo
    processedEvents = await loadProcessedEvents();
    // Limpar eventos antigos
    cleanOldEvents(processedEvents);
    await saveProcessedEvents(processedEvents);
    // Função para processar um arquivo específico
    async function processFile(logFileName) {
        // Evitar processamento duplicado
        if (processingFiles.has(logFileName)) {
            console.log(`[AdminLogWatcher] ⏳ Arquivo ${logFileName} já está sendo processado`);
            return;
        }
        processingFiles.add(logFileName);
        const currentWebhook = await loadWebhook();
        if (!currentWebhook) {
            console.log('[AdminLogWatcher] ⚠️ Webhook não disponível, pulando processamento');
            processingFiles.delete(logFileName);
            return;
        }
        const logFile = path.join(logsPath, logFileName);
        let offsets = await readOffsets();
        let lastOffset = offsets[logFileName] || 0;
        try {
            const stat = await fs.stat(logFile);
            if (stat.size <= lastOffset) {
                console.log(`[AdminLogWatcher] 📄 Arquivo ${logFileName} sem mudanças (size: ${stat.size}, offset: ${lastOffset})`);
                processingFiles.delete(logFileName);
                return;
            }
            console.log(`[AdminLogWatcher] 🚀 Processando arquivo: ${logFileName} (size: ${stat.size}, offset: ${lastOffset})`);
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.split(/\r?\n/);
            let processedCount = 0;
            let newOffset = lastOffset;
            for (const line of lines) {
                if (line.trim().length > 0) {
                    // Criar chave única para o evento
                    const eventKey = `${logFileName}|${line}`;
                    // Verificar se já foi processado
                    if (processedEvents.has(eventKey)) {
                        continue;
                    }
                    try {
                        await fileManager.sendDiscordWebhookMessage(currentWebhook, line);
                        console.log('[AdminLogWatcher] ✅ Linha enviada:', line);
                        // Marcar como processado
                        processedEvents.add(eventKey);
                        processedCount++;
                        // Delay de 2 segundos entre envios para evitar rate limit
                        await sleep(2000);
                    }
                    catch (err) {
                        console.error('[AdminLogWatcher] ❌ Erro ao enviar linha:', err);
                    }
                }
                newOffset += Buffer.byteLength(line + '\n', 'utf8');
            }
            offsets[logFileName] = newOffset;
            await writeOffsets(offsets);
            await saveProcessedEvents(processedEvents);
            if (processedCount > 0) {
                console.log(`[AdminLogWatcher] 📊 Processadas ${processedCount} linha(s) em ${logFileName}`);
            }
        }
        catch (err) {
            console.error('[AdminLogWatcher] ❌ Erro ao ler arquivo de log:', err);
        }
        finally {
            processingFiles.delete(logFileName);
        }
    }
    // Função para processar mudanças de arquivo com debounce
    async function handleFileChange(filePath) {
        const filename = path.basename(filePath);
        if (filename.startsWith('admin_') && filename.endsWith('.log')) {
            console.log(`[AdminLogWatcher] 🚀 Push notification: ${filename}`);
            // Debounce para evitar processamento excessivo
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(async () => {
                await processFile(filename);
            }, 100);
        }
    }
    // Configurar watcher usando fs.watch
    try {
        const watcher = fs.watch(logsPath, { recursive: false }, async (eventType, filename) => {
            if (filename && filename.startsWith('admin_') && filename.endsWith('.log')) {
                console.log(`[AdminLogWatcher] 🔄 File change detected: ${filename}`);
                await handleFileChange(path.join(logsPath, filename));
            }
        });
        console.log('[AdminLogWatcher] ✅ File watcher configurado');
    }
    catch (err) {
        console.error('[AdminLogWatcher] ❌ Erro ao configurar file watcher:', err);
    }
    // Processamento inicial - apenas marcar offsets como processados, sem enviar mensagens
    try {
        console.log('[AdminLogWatcher] 🔍 Iniciando processamento inicial...');
        const files = await fs.readdir(logsPath);
        const adminLogs = files.filter(f => f.startsWith('admin_') && f.endsWith('.log'));
        console.log(`[AdminLogWatcher] 📁 Arquivos admin encontrados: ${adminLogs.length}`);
        if (adminLogs.length > 0) {
            // Ordenar arquivos por data (mais recente primeiro)
            adminLogs.sort((a, b) => {
                const dateA = a.replace('admin_', '').replace('.log', '');
                const dateB = b.replace('admin_', '').replace('.log', '');
                return dateB.localeCompare(dateA);
            });
            // Processar apenas o arquivo mais recente para determinar estado atual
            const mostRecentFile = adminLogs[0];
            const logFile = path.join(logsPath, mostRecentFile);
            const stats = await fs.stat(logFile);
            console.log(`[AdminLogWatcher] 🚀 Processando arquivo mais recente: ${mostRecentFile} (size: ${stats.size})`);
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                if (line.trim().length > 0) {
                    // Criar chave única para o evento
                    const eventKey = `${mostRecentFile}|${line}`;
                    // Marcar como processado sem enviar mensagens
                    processedEvents.add(eventKey);
                }
            }
            // Salvar estado atual
            await saveProcessedEvents(processedEvents);
            console.log(`[AdminLogWatcher] 📊 Estado inicial processado: ${processedEvents.size} eventos marcados como processados`);
        }
        else {
            console.log('[AdminLogWatcher] ⚠️ Nenhum arquivo admin encontrado');
        }
    }
    catch (err) {
        console.error('[AdminLogWatcher] ❌ Erro ao processar arquivo inicial:', err);
    }
    // Limpeza automática de eventos antigos a cada hora
    setInterval(async () => {
        const oldSize = processedEvents.size;
        cleanOldEvents(processedEvents);
        if (processedEvents.size < oldSize) {
            await saveProcessedEvents(processedEvents);
            console.log(`[AdminLogWatcher] 🧹 Limpeza automática: removidos ${oldSize - processedEvents.size} eventos antigos`);
        }
    }, 60 * 60 * 1000); // A cada hora
}
//# sourceMappingURL=adminLogWatcher.js.map