import * as fs from 'fs-extra';
import * as path from 'path';
import { FileManager } from './fileManager';

// Importar bibliotecas para notificações push
const chokidar = require('chokidar');
const nodeWatch = require('node-watch');

const OFFSETS_FILE = path.join(process.cwd(), 'vehicle_destruction_offsets.json');

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para copiar arquivo e forçar detecção de mudanças
async function copyLatestDestructionFile(logsPath: string): Promise<void> {
  try {
    const files = await fs.readdir(logsPath);
    const destructionFiles = files
      .filter(f => f.startsWith('vehicle_destruction_') && f.endsWith('.log'))
      .sort((a, b) => {
        // Extrair data/hora do nome do arquivo: vehicle_destruction_YYYYMMDDHHMMSS.log
        const dateA = a.replace('vehicle_destruction_', '').replace('.log', '');
        const dateB = b.replace('vehicle_destruction_', '').replace('.log', '');
        return dateB.localeCompare(dateA); // Ordem decrescente (mais novo primeiro)
      });

    if (destructionFiles.length === 0) {
      return;
    }

    const latestFile = destructionFiles[0];
    const sourcePath = path.join(logsPath, latestFile);
    const tempPath = path.join(logsPath, `${latestFile}.temp`);

    // Verificar se o arquivo existe e tem conteúdo
    if (!await fs.pathExists(sourcePath)) {
      return;
    }

    const stats = await fs.stat(sourcePath);
    if (stats.size === 0) {
      return;
    }

    // Copiar o arquivo para um arquivo temporário
    await fs.copy(sourcePath, tempPath);
    
    // Aguardar um pouco para garantir que a cópia foi concluída
    await sleep(50);
    
    // Deletar o arquivo temporário
    await fs.remove(tempPath);
    
    // Log apenas a cada 10 cópias para não poluir o console
    const copyCount = (global as any).destructionFileCopyCount || 0;
    (global as any).destructionFileCopyCount = copyCount + 1;
    
    if (copyCount % 10 === 0) {
      console.log(`[DestructionWatcher] 📋 Arquivo copiado para forçar detecção: ${latestFile} (cópia #${copyCount + 1})`);
    }
  } catch (error) {
    // Log silencioso para não poluir o console com erros de cópia
    const errorCount = (global as any).destructionFileCopyErrorCount || 0;
    (global as any).destructionFileCopyErrorCount = errorCount + 1;
    
    if (errorCount % 50 === 0) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[DestructionWatcher] ⚠️ Erro ao copiar arquivo (ocasional):', errorMessage);
    }
  }
}

// Função para converter UTF-16 para UTF-8 se necessário
function convertUtf16ToUtf8(str: string): string {
  try {
    // Se a string contém caracteres UTF-16, converter
    if (str.includes('\u0000')) {
      const cleaned = str.replace(/\u0000/g, '');
      return cleaned;
    }
    return str;
  } catch (error) {
    console.error('[DestructionWatcher] ❌ Erro na conversão UTF-16:', error);
    return str;
  }
}

