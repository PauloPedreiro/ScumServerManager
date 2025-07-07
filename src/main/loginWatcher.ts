import * as fs from 'fs-extra';
import * as path from 'path';
import { FileManager } from './fileManager';

// Importar bibliotecas para notificações push
const chokidar = require('chokidar');

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
    console.error('[LoginWatcher] ❌ Erro na conversão UTF-16:', error);
    return str;
  }
}

// Função para aguardar
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para ler offsets salvos
async function readOffsets(): Promise<Record<string, number>> {
  try {
    const offsetPath = path.join(process.cwd(), 'login_offsets.json');
    if (await fs.pathExists(offsetPath)) {
      return JSON.parse(await fs.readFile(offsetPath, 'utf8'));
    }
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao ler offsets:', error);
  }
  return {};
}

// Função para salvar offsets
async function writeOffsets(offsets: Record<string, number>): Promise<void> {
  try {
    const offsetPath = path.join(process.cwd(), 'login_offsets.json');
    await fs.writeFile(offsetPath, JSON.stringify(offsets, null, 2), 'utf8');
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao salvar offsets:', error);
  }
}

// Função para salvar players online
async function saveOnlinePlayers(players: Map<string, { name: string; steamId: string; loginTime: string }>): Promise<void> {
  try {
    const playersPath = path.join(process.cwd(), 'online_players.json');
    const playersArray = Array.from(players.values());
    await fs.writeFile(playersPath, JSON.stringify(playersArray, null, 2), 'utf8');
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao salvar players online:', error);
  }
}

// Função para carregar players online
async function loadOnlinePlayers(): Promise<Map<string, { name: string; steamId: string; loginTime: string }>> {
  try {
    const playersPath = path.join(process.cwd(), 'online_players.json');
    if (await fs.pathExists(playersPath)) {
      const playersArray = JSON.parse(await fs.readFile(playersPath, 'utf8'));
      return new Map(playersArray.map((p: any) => [p.steamId, p]));
    }
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao carregar players online:', error);
  }
  return new Map();
}

// Função para salvar eventos processados
async function saveProcessedEvents(events: Set<string>): Promise<void> {
  try {
    const eventsPath = path.join(process.cwd(), 'login_processed_events.json');
    await fs.writeFile(eventsPath, JSON.stringify(Array.from(events), null, 2), 'utf8');
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao salvar eventos processados:', error);
  }
}

// Função para carregar eventos processados
async function loadProcessedEvents(): Promise<Set<string>> {
  try {
    const eventsPath = path.join(process.cwd(), 'login_processed_events.json');
    if (await fs.pathExists(eventsPath)) {
      const eventsArray = JSON.parse(await fs.readFile(eventsPath, 'utf8'));
      return new Set(eventsArray);
    }
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao carregar eventos processados:', error);
  }
  return new Set();
}

