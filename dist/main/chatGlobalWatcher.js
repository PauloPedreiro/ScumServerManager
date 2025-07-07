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
exports.startChatGlobalWatcher = startChatGlobalWatcher;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// Importar bibliotecas para notificações push
const chokidar = require('chokidar');
const nodeWatch = require('node-watch');
// Função para converter UTF-16 para UTF-8 se necessário
function convertUtf16ToUtf8(text) {
    try {
        // Se o texto contém caracteres UTF-16, converter
        if (text.includes('\u0000')) {
            // Remover caracteres nulos UTF-16
            const cleaned = text.replace(/\u0000/g, '');
            return cleaned;
        }
        return text;
    }
    catch (error) {
        return text;
    }
}
// Função para fazer sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Função para copiar arquivo e forçar detecção de mudanças
async function copyLatestChatFile(logsPath) {
    try {
        const files = await fs.readdir(logsPath);
        const chatFiles = files
            .filter(f => f.startsWith('chat_') && f.endsWith('.log'))
            .sort((a, b) => {
            const dateA = a.replace('chat_', '').replace('.log', '');
            const dateB = b.replace('chat_', '').replace('.log', '');
            return dateB.localeCompare(dateA);
        });
        if (chatFiles.length === 0)
            return;
        const latestFile = chatFiles[0];
        const sourcePath = path.join(logsPath, latestFile);
        // Nome temporário único
        const tempPath = path.join(logsPath, `${latestFile}.${Date.now()}.temp`);
        // Verificar se o arquivo existe e tem conteúdo
        if (!await fs.pathExists(sourcePath))
            return;
        const stats = await fs.stat(sourcePath);
        if (stats.size === 0)
            return;
        // Copiar o arquivo para um arquivo temporário
        try {
            await fs.copy(sourcePath, tempPath);
            await sleep(50);
        }
        catch (copyErr) {
            // Apenas logar, não interromper
        }
        // Deletar o arquivo temporário
        try {
            if (await fs.pathExists(tempPath)) {
                await fs.remove(tempPath);
            }
        }
        catch (delErr) {
            // Apenas logar, não interromper
        }
        // Log apenas a cada 10 cópias
    }
    catch (error) {
        // Nunca interromper o watcher
    }
}
// Função para ler offsets salvos
async function readOffsets() {
    try {
        const offsetPath = path.join(process.cwd(), '.chat_global_offsets.json');
        if (await fs.pathExists(offsetPath)) {
            const offsets = JSON.parse(await fs.readFile(offsetPath, 'utf8'));
            // Log apenas na primeira vez ou quando mudar
            const lastOffsetsKey = 'lastOffsetsLog';
            const lastOffsets = global[lastOffsetsKey];
            if (!lastOffsets || JSON.stringify(lastOffsets) !== JSON.stringify(offsets)) {
                global[lastOffsetsKey] = offsets;
            }
            return offsets;
        }
    }
    catch (error) {
    }
    return {};
}
// Função para salvar offsets
async function writeOffsets(offsets) {
    try {
        const offsetPath = path.join(process.cwd(), '.chat_global_offsets.json');
        await fs.writeFile(offsetPath, JSON.stringify(offsets, null, 2), 'utf8');
    }
    catch (error) {
    }
}
// Função para parsear linha de chat
function parseChatLine(line) {
    try {
        // Padrão principal: 2025.07.05-03.23.13: '76561198140545020:mariocs10(12)' 'Global: oi'
        // Suporta tanto aspas simples quanto duplas
        const patterns = [
            // Padrão com aspas simples
            /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '(\d+):([^(]+)\(\d+\)' '(Global|Local|Squad): (.+)'$/,
            // Padrão com aspas duplas
            /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): "(\d+):([^(]+)\(\d+\)" "(Global|Local|Squad): (.+)"$/,
            // Padrão alternativo com aspas simples (sem parênteses)
            /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '(\d+):([^']+)' '(Global|Local|Squad): (.+)'$/,
            // Padrão alternativo com aspas duplas (sem parênteses)
            /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): "(\d+):([^"]+)" "(Global|Local|Squad): (.+)"$/
        ];
        for (let i = 0; i < patterns.length; i++) {
            const match = line.match(patterns[i]);
            if (match) {
                const result = {
                    timestamp: match[1],
                    steamId: match[2],
                    playerName: match[3].trim(),
                    type: match[4], // 'Global', 'Local' ou 'Squad'
                    message: match[5].trim()
                };
                return result;
            }
        }
        return null;
    }
    catch (error) {
        return null;
    }
}
async function startChatGlobalWatcher(fileManager) {
    // Ler config.json para pegar logsPath
    const configPath = path.join(process.cwd(), 'config.json');
    if (!await fs.pathExists(configPath)) {
        return;
    }
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const logsPath = config.logsPath;
    if (!logsPath) {
        return;
    }
    // Função para carregar webhook dinamicamente
    async function loadWebhook() {
        const webhookPath = path.join(process.cwd(), 'discordWebhooks.json');
        if (!await fs.pathExists(webhookPath)) {
            return null;
        }
        try {
            const webhooks = JSON.parse(await fs.readFile(webhookPath, 'utf8'));
            const webhookUrl = webhooks.chatGlobal;
            if (!webhookUrl) {
                return null;
            }
            return webhookUrl;
        }
        catch (error) {
            return null;
        }
    }
    // Carregar webhook inicial
    let webhookUrl = await loadWebhook();
    if (!webhookUrl) {
        return;
    }
    // Set para controlar mensagens já processadas (evitar duplicatas)
    const processedMessages = new Set();
    // Set para controlar arquivos sendo processados (evitar processamento simultâneo)
    const processingFiles = new Set();
    // Sistema de debounce para evitar processamento excessivo
    const debounceTimers = new Map();
    // Carregar mensagens já processadas do arquivo
    const processedMessagesFile = path.join(process.cwd(), 'processed_chat_messages.json');
    try {
        if (await fs.pathExists(processedMessagesFile)) {
            const savedMessages = JSON.parse(await fs.readFile(processedMessagesFile, 'utf8'));
            savedMessages.forEach((messageId) => processedMessages.add(messageId));
            console.log(`[ChatGlobalWatcher] 📋 Carregadas ${processedMessages.size} mensagens já processadas`);
        }
    }
    catch (error) {
        console.error('[ChatGlobalWatcher] ❌ Erro ao carregar mensagens processadas:', error);
    }
    // Função para salvar mensagens processadas
    async function saveProcessedMessages() {
        try {
            const messagesArray = Array.from(processedMessages);
            await fs.writeFile(processedMessagesFile, JSON.stringify(messagesArray, null, 2), 'utf8');
        }
        catch (error) {
            console.error('[ChatGlobalWatcher] ❌ Erro ao salvar mensagens processadas:', error);
        }
    }
    // Função para limpar mensagens antigas (mais de 7 dias)
    async function cleanupOldMessages() {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const cutoffDate = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '.');
            const messagesToKeep = Array.from(processedMessages).filter(messageId => {
                // Extrair data do messageId (formato: steamId-timestamp-message)
                const parts = messageId.split('-');
                if (parts.length >= 3) {
                    const datePart = parts[1]; // timestamp
                    return datePart >= cutoffDate;
                }
                return true; // Manter se não conseguir extrair data
            });
            if (messagesToKeep.length < processedMessages.size) {
                processedMessages.clear();
                messagesToKeep.forEach(messageId => processedMessages.add(messageId));
                await saveProcessedMessages();
                console.log(`[ChatGlobalWatcher] 🧹 Limpeza: ${processedMessages.size - messagesToKeep.length} mensagens antigas removidas`);
            }
        }
        catch (error) {
            console.error('[ChatGlobalWatcher] ❌ Erro ao limpar mensagens antigas:', error);
        }
    }
    // Função para gerar ID único da mensagem
    function generateMessageId(data) {
        return `${data.steamId}-${data.timestamp}-${data.message.substring(0, 50)}`;
    }
    // Função para ordenar arquivos de log por data/hora (mais novo primeiro)
    function sortChatLogsByDate(files) {
        return files
            .filter(f => f.startsWith('chat_') && f.endsWith('.log'))
            .sort((a, b) => {
            // Extrair data/hora do nome do arquivo: chat_YYYYMMDDHHMMSS.log
            const dateA = a.replace('chat_', '').replace('.log', '');
            const dateB = b.replace('chat_', '').replace('.log', '');
            return dateB.localeCompare(dateA); // Ordem decrescente (mais novo primeiro)
        });
    }
    // Função para processar um arquivo específico
    async function processFile(logFileName) {
        // Recarregar webhook antes de processar (para pegar mudanças)
        const currentWebhook = await loadWebhook();
        if (!currentWebhook) {
            return;
        }
        // Se o webhook mudou, atualizar e logar
        if (currentWebhook !== webhookUrl) {
            webhookUrl = currentWebhook;
        }
        // Verificar se o arquivo já está sendo processado
        if (processingFiles.has(logFileName)) {
            return;
        }
        // Marcar arquivo como sendo processado
        processingFiles.add(logFileName);
        const logFile = path.join(logsPath, logFileName);
        let lastOffset = (await readOffsets())[logFileName] || 0;
        let fd = null;
        try {
            const stat = await fs.stat(logFile);
            // Se o arquivo foi sobrescrito (size < offset), resetar offset
            if (stat.size < lastOffset) {
                lastOffset = 0;
            }
            if (stat.size <= lastOffset) {
                processingFiles.delete(logFileName);
                return;
            }
            console.log(`[ChatGlobalWatcher] 📊 Arquivo ${logFileName}: size=${stat.size}, offset=${lastOffset}, diferença=${stat.size - lastOffset}`);
            fd = fs.createReadStream(logFile, { start: lastOffset, encoding: 'utf16le' });
            let buffer = '';
            let newOffset = lastOffset;
            let totalLines = 0;
            let globalMessages = 0;
            for await (const chunk of fd) {
                buffer += chunk;
                let lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';
                for (const line of lines) {
                    totalLines++;
                    newOffset += Buffer.byteLength(line + '\n', 'utf16le');
                    // Converter encoding se necessário
                    const cleanLine = convertUtf16ToUtf8(line);
                    // Verificar se a linha contém mensagens globais, locais ou squad
                    if (cleanLine.includes("'Global: ") || cleanLine.includes('"Global: ') ||
                        cleanLine.includes("'Local: ") || cleanLine.includes('"Local: ') ||
                        cleanLine.includes("'Squad: ") || cleanLine.includes('"Squad: ')) {
                        const data = parseChatLine(line);
                        if (data) {
                            globalMessages++;
                            // Gerar ID único da mensagem
                            const messageId = generateMessageId(data);
                            // Verificar se a mensagem já foi processada
                            if (processedMessages.has(messageId)) {
                                continue;
                            }
                            // Marcar como processada ANTES de enviar
                            processedMessages.add(messageId);
                            console.log(`[ChatGlobalWatcher] 💬 Processando mensagem: ${data.playerName}: ${data.message}`);
                            // Formatar mensagem para Discord: "nome: mensagem"
                            const discordMessage = `${data.playerName}: ${data.message}`;
                            try {
                                const result = await fileManager.sendDiscordWebhookMessage(webhookUrl, discordMessage);
                                // Delay de 2 segundos entre mensagens para evitar rate limit
                                await sleep(2000);
                            }
                            catch (err) {
                                console.error('[ChatGlobalWatcher] ❌ Erro ao enviar mensagem:', err);
                            }
                        }
                    }
                }
            }
            // Processar a última linha pendente (caso não termine com \n)
            if (buffer.trim().length > 0) {
                totalLines++;
                newOffset += Buffer.byteLength(buffer, 'utf16le');
                const cleanLine = convertUtf16ToUtf8(buffer);
                if (cleanLine.includes("'Global: ") || cleanLine.includes('"Global: ') ||
                    cleanLine.includes("'Local: ") || cleanLine.includes('"Local: ') ||
                    cleanLine.includes("'Squad: ") || cleanLine.includes('"Squad: ')) {
                    const data = parseChatLine(buffer);
                    if (data) {
                        globalMessages++;
                        const messageId = generateMessageId(data);
                        if (!processedMessages.has(messageId)) {
                            processedMessages.add(messageId);
                            console.log(`[ChatGlobalWatcher] 💬 Processando mensagem (final): ${data.playerName}: ${data.message}`);
                            const discordMessage = `${data.playerName}: ${data.message}`;
                            try {
                                const result = await fileManager.sendDiscordWebhookMessage(webhookUrl, discordMessage);
                                // Delay de 2 segundos entre mensagens para evitar rate limit
                                await sleep(2000);
                            }
                            catch (err) {
                                console.error('[ChatGlobalWatcher] ❌ Erro ao enviar mensagem:', err);
                            }
                        }
                    }
                }
            }
            // Atualizar offset
            const offsets = await readOffsets();
            offsets[logFileName] = newOffset;
            await writeOffsets(offsets);
            if (globalMessages > 0) {
                // Salvar mensagens processadas
                await saveProcessedMessages();
            }
        }
        catch (err) {
            console.error('[ChatGlobalWatcher] ❌ Erro ao processar arquivo:', err);
        }
        finally {
            if (fd)
                fd.close();
            // Remover arquivo da lista de processamento
            processingFiles.delete(logFileName);
        }
    }
    // Função para processar mudanças de arquivo com debounce
    async function handleFileChange(filePath) {
        const filename = path.basename(filePath);
        if (filename.startsWith('chat_') && filename.endsWith('.log')) {
            // Sistema de debounce: cancelar timer anterior se existir
            if (debounceTimers.has(filename)) {
                clearTimeout(debounceTimers.get(filename));
            }
            // Agendar processamento com debounce de 100ms
            const timer = setTimeout(async () => {
                debounceTimers.delete(filename);
                await processFile(filename);
            }, 100);
            debounceTimers.set(filename, timer);
        }
    }
    // Configurar watcher Chokidar (mais robusto)
    try {
        const chokidarWatcher = chokidar.watch(logsPath, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 50,
                pollInterval: 50
            },
            usePolling: false,
            interval: 100,
            binaryInterval: 100
        });
        chokidarWatcher.on('change', handleFileChange);
        chokidarWatcher.on('add', handleFileChange);
        console.log('[ChatGlobalWatcher] ✅ Chokidar watcher configurado');
    }
    catch (err) {
        console.error('[ChatGlobalWatcher] ❌ Erro ao configurar Chokidar:', err);
    }
    // Processamento inicial apenas do arquivo mais recente
    try {
        const files = await fs.readdir(logsPath);
        const chatLogs = sortChatLogsByDate(files);
        if (chatLogs.length > 0) {
            // Processar apenas o arquivo mais recente para evitar rate limit
            const latestFile = chatLogs[0];
            console.log(`[ChatGlobalWatcher] 📁 Processando apenas arquivo mais recente: ${latestFile}`);
            // Apenas marcar o offset como processado, sem enviar mensagens antigas
            const logFile = path.join(logsPath, latestFile);
            const stat = await fs.stat(logFile);
            const offsets = await readOffsets();
            offsets[latestFile] = stat.size;
            await writeOffsets(offsets);
            console.log(`[ChatGlobalWatcher] 📋 Offset marcado para ${latestFile}: ${stat.size}`);
        }
    }
    catch (err) {
        console.error('[ChatGlobalWatcher] ❌ Erro ao processar arquivos iniciais:', err);
    }
    // --- SISTEMA DE CÓPIA FORÇADA PARA MELHORAR DETECÇÃO ---
    async function forcedCopySystem() {
        try {
            await copyLatestChatFile(logsPath);
        }
        catch (error) {
            // Erro silencioso para não interromper o sistema
        }
        setTimeout(forcedCopySystem, 5000); // Copiar a cada 5 segundos
    }
    // Iniciar sistema de cópia forçada
    console.log('[ChatGlobalWatcher] 📋 Sistema de cópia forçada ativado (a cada 5 segundos)');
    forcedCopySystem();
    // Limpeza automática de mensagens antigas (a cada 12 horas)
    setInterval(cleanupOldMessages, 12 * 60 * 60 * 1000);
    console.log('[ChatGlobalWatcher] 🧹 Limpeza automática de mensagens antigas ativada (a cada 12 horas)');
    console.log('[ChatGlobalWatcher] 🚀 Sistema de chat global ativo!');
}
//# sourceMappingURL=chatGlobalWatcher.js.map