function parseDestructionLine(line: string) {
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
        } else {
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

async function readOffsets(): Promise<Record<string, number>> {
  try {
    if (await fs.pathExists(OFFSETS_FILE)) {
      return JSON.parse(await fs.readFile(OFFSETS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('[DestructionWatcher] ❌ Erro ao ler offsets:', error);
  }
  return {};
}

async function writeOffsets(offsets: Record<string, number>) {
  await fs.writeFile(OFFSETS_FILE, JSON.stringify(offsets, null, 2), 'utf8');
}

export async function startVehicleDestructionWatcher(fileManager: FileManager) {
  console.log('[DestructionWatcher] 🚀 Iniciando DestructionWatcher com notificações push...');
  
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

  // Função para carregar webhook dinamicamente
  async function loadWebhook(): Promise<string | null> {
    const webhookPath = path.join(process.cwd(), 'discordWebhooks.json');
    if (!await fs.pathExists(webhookPath)) {
      console.log('[DestructionWatcher] ❌ discordWebhooks.json não encontrado');
      return null;
    }
    try {
      const webhooks = JSON.parse(await fs.readFile(webhookPath, 'utf8'));
      const webhookUrl = webhooks.logDestruicaoVeiculos;
      if (!webhookUrl) {
        console.log('[DestructionWatcher] ❌ webhook de destruição de veículos não configurado');
        return null;
      }
      return webhookUrl;
    } catch (error) {
      console.error('[DestructionWatcher] ❌ Erro ao carregar webhook:', error);
      return null;
    }
  }

  // Carregar webhook inicial
  let webhookUrl = await loadWebhook();
  if (!webhookUrl) {
    console.log('[DestructionWatcher] ❌ Não foi possível carregar webhook inicial');
    return;
  }

  console.log('[DestructionWatcher] ✅ Iniciando watcher para:', logsPath);
  console.log('[DestructionWatcher] ✅ Webhook configurado:', webhookUrl.substring(0, 50) + '...');

  // Set para controlar eventos já processados (evitar duplicatas)
  const processedEvents = new Set<string>();
  
  // Set para controlar arquivos sendo processados (evitar processamento simultâneo)
  const processingFiles = new Set<string>();
  
  // Carregar eventos já processados do arquivo
  const processedEventsFile = path.join(process.cwd(), 'processed_vehicle_events.json');
  try {
    if (await fs.pathExists(processedEventsFile)) {
      const savedEvents = JSON.parse(await fs.readFile(processedEventsFile, 'utf8'));
      savedEvents.forEach((eventId: string) => processedEvents.add(eventId));
      console.log(`[DestructionWatcher] 📋 Carregados ${processedEvents.size} eventos já processados`);
    }
  } catch (error) {
    console.error('[DestructionWatcher] ❌ Erro ao carregar eventos processados:', error);
  }
  
  // Função para salvar eventos processados
  async function saveProcessedEvents() {
    try {
      const eventsArray = Array.from(processedEvents);
      await fs.writeFile(processedEventsFile, JSON.stringify(eventsArray, null, 2), 'utf8');
    } catch (error) {
      console.error('[DestructionWatcher] ❌ Erro ao salvar eventos processados:', error);
    }
  }
  
  // Função para limpar eventos antigos (mais de 30 dias)
  async function cleanupOldEvents() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '.');
      
      const eventsToKeep = Array.from(processedEvents).filter(eventId => {
        // Extrair data do eventId (formato: vehicleId-datetime-eventType)
        const parts = eventId.split('-');
        if (parts.length >= 3) {
          const datePart = parts[1]; // datetime
          return datePart >= cutoffDate;
        }
        return true; // Manter se não conseguir extrair data
      });
      
      if (eventsToKeep.length < processedEvents.size) {
        processedEvents.clear();
        eventsToKeep.forEach(eventId => processedEvents.add(eventId));
        await saveProcessedEvents();
        console.log(`[DestructionWatcher] 🧹 Limpeza: ${processedEvents.size - eventsToKeep.length} eventos antigos removidos`);
      }
    } catch (error) {
      console.error('[DestructionWatcher] ❌ Erro ao limpar eventos antigos:', error);
    }
  }

  // Função para gerar ID único do evento
  function generateEventId(data: any): string {
    return `${data.vehicleId}-${data.datetime}-${data.eventType}`;
  }

  // Função para processar um arquivo específico
  async function processFile(logFileName: string) {
    // Recarregar webhook antes de processar (para pegar mudanças)
    const currentWebhook = await loadWebhook();
    if (!currentWebhook) {
      console.log('[DestructionWatcher] ⚠️ Webhook não disponível, pulando processamento');
      return;
    }
    
    // Se o webhook mudou, atualizar e logar
    if (currentWebhook !== webhookUrl) {
      console.log('[DestructionWatcher] 🔄 Webhook atualizado:', currentWebhook.substring(0, 50) + '...');
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
    let fd: fs.ReadStream | null = null;
    
    try {
      const stat = await fs.stat(logFile);
      
      if (stat.size <= lastOffset) {
        processingFiles.delete(logFileName);
        return;
      }
      
      console.log(`[DestructionWatcher] 🚀 Processando arquivo: ${logFileName} (size: ${stat.size}, offset: ${lastOffset})`);
      
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
              console.log(`[DestructionWatcher] 🚗 Processando evento: ${data.eventType} - ${data.vehicle} (ID: ${data.vehicleId})`);
              
              const eventEmoji = data.eventType === 'Disappeared' ? '🚗' : data.eventType === 'ForbiddenZoneTimerExpired' ? '⏰' : '💥';
              const eventText = data.eventType === 'Disappeared' ? 'Veículo desaparecido' : data.eventType === 'ForbiddenZoneTimerExpired' ? 'Veículo expirado (zona proibida)' : 'Veículo destruído';
              const msg = `${eventEmoji} ${eventText}!\nVeículo: ${data.vehicle} (ID: ${data.vehicleId})\nDono: ${data.ownerName}\nLocalização: ${data.location}\nData/Hora: ${data.datetime}`;
              
              try {
                const result = await fileManager.sendDiscordWebhookMessage(webhookUrl, msg);
                if (result.success) {
                  console.log('[DestructionWatcher] ✅ Discord: Mensagem enviada com sucesso!');
                } else {
                  console.error('[DestructionWatcher] ❌ Discord: Falha ao enviar mensagem:', result.error);
                }
              } catch (err) {
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
              console.log(`[DestructionWatcher] 🚗 Processando evento (final): ${data.eventType} - ${data.vehicle} (ID: ${data.vehicleId})`);
              const eventEmoji = data.eventType === 'Disappeared' ? '🚗' : data.eventType === 'ForbiddenZoneTimerExpired' ? '⏰' : '💥';
              const eventText = data.eventType === 'Disappeared' ? 'Veículo desaparecido' : data.eventType === 'ForbiddenZoneTimerExpired' ? 'Veículo expirado (zona proibida)' : 'Veículo destruído';
              const msg = `${eventEmoji} ${eventText}!\nVeículo: ${data.vehicle} (ID: ${data.vehicleId})\nDono: ${data.ownerName}\nLocalização: ${data.location}\nData/Hora: ${data.datetime}`;
              try {
                const result = await fileManager.sendDiscordWebhookMessage(webhookUrl, msg);
                if (result.success) {
                  console.log('[DestructionWatcher] ✅ Discord: Mensagem enviada com sucesso!');
                } else {
                  console.error('[DestructionWatcher] ❌ Discord: Falha ao enviar mensagem:', result.error);
                }
              } catch (err) {
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
      
      if (destructions > 0) {
        console.log(`[DestructionWatcher] 📊 Processados ${destructions} evento(s) em ${logFileName}`);
        // Salvar eventos processados
        await saveProcessedEvents();
      }
    } catch (err) {
      console.error('[DestructionWatcher] ❌ Erro ao ler arquivo de log:', err);
    } finally {
      if (fd) fd.close();
      // Remover arquivo da lista de processamento
      processingFiles.delete(logFileName);
    }
  }

  // Função para processar mudanças de arquivo
  async function handleFileChange(filePath: string) {
    const filename = path.basename(filePath);
    if (filename.startsWith('vehicle_destruction_') && filename.endsWith('.log')) {
      console.log(`[DestructionWatcher] 🚀 Push notification: ${filename}`);
      await processFile(filename);
    }
  }

  // Configurar múltiplos watchers para máxima confiabilidade
  console.log('[DestructionWatcher] 🔧 Configurando sistema de notificações push...');

  // 1. Chokidar (mais robusto)
  try {
    const chokidarWatcher = chokidar.watch(logsPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { 
        stabilityThreshold: 50,  // Aguarda 50ms após última mudança
        pollInterval: 50         // Verifica a cada 50ms
      },
      usePolling: false,         // Usa eventos nativos
      interval: 100,             // Fallback polling
      binaryInterval: 100
    });

    chokidarWatcher.on('change', handleFileChange);
    chokidarWatcher.on('add', handleFileChange);
    console.log('[DestructionWatcher] ✅ Chokidar watcher configurado');
  } catch (err) {
    console.error('[DestructionWatcher] ❌ Erro ao configurar Chokidar:', err);
  }

  // 2. Node-watch (backup) - DESABILITADO para evitar duplicações
  // try {
  //   const nodeWatchWatcher = nodeWatch(logsPath, { 
  //     recursive: false,
  //     filter: (f: string) => f.includes('vehicle_destruction_')
  //   });

  //   nodeWatchWatcher.on('change', (evt: string, name: string) => {
  //     console.log(`[DestructionWatcher] 🔄 Node-watch: ${name}`);
  //     handleFileChange(path.join(logsPath, name));
  //   });
  //   console.log('[DestructionWatcher] ✅ Node-watch configurado');
  // } catch (err) {
  //   console.error('[DestructionWatcher] ❌ Erro ao configurar Node-watch:', err);
  // }

  // 3. Watcher nativo do Node.js (terceira camada) - DESABILITADO para evitar duplicações
  // try {
  //   const nativeWatcher = fs.watch(logsPath, { recursive: false }, async (eventType, filename) => {
  //     if (filename && filename.startsWith('vehicle_destruction_') && filename.endsWith('.log')) {
  //       console.log(`[DestructionWatcher] 🔄 Native watcher: ${filename}`);
  //       await handleFileChange(path.join(logsPath, filename));
  //     }
  //   });
  //   console.log('[DestructionWatcher] ✅ Native watcher configurado');
  // } catch (err) {
  //   console.error('[DestructionWatcher] ❌ Erro ao configurar native watcher:', err);
  // }

  console.log('[DestructionWatcher] 🚀 Sistema de notificações push ativo!');

  // Processamento inicial de todos os arquivos
  try {
    const files = await fs.readdir(logsPath);
    const vehicleLogs = files.filter(f => f.startsWith('vehicle_destruction_') && f.endsWith('.log'));
    
    console.log(`[DestructionWatcher] 📁 Arquivos de destruição encontrados: ${vehicleLogs.length}`);
    
    if (vehicleLogs.length > 0) {
      console.log(`[DestructionWatcher] 📁 Processando ${vehicleLogs.length} arquivo(s) inicialmente`);
      
      for (const logFileName of vehicleLogs) {
        await processFile(logFileName);
      }
    }
  } catch (err) {
    console.error('[DestructionWatcher] ❌ Erro ao processar arquivos iniciais:', err);
  }

  // --- POLLING INCREMENTAL PARA ATUALIZAÇÃO EM TEMPO REAL ---
  async function incrementalPolling() {
    const offsets = await readOffsets();
    try {
      const files = await fs.readdir(logsPath);
      const destructionFiles = files.filter(file => file.startsWith('vehicle_destruction_') && file.endsWith('.log')).sort();
      for (const logFileName of destructionFiles) {
        const filePath = path.join(logsPath, logFileName);
        const stats = await fs.stat(filePath);
        let offset = offsets[logFileName] || 0;
        if (stats.size > offset) {
          const fd = await fs.promises.open(filePath, 'r');
          const buffer = Buffer.alloc(stats.size - offset);
          await fd.read(buffer, 0, stats.size - offset, offset);
          await fd.close();
          const content = buffer.toString('utf16le');
          const lines = content.split(/\r?\n/);
          let updated = false;
          // Buscar webhook dinamicamente
          const currentWebhook = await loadWebhook();
          if (!currentWebhook) continue;
          for (const line of lines) {
            const data = parseDestructionLine(line);
            if (data) {
              const eventId = generateEventId(data);
              if (!processedEvents.has(eventId)) {
                processedEvents.add(eventId);
                // Enviar para o Discord com formato consistente
                const eventEmoji = data.eventType === 'Disappeared' ? '🚗' : data.eventType === 'ForbiddenZoneTimerExpired' ? '⏰' : '💥';
                const eventText = data.eventType === 'Disappeared' ? 'Veículo desaparecido' : data.eventType === 'ForbiddenZoneTimerExpired' ? 'Veículo expirado (zona proibida)' : 'Veículo destruído';
                const message = `${eventEmoji} ${eventText}!\nVeículo: ${data.vehicle} (ID: ${data.vehicleId})\nDono: ${data.ownerName}\nLocalização: ${data.location}\nData/Hora: ${data.datetime}`;
                await fileManager.sendDiscordWebhookMessage(currentWebhook, message);
                updated = true;
                console.log(`[DestructionWatcher] 🔄 Evento enviado via polling incremental!`);
              }
            }
          }
          offsets[logFileName] = stats.size;
        }
      }
      await writeOffsets(offsets);
    } catch (err) {
      console.error('[DestructionWatcher] ❌ Erro no polling incremental:', err);
    }
    setTimeout(incrementalPolling, 2000); // Polling a cada 2 segundos
  }

  // --- SISTEMA DE CÓPIA FORÇADA PARA MELHORAR DETECÇÃO ---
  async function forcedCopySystem() {
    try {
      await copyLatestDestructionFile(logsPath);
    } catch (error) {
      // Erro silencioso para não interromper o sistema
    }
    setTimeout(forcedCopySystem, 5000); // Copiar a cada 5 segundos
  }

  // Iniciar sistema de cópia forçada
  console.log('[DestructionWatcher] 📋 Sistema de cópia forçada ativado (a cada 5 segundos)');
  forcedCopySystem();
  
  // Limpeza automática de eventos antigos (a cada 24 horas)
  setInterval(cleanupOldEvents, 24 * 60 * 60 * 1000);
  console.log('[DestructionWatcher] 🧹 Limpeza automática de eventos antigos ativada (a cada 24 horas)');
} 