// Função para limpar eventos antigos (mais de 24 horas)
function cleanOldEvents(events: Set<string>): void {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  for (const eventKey of events) {
    try {
      const [timestamp] = eventKey.split('|');
      const eventDate = new Date(timestamp.replace(/(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/, '$1-$2-$3T$4:$5:$6'));
      if (eventDate < oneDayAgo) {
        events.delete(eventKey);
      }
    } catch (error) {
      // Se não conseguir parsear a data, remover o evento
      events.delete(eventKey);
    }
  }
}

// Função para parsear linha de login
function parseLoginLine(line: string): { steamId: string; playerName: string; action: 'login' | 'logout'; timestamp: string } | null {
  try {
    // Converter encoding se necessário
    const cleanLine = convertUtf16ToUtf8(line);
    
    // Log para debug
    console.log(`[LoginWatcher] 🔍 Parseando linha: "${cleanLine}"`);
    
    // Padrão: 2025.07.05-00.30.39: '192.168.100.3 76561198040636105:Pedreiro(1)' logged in at: X=-559335.000 Y=-197738.000 Z=17276.000
    // Padrão: 2025.07.05-00.36.27: '192.168.100.3 76561198040636105:Pedreiro(1)' logged out at: X=-595390.000 Y=-135013.016 Z=20361.350
    
    const regex = /^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '\d+\.\d+\.\d+\.\d+ (\d+):([^(]+)\(\d+\)' logged (in|out) at:/;
    const match = cleanLine.match(regex);
    
    if (match) {
      // Converter 'in' para 'login' e 'out' para 'logout'
      const action = match[4] === 'in' ? 'login' : 'logout';
      const result = {
        timestamp: match[1],
        steamId: match[2],
        playerName: match[3].trim(),
        action: action as 'login' | 'logout'
      };
      console.log(`[LoginWatcher] ✅ Parseado com sucesso:`, result);
      return result;
    } else {
      console.log(`[LoginWatcher] ❌ Regex não encontrou match para: "${cleanLine}"`);
      return null;
    }
  } catch (error) {
    console.error('[LoginWatcher] ❌ Erro ao parsear linha de login:', error);
    return null;
  }
}

// Função para criar mensagem do painel
function createPanelMessage(onlinePlayers: Map<string, { name: string; steamId: string; loginTime: string }>): string {
  if (onlinePlayers.size === 0) {
    return `__**🎮 Players Online**__\n\n> Nenhum jogador online no momento.`;
  }

  const playersList = Array.from(onlinePlayers.values())
    .map(player => `> 🟢 **${player.name}**`)
    .join('\n');

  return `__**🎮 Players Online**__  *(${onlinePlayers.size} players)*\n\n${playersList}`;
}

export async function startLoginWatcher(fileManager: FileManager) {
  console.log('[LoginWatcher] 🚀 Iniciando LoginWatcher para painel de players online...');
  
  // Ler config.json para pegar logsPath
  const configPath = path.join(process.cwd(), 'config.json');
  if (!await fs.pathExists(configPath)) {
    console.log('[LoginWatcher] ❌ config.json não encontrado');
    return;
  }
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const logsPath = config.logsPath;
  if (!logsPath) {
    console.log('[LoginWatcher] ❌ logsPath não configurado');
    return;
  }

  // Carregar webhook do Discord
  async function loadWebhook(): Promise<string | null> {
    try {
      const webhookPath = path.join(process.cwd(), 'discordWebhooks.json');
      if (await fs.pathExists(webhookPath)) {
        const webhooks = JSON.parse(await fs.readFile(webhookPath, 'utf8'));
        return webhooks.painelPlayersOn || null;
      }
    } catch (error) {
      console.error('[LoginWatcher] ❌ Erro ao carregar webhook:', error);
    }
    return null;
  }

  // Função para enviar atualização do painel
  async function sendPanelUpdate() {
    try {
      const webhook = await loadWebhook();
      if (!webhook) {
        console.log('[LoginWatcher] ⚠️ Webhook não configurado');
        return;
      }

      const message = createPanelMessage(onlinePlayers);
      
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message
        })
      });

      if (response.ok) {
        console.log('[LoginWatcher] ✅ Painel atualizado enviado com sucesso!');
      } else {
        console.error('[LoginWatcher] ❌ Erro ao enviar painel:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[LoginWatcher] ❌ Erro ao enviar painel:', error);
    }
  }

  // Função para processar todos os arquivos de login e determinar estado atual
  async function processAllLoginFiles(): Promise<Map<string, { name: string; steamId: string; loginTime: string }>> {
    const players = new Map<string, { name: string; steamId: string; loginTime: string }>();
    const offsets = await readOffsets();
    
    try {
      const files = await fs.readdir(logsPath);
      const loginLogs = files.filter(f => f.startsWith('login_') && f.endsWith('.log'));
      
      console.log(`[LoginWatcher] 📁 Processando ${loginLogs.length} arquivo(s) de login...`);
      
      for (const logFileName of loginLogs) {
        const filePath = path.join(logsPath, logFileName);
        const stats = await fs.stat(filePath);
        const offset = offsets[logFileName] || 0;
        
        if (stats.size > offset) {
          console.log(`[LoginWatcher] 🚀 Processando arquivo: ${logFileName} (size: ${stats.size})`);
          
          const content = await fs.readFile(filePath, 'utf16le');
          const lines = content.split(/\r?\n/);
          
          let processedCount = 0;
          for (const line of lines) {
            if (line.includes('logged in') || line.includes('logged out')) {
              const data = parseLoginLine(line);
              if (data) {
                if (data.action === 'login') {
                  players.set(data.steamId, {
                    name: data.playerName,
                    steamId: data.steamId,
                    loginTime: data.timestamp
                  });
                } else if (data.action === 'logout') {
                  players.delete(data.steamId);
                }
                processedCount++;
              }
            }
          }
          
          console.log(`[LoginWatcher] 📊 Processados ${processedCount} evento(s) em ${logFileName}`);
        }
      }
    } catch (error) {
      console.error('[LoginWatcher] ❌ Erro ao processar arquivos:', error);
    }
    
    return players;
  }

  // Variáveis globais
  let onlinePlayers = new Map<string, { name: string; steamId: string; loginTime: string }>();
  let processedEvents = new Set<string>();
  let processingFiles = new Set<string>();
  let debounceTimer: NodeJS.Timeout | null = null;

  // Carregar estado salvo
  onlinePlayers = await loadOnlinePlayers();
  processedEvents = await loadProcessedEvents();
  
  // Limpar eventos antigos
  cleanOldEvents(processedEvents);
  await saveProcessedEvents(processedEvents);

  // Função para processar arquivo
  async function processFile(logFileName: string) {
    // Evitar processamento duplicado
    if (processingFiles.has(logFileName)) {
      console.log(`[LoginWatcher] ⏳ Arquivo ${logFileName} já está sendo processado`);
      return;
    }
    
    processingFiles.add(logFileName);
    
    try {
      const filePath = path.join(logsPath, logFileName);
      const stats = await fs.stat(filePath);
      const offsets = await readOffsets();
      const offset = offsets[logFileName] || 0;
      
      if (stats.size <= offset) {
        console.log(`[LoginWatcher] 📄 Arquivo ${logFileName} sem mudanças (size: ${stats.size}, offset: ${offset})`);
        return;
      }
      
      console.log(`[LoginWatcher] 🚀 Processando arquivo: ${logFileName} (size: ${stats.size}, offset: ${offset})`);
      
      // Ler apenas o conteúdo novo
      const content = await fs.readFile(filePath, 'utf16le');
      const lines = content.split(/\r?\n/);
      
      console.log(`[LoginWatcher] 📄 Total de linhas no arquivo: ${lines.length}`);
      console.log(`[LoginWatcher] 📄 Últimas 5 linhas do arquivo:`);
      for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
        console.log(`[LoginWatcher] 📄 Linha ${i + 1}: ${lines[i]}`);
      }
      
      let loginEvents = 0;
      let panelUpdated = false;
      
      for (const line of lines) {
        if (line.includes('logged in') || line.includes('logged out')) {
          console.log(`[LoginWatcher] 🔍 Linha contém evento de login/logout: "${line}"`);
          
          const data = parseLoginLine(line);
          if (data) {
            // Criar chave única para o evento
            const eventKey = `${data.timestamp}|${data.steamId}|${data.action}`;
            
            // Verificar se já foi processado
            if (processedEvents.has(eventKey)) {
              console.log(`[LoginWatcher] ⏭️ Evento já processado: ${eventKey}`);
              continue;
            }
            
            console.log(`[LoginWatcher] 👤 Processando evento: ${data.action} - ${data.playerName} (${data.steamId})`);
            
            if (data.action === 'login') {
              onlinePlayers.set(data.steamId, {
                name: data.playerName,
                steamId: data.steamId,
                loginTime: data.timestamp
              });
              console.log(`[LoginWatcher] ✅ ${data.playerName} adicionado (total: ${onlinePlayers.size})`);
            } else if (data.action === 'logout') {
              if (onlinePlayers.has(data.steamId)) {
                onlinePlayers.delete(data.steamId);
                console.log(`[LoginWatcher] ❌ ${data.playerName} removido (total: ${onlinePlayers.size})`);
              }
            }
            
            // Marcar como processado
            processedEvents.add(eventKey);
            loginEvents++;
            panelUpdated = true;
          }
        }
      }
      
      // Atualizar offset
      offsets[logFileName] = stats.size;
      await writeOffsets(offsets);
      
      // Salvar players online e eventos processados
      await saveOnlinePlayers(onlinePlayers);
      await saveProcessedEvents(processedEvents);
      
      if (loginEvents > 0) {
        console.log(`[LoginWatcher] 📊 Processados ${loginEvents} evento(s) em ${logFileName}`);
      }
      
      // Enviar painel atualizado se houve mudanças
      if (panelUpdated) {
        console.log(`[LoginWatcher] 🔄 Atualizando painel (${onlinePlayers.size} players online)`);
        await sendPanelUpdate();
      }
    } catch (err) {
      console.error('[LoginWatcher] ❌ Erro ao ler arquivo de log:', err);
    } finally {
      // Remover arquivo da lista de processamento
      processingFiles.delete(logFileName);
    }
  }

  // Função para processar mudanças de arquivo com debounce
  async function handleFileChange(filePath: string) {
    const filename = path.basename(filePath);
    if (filename.startsWith('login_') && filename.endsWith('.log')) {
      console.log(`[LoginWatcher] 🚀 Push notification: ${filename}`);
      
      // Debounce para evitar processamento excessivo
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(async () => {
        await processFile(filename);
      }, 100);
    }
  }

  // Configurar apenas Chokidar (mais robusto)
  console.log('[LoginWatcher] 🔧 Configurando sistema de notificações push...');

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
    console.log('[LoginWatcher] ✅ Chokidar watcher configurado');
  } catch (err) {
    console.error('[LoginWatcher] ❌ Erro ao configurar Chokidar:', err);
  }

  console.log('[LoginWatcher] 🚀 Sistema de notificações push ativo!');

  // Processamento inicial - apenas marcar offsets como processados, sem enviar mensagens
  try {
    console.log('[LoginWatcher] 🔍 Iniciando processamento inicial...');
    const files = await fs.readdir(logsPath);
    const loginLogs = files.filter(f => f.startsWith('login_') && f.endsWith('.log'));
    
    console.log(`[LoginWatcher] 📁 Arquivos de login encontrados: ${loginLogs.length}`);
    
    if (loginLogs.length > 0) {
      // Ordenar arquivos por data (mais recente primeiro)
      loginLogs.sort((a, b) => {
        const dateA = a.replace('login_', '').replace('.log', '');
        const dateB = b.replace('login_', '').replace('.log', '');
        return dateB.localeCompare(dateA);
      });
      
      // Processar apenas o arquivo mais recente para determinar estado atual
      const mostRecentFile = loginLogs[0];
      const filePath = path.join(logsPath, mostRecentFile);
      const stats = await fs.stat(filePath);
      
      console.log(`[LoginWatcher] 🚀 Processando arquivo mais recente: ${mostRecentFile} (size: ${stats.size})`);
      
      const content = await fs.readFile(filePath, 'utf16le');
      const lines = content.split(/\r?\n/);
      
      for (const line of lines) {
        if (line.includes('logged in') || line.includes('logged out')) {
          const data = parseLoginLine(line);
          if (data) {
            // Criar chave única para o evento
            const eventKey = `${data.timestamp}|${data.steamId}|${data.action}`;
            
            // Marcar como processado sem enviar mensagens
            processedEvents.add(eventKey);
            
            if (data.action === 'login') {
              onlinePlayers.set(data.steamId, {
                name: data.playerName,
                steamId: data.steamId,
                loginTime: data.timestamp
              });
            } else if (data.action === 'logout') {
              onlinePlayers.delete(data.steamId);
            }
          }
        }
      }
      
      // Salvar estado atual
      await saveOnlinePlayers(onlinePlayers);
      await saveProcessedEvents(processedEvents);
      
      console.log(`[LoginWatcher] 📊 Estado final após processar todos os arquivos: ${onlinePlayers.size} players online`);
      console.log(`[LoginWatcher] 📊 Estado atual: ${onlinePlayers.size} players online`);
      for (const [steamId, player] of onlinePlayers) {
        console.log(`[LoginWatcher] 👤 Online: ${player.name} (${steamId})`);
      }
    } else {
      console.log('[LoginWatcher] ⚠️ Nenhum arquivo de login encontrado');
    }
    
    // Enviar painel inicial com estado real
    console.log(`[LoginWatcher] 📊 Enviando painel inicial (${onlinePlayers.size} players online)`);
    await sendPanelUpdate();
  } catch (err) {
    console.error('[LoginWatcher] ❌ Erro ao processar arquivo inicial:', err);
  }

  // Limpeza automática de eventos antigos a cada hora
  setInterval(async () => {
    const oldSize = processedEvents.size;
    cleanOldEvents(processedEvents);
    if (processedEvents.size < oldSize) {
      await saveProcessedEvents(processedEvents);
      console.log(`[LoginWatcher] 🧹 Limpeza automática: removidos ${oldSize - processedEvents.size} eventos antigos`);
    }
  }, 60 * 60 * 1000); // A cada hora
}