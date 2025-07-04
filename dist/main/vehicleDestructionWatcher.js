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
exports.startVehicleDestructionWatcher = startVehicleDestructionWatcher;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const OFFSETS_FILE = path.join(process.cwd(), 'vehicle_destruction_offsets.json');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Função para converter string UTF-16 para UTF-8
function convertUtf16ToUtf8(str) {
    // Se a string contém caracteres \u0000, é UTF-16
    if (str.includes('\u0000')) {
        // Remove os caracteres \u0000 e reconstrói a string
        return str.replace(/\u0000/g, '');
    }
    return str;
}
function parseDestructionLine(line) {
    // Converter encoding se necessário
    const cleanLine = convertUtf16ToUtf8(line);
    // Exemplos de linha:
    // 2025.07.03-23.09.02: [Disappeared] Laika_ES. VehicleId: 804481. Owner: 76561198398160339 (15, BlueArcher_BR). Location: X=-375570.938 Y=-7998.395 Z=34911.961
    // 2025.07.03-15.07.14: [ForbiddenZoneTimerExpired] Rager_ES. VehicleId: 631127. Owner: 76561198140545020 (12, mariocs10). Location: X=-616524.625 Y=-556638.250 Z=2381.764
    // 2025.07.04-02.48.56: [Destroyed] Rager_ES. VehicleId: 823530. Owner: 76561197963358180 (19, Reav). Location: X=-539493.812 Y=-470512.594 Z=-115.027
    // Primeiro, verificar se a linha contém um evento de destruição
    if (!cleanLine.includes('[Disappeared]') && !cleanLine.includes('[ForbiddenZoneTimerExpired]') && !cleanLine.includes('[Destroyed]')) {
        return null;
    }
    // Regex mais simples e flexível - agora inclui [Destroyed]
    const regex = /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): \[(Disappeared|ForbiddenZoneTimerExpired|Destroyed)\] ([^.]+)\. VehicleId: (\d+)\. Owner: (N\/A|\d+)(?: \(\d+, ([^)]+)\))?\. Location: (.+)$/;
    const match = cleanLine.match(regex);
    if (!match) {
        // Regex mais simples para extrair informações básicas - agora inclui [Destroyed]
        const simpleRegex = /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): \[(Disappeared|ForbiddenZoneTimerExpired|Destroyed)\] ([^.]+)\. VehicleId: (\d+)\. Owner: (.+?)\. Location: (.+)$/;
        const simpleMatch = cleanLine.match(simpleRegex);
        if (simpleMatch) {
            const ownerInfo = simpleMatch[5];
            let ownerSteamId = 'N/A';
            let ownerName = 'N/A';
            if (ownerInfo !== 'N/A') {
                const ownerMatch = ownerInfo.match(/(\d+) \(\d+, ([^)]+)\)/);
                if (ownerMatch) {
                    ownerSteamId = ownerMatch[1];
                    ownerName = ownerMatch[2];
                }
                else {
                    ownerSteamId = ownerInfo;
                }
            }
            return {
                datetime: simpleMatch[1],
                eventType: simpleMatch[2],
                vehicle: simpleMatch[3],
                vehicleId: simpleMatch[4],
                ownerSteamId: ownerSteamId,
                ownerName: ownerName,
                location: simpleMatch[6],
            };
        }
        return null;
    }
    return {
        datetime: match[1],
        eventType: match[2],
        vehicle: match[3],
        vehicleId: match[4],
        ownerSteamId: match[5],
        ownerName: match[6] || 'N/A',
        location: match[7],
    };
}
async function readOffsets() {
    try {
        if (await fs.pathExists(OFFSETS_FILE)) {
            return JSON.parse(await fs.readFile(OFFSETS_FILE, 'utf8'));
        }
    }
    catch { }
    return {};
}
async function writeOffsets(offsets) {
    await fs.writeFile(OFFSETS_FILE, JSON.stringify(offsets, null, 2), 'utf8');
}
async function startVehicleDestructionWatcher(fileManager) {
    console.log('[DestructionWatcher] 🚀 Iniciando DestructionWatcher...');
    // Ler config.json para pegar logsPath
    const configPath = path.join(process.cwd(), 'config.json');
    if (!await fs.pathExists(configPath)) {
        console.log('[DestructionWatcher] ❌ config.json não encontrado');
        return;
    }
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const logsPath = config.logsPath;
    if (!logsPath) {
        console.log('[DestructionWatcher] ❌ logsPath não configurado');
        return;
    }
    // Carregar webhook do discordWebhooks.json
    const webhookPath = path.join(process.cwd(), 'discordWebhooks.json');
    if (!await fs.pathExists(webhookPath)) {
        console.log('[DestructionWatcher] ❌ discordWebhooks.json não encontrado');
        return;
    }
    const webhooks = JSON.parse(await fs.readFile(webhookPath, 'utf8'));
    const webhookUrl = webhooks.logDestruicaoVeiculos;
    if (!webhookUrl) {
        console.log('[DestructionWatcher] ❌ webhook de destruição de veículos não configurado');
        return;
    }
    console.log('[DestructionWatcher] ✅ Iniciando watcher para:', logsPath);
    console.log('[DestructionWatcher] ✅ Webhook configurado:', webhookUrl.substring(0, 50) + '...');
    // Set para controlar eventos já processados (evitar duplicatas)
    const processedEvents = new Set();
    // Set para controlar arquivos sendo processados (evitar processamento simultâneo)
    const processingFiles = new Set();
    // Função para gerar ID único do evento
    function generateEventId(data) {
        return `${data.vehicleId}-${data.datetime}-${data.eventType}`;
    }
    // Função para processar um arquivo específico
    async function processFile(logFileName, webhookUrl) {
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
            if (stat.size <= lastOffset) {
                processingFiles.delete(logFileName);
                return;
            }
            fd = fs.createReadStream(logFile, { start: lastOffset, encoding: 'utf8' });
            let buffer = '';
            let newOffset = lastOffset;
            let totalLines = 0;
            let destructions = 0;
            for await (const chunk of fd) {
                buffer += chunk;
                let lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';
                for (const line of lines) {
                    totalLines++;
                    newOffset += Buffer.byteLength(line + '\n', 'utf8');
                    // Converter encoding se necessário
                    const cleanLine = convertUtf16ToUtf8(line);
                    // Verificar se a linha contém eventos de destruição
                    if (cleanLine.includes('[Disappeared]') || cleanLine.includes('[ForbiddenZoneTimerExpired]') || cleanLine.includes('[Destroyed]')) {
                        const data = parseDestructionLine(line);
                        if (data) {
                            // Gerar ID único do evento
                            const eventId = generateEventId(data);
                            // Verificar se o evento já foi processado
                            if (processedEvents.has(eventId)) {
                                continue;
                            }
                            // Marcar como processado ANTES de enviar
                            processedEvents.add(eventId);
                            destructions++;
                            // console.log(`[DestructionWatcher] 🚗 Processando evento: ${data.eventType} - ${data.vehicle} (ID: ${data.vehicleId})`);
                            const eventEmoji = data.eventType === 'Disappeared' ? '🚗' : data.eventType === 'ForbiddenZoneTimerExpired' ? '⏰' : '💥';
                            const eventText = data.eventType === 'Disappeared' ? 'Veículo desaparecido' : data.eventType === 'ForbiddenZoneTimerExpired' ? 'Veículo expirado (zona proibida)' : 'Veículo destruído';
                            let donoMsg = data.ownerName;
                            if (!config.hideVehicleOwnerSteamId) {
                                donoMsg += ` (SteamID: ${data.ownerSteamId})`;
                            }
                            const msg = `${eventEmoji} ${eventText}!\nVeículo: ${data.vehicle} (ID: ${data.vehicleId})\nDono: ${donoMsg}\nLocalização: ${data.location}\nData/Hora: ${data.datetime}`;
                            try {
                                const result = await fileManager.sendDiscordWebhookMessage(webhookUrl, msg);
                                if (result.success) {
                                    console.log('[DestructionWatcher] ✅ Discord: Mensagem enviada com sucesso!');
                                }
                                else {
                                    console.error('[DestructionWatcher] ❌ Discord: Falha ao enviar mensagem:', result.error);
                                }
                            }
                            catch (err) {
                                console.error('[DestructionWatcher] ❌ Discord: Erro ao enviar mensagem:', err);
                            }
                        }
                    }
                }
            }
            // Processar a última linha pendente (caso não termine com \n)
            if (buffer.trim().length > 0) {
                totalLines++;
                newOffset += Buffer.byteLength(buffer, 'utf8');
                const cleanLine = convertUtf16ToUtf8(buffer);
                if (cleanLine.includes('[Disappeared]') || cleanLine.includes('[ForbiddenZoneTimerExpired]') || cleanLine.includes('[Destroyed]')) {
                    const data = parseDestructionLine(buffer);
                    if (data) {
                        const eventId = generateEventId(data);
                        if (!processedEvents.has(eventId)) {
                            processedEvents.add(eventId);
                            destructions++;
                            // console.log(`[DestructionWatcher] �� Processando evento (final): ${data.eventType} - ${data.vehicle} (ID: ${data.vehicleId})`);
                            const eventEmoji = data.eventType === 'Disappeared' ? '🚗' : data.eventType === 'ForbiddenZoneTimerExpired' ? '⏰' : '💥';
                            const eventText = data.eventType === 'Disappeared' ? 'Veículo desaparecido' : data.eventType === 'ForbiddenZoneTimerExpired' ? 'Veículo expirado (zona proibida)' : 'Veículo destruído';
                            let donoMsg = data.ownerName;
                            if (!config.hideVehicleOwnerSteamId) {
                                donoMsg += ` (SteamID: ${data.ownerSteamId})`;
                            }
                            const msg = `${eventEmoji} ${eventText}!\nVeículo: ${data.vehicle} (ID: ${data.vehicleId})\nDono: ${donoMsg}\nLocalização: ${data.location}\nData/Hora: ${data.datetime}`;
                            try {
                                const result = await fileManager.sendDiscordWebhookMessage(webhookUrl, msg);
                                if (result.success) {
                                    console.log('[DestructionWatcher] ✅ Discord: Mensagem enviada com sucesso!');
                                }
                                else {
                                    console.error('[DestructionWatcher] ❌ Discord: Falha ao enviar mensagem:', result.error);
                                }
                            }
                            catch (err) {
                                console.error('[DestructionWatcher] ❌ Discord: Erro ao enviar mensagem:', err);
                            }
                        }
                    }
                }
            }
            // Atualizar offset
            const offsets = await readOffsets();
            offsets[logFileName] = newOffset;
            await writeOffsets(offsets);
            // if (destructions > 0) {
            //   console.log(`[DestructionWatcher] 📊 Processados ${destructions} evento(s) em ${logFileName}`);
            // }
        }
        catch (err) {
            console.error('[DestructionWatcher] ❌ Erro ao ler arquivo de log:', err);
        }
        finally {
            if (fd)
                fd.close();
            // Remover arquivo da lista de processamento
            processingFiles.delete(logFileName);
        }
    }
    // Configurar watcher para detectar mudanças em tempo real
    try {
        const watcher = fs.watch(logsPath, { recursive: false }, async (eventType, filename) => {
            if (filename && filename.startsWith('vehicle_destruction_') && filename.endsWith('.log')) {
                // console.log(`[DestructionWatcher] 🔄 Mudança detectada em: ${filename}`);
                await processFile(filename, webhookUrl);
            }
        });
        console.log('[DestructionWatcher] 👁️ Watcher configurado para detecção em tempo real');
    }
    catch (err) {
        console.error('[DestructionWatcher] ❌ Erro ao configurar watcher:', err);
    }
    // Processamento inicial de todos os arquivos
    try {
        const files = await fs.readdir(logsPath);
        const vehicleLogs = files.filter(f => f.startsWith('vehicle_destruction_') && f.endsWith('.log'));
        if (vehicleLogs.length > 0) {
            // console.log(`[DestructionWatcher] 📁 Processando ${vehicleLogs.length} arquivo(s) de log inicialmente`);
            for (const logFileName of vehicleLogs) {
                await processFile(logFileName, webhookUrl);
            }
        }
    }
    catch (err) {
        console.error('[DestructionWatcher] ❌ Erro ao processar arquivos iniciais:', err);
    }
    // Loop de polling como fallback
    console.log('[DestructionWatcher] 🔄 Iniciando loop de polling...');
    let pollCount = 0;
    while (true) {
        try {
            pollCount++;
            // if (pollCount % 60 === 0) { // Log a cada 30 segundos
            //   console.log(`[DestructionWatcher] 🔄 Polling ativo (${new Date().toLocaleTimeString()})`);
            // }
            const files = await fs.readdir(logsPath);
            const vehicleLogs = files.filter(f => f.startsWith('vehicle_destruction_') && f.endsWith('.log'));
            for (const logFileName of vehicleLogs) {
                await processFile(logFileName, webhookUrl);
            }
        }
        catch (err) {
            console.error('[DestructionWatcher] ❌ Erro no polling:', err);
        }
        await sleep(500); // Polling a cada 0.5 segundo
    }
}
//# sourceMappingURL=vehicleDestructionWatcher.js.map