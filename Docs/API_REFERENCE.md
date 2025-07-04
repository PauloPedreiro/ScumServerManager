# ScumServerManager - API Reference

## Índice
1. [Visão Geral](#visão-geral)
2. [IPC API](#ipc-api)
3. [TypeScript Types](#typescript-types)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Error Handling](#error-handling)
6. [Performance](#performance)

---

## Visão Geral

A API do ScumServerManager é baseada em comunicação IPC (Inter-Process Communication) entre o processo principal (main) e o processo de renderização (renderer) do Electron. Todas as operações são expostas através do `contextBridge` para garantir segurança.

### Estrutura da API

```typescript
// Renderer Process
window.electronAPI.methodName(params) => Promise<Result>

// Main Process
ipcMain.handle('method-name', async (event, ...params) => {
  // Implementation
  return result;
});
```

---

## IPC API

### Configurações do Servidor

#### `selectServerFolder()`
Seleciona a pasta do servidor SCUM através de diálogo.

**Parâmetros**: Nenhum

**Retorno**: `Promise<string | null>`

**Exemplo**:
```typescript
const serverPath = await window.electronAPI.selectServerFolder();
if (serverPath) {
  console.log('Pasta selecionada:', serverPath);
}
```

#### `readServerConfig(serverPath: string)`
Lê as configurações do servidor SCUM.

**Parâmetros**:
- `serverPath` (string): Caminho do executável do servidor

**Retorno**: `Promise<ServerConfig>`

**Exemplo**:
```typescript
const config = await window.electronAPI.readServerConfig(serverPath);
console.log('Configurações:', config.serverSettings);
```

#### `saveServerConfig(serverPath: string, config: Partial<ServerConfig>)`
Salva as configurações do servidor SCUM.

**Parâmetros**:
- `serverPath` (string): Caminho do executável do servidor
- `config` (Partial<ServerConfig>): Configurações a serem salvas

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.saveServerConfig(serverPath, {
  serverSettings: {
    serverPort: 8900,
    maxPlayers: 64
  }
});
```

#### `validateConfig(config: any)`
Valida as configurações do servidor.

**Parâmetros**:
- `config` (any): Configurações a serem validadas

**Retorno**: `Promise<ValidationResult>`

**Exemplo**:
```typescript
const validation = await window.electronAPI.validateConfig(config);
if (!validation.isValid) {
  console.error('Erros de validação:', validation.errors);
}
```

### Configurações do Aplicativo

#### `loadAppConfig()`
Carrega as configurações do aplicativo (config.json).

**Parâmetros**: Nenhum

**Retorno**: `Promise<AppConfig>`

**Exemplo**:
```typescript
const appConfig = await window.electronAPI.loadAppConfig();
console.log('Caminho do servidor:', appConfig.serverPath);
```

#### `saveAppConfig(config: AppConfig)`
Salva as configurações do aplicativo (config.json).

**Parâmetros**:
- `config` (AppConfig): Configurações a serem salvas

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.saveAppConfig({
  ...appConfig,
  logsPath: newLogsPath
});
```

### Sistema de Cache

#### `loadServerCache()`
Carrega o cache do servidor.

**Parâmetros**: Nenhum

**Retorno**: `Promise<ServerCache | null>`

**Exemplo**:
```typescript
const cache = await window.electronAPI.loadServerCache();
if (cache) {
  console.log('Cache carregado:', cache);
}
```

#### `clearServerCache()`
Limpa o cache do servidor.

**Parâmetros**: Nenhum

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.clearServerCache();
console.log('Cache limpo');
```

### Sistema de Backup

#### `listBackups()`
Lista todos os backups disponíveis.

**Parâmetros**: Nenhum

**Retorno**: `Promise<BackupInfo[]>`

**Exemplo**:
```typescript
const backups = await window.electronAPI.listBackups();
backups.forEach(backup => {
  console.log(`Backup: ${backup.name} - ${backup.date}`);
});
```

#### `restoreBackup(backupName: string)`
Restaura um backup específico.

**Parâmetros**:
- `backupName` (string): Nome do backup a ser restaurado

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.restoreBackup('backup_2025-07-04_10-30-00');
console.log('Backup restaurado com sucesso');
```

### Operações de Arquivo

#### `readIniFile(filePath: string)`
Lê um arquivo INI e retorna objeto parseado.

**Parâmetros**:
- `filePath` (string): Caminho do arquivo INI

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
const iniContent = await window.electronAPI.readIniFile('/path/to/file.ini');
console.log('Conteúdo INI:', iniContent);
```

#### `saveIniFile(filePath: string, content: any)`
Salva um objeto como arquivo INI.

**Parâmetros**:
- `filePath` (string): Caminho do arquivo INI
- `content` (any): Conteúdo a ser salvo

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.saveIniFile('/path/to/file.ini', {
  '/Script/Scum.ScumGameMode': {
    LogVehicleDestroyed: 'True'
  }
});
```

#### `readJsonFile(filePath: string)`
Lê um arquivo JSON.

**Parâmetros**:
- `filePath` (string): Caminho do arquivo JSON

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
const jsonData = await window.electronAPI.readJsonFile('/path/to/file.json');
console.log('Dados JSON:', jsonData);
```

#### `saveJsonFile(filePath: string, content: any)`
Salva um objeto como arquivo JSON.

**Parâmetros**:
- `filePath` (string): Caminho do arquivo JSON
- `content` (any): Conteúdo a ser salvo

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.saveJsonFile('/path/to/file.json', {
  key: 'value',
  array: [1, 2, 3]
});
```

### Operações de Sistema

#### `listDir(dirPath: string)`
Lista o conteúdo de um diretório.

**Parâmetros**:
- `dirPath` (string): Caminho do diretório

**Retorno**: `Promise<string[]>`

**Exemplo**:
```typescript
const files = await window.electronAPI.listDir('/path/to/directory');
files.forEach(file => console.log('Arquivo:', file));
```

#### `checkPathExists(path: string)`
Verifica se um caminho existe.

**Parâmetros**:
- `path` (string): Caminho a ser verificado

**Retorno**: `Promise<boolean>`

**Exemplo**:
```typescript
const exists = await window.electronAPI.checkPathExists('/path/to/file');
console.log('Arquivo existe:', exists);
```

### Controle do Servidor

#### `getServerStatus(serverPath: string)`
Obtém o status atual do servidor.

**Parâmetros**:
- `serverPath` (string): Caminho do executável do servidor

**Retorno**: `Promise<ServerStatus>`

**Exemplo**:
```typescript
const status = await window.electronAPI.getServerStatus(serverPath);
console.log('Status do servidor:', status);
```

#### `startServer(serverPath: string)`
Inicia o servidor SCUM.

**Parâmetros**:
- `serverPath` (string): Caminho do executável do servidor

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.startServer(serverPath);
console.log('Servidor iniciado');
```

#### `stopServer(serverPath: string)`
Para o servidor SCUM.

**Parâmetros**:
- `serverPath` (string): Caminho do executável do servidor

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.stopServer(serverPath);
console.log('Servidor parado');
```

#### `restartServer(serverPath: string)`
Reinicia o servidor SCUM.

**Parâmetros**:
- `serverPath` (string): Caminho do executável do servidor

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.restartServer(serverPath);
console.log('Servidor reiniciado');
```

### Atualização do Servidor

#### `updateServerWithSteamcmd(steamcmdPath: string, installPath: string)`
Atualiza o servidor usando SteamCMD.

**Parâmetros**:
- `steamcmdPath` (string): Caminho do SteamCMD
- `installPath` (string): Caminho de instalação

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.updateServerWithSteamcmd(steamcmdPath, installPath);
console.log('Servidor atualizado');
```

### Sistema de Horários

#### `loadRestartSchedule()`
Carrega o horário de reinicialização.

**Parâmetros**: Nenhum

**Retorno**: `Promise<RestartSchedule[]>`

**Exemplo**:
```typescript
const schedule = await window.electronAPI.loadRestartSchedule();
console.log('Horários de reinicialização:', schedule);
```

#### `saveRestartSchedule(schedule: RestartSchedule[])`
Salva o horário de reinicialização.

**Parâmetros**:
- `schedule` (RestartSchedule[]): Horários a serem salvos

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.saveRestartSchedule([
  { day: 'monday', time: '06:00' },
  { day: 'friday', time: '02:00' }
]);
```

### Discord

#### `sendDiscordWebhookMessage(webhookUrl: string, message: string)`
Envia mensagem para webhook do Discord.

**Parâmetros**:
- `webhookUrl` (string): URL do webhook
- `message` (string): Mensagem a ser enviada

**Retorno**: `Promise<any>`

**Exemplo**:
```typescript
await window.electronAPI.sendDiscordWebhookMessage(
  'https://discord.com/api/webhooks/...',
  'Veículo destruído: Carro Vermelho'
);
```

#### `saveDiscordWebhooks(webhooks: DiscordWebhooks)`
Salva as configurações de webhooks do Discord.

**Parâmetros**:
- `webhooks` (DiscordWebhooks): Configurações dos webhooks

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.saveDiscordWebhooks({
  logNovosPlayers: 'https://discord.com/api/webhooks/...',
  logDestruicaoVeiculos: 'https://discord.com/api/webhooks/...'
});
```

#### `loadDiscordWebhooks()`
Carrega as configurações de webhooks do Discord.

**Parâmetros**: Nenhum

**Retorno**: `Promise<DiscordWebhooks>`

**Exemplo**:
```typescript
const webhooks = await window.electronAPI.loadDiscordWebhooks();
console.log('Webhooks carregados:', webhooks);
```

### Gerenciamento de Jogadores

#### `clearNotifiedPlayers()`
Limpa a lista de jogadores notificados.

**Parâmetros**: Nenhum

**Retorno**: `Promise<void>`

**Exemplo**:
```typescript
await window.electronAPI.clearNotifiedPlayers();
console.log('Lista de jogadores notificados limpa');
```

#### `getNotifiedPlayers()`
Obtém a lista de jogadores notificados.

**Parâmetros**: Nenhum

**Retorno**: `Promise<string[]>`

**Exemplo**:
```typescript
const players = await window.electronAPI.getNotifiedPlayers();
console.log('Jogadores notificados:', players);
```

---

## TypeScript Types

### Interfaces Principais

#### `ServerConfig`
```typescript
interface ServerConfig {
  serverSettings: {
    serverPort: number;
    maxPlayers: number;
    enableBattleye: boolean;
    serverName: string;
    serverPassword: string;
    adminPassword: string;
  };
  gameSettings: {
    lootSettings: any;
    vehicleSettings: any;
    zombieSettings: any;
    weatherSettings: any;
  };
  economyConfig: {
    traderSettings: any;
    itemPrices: any;
    currencySettings: any;
  };
  raidTimes: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  users: {
    admins: string[];
    whitelist: string[];
    blacklist: string[];
  };
}
```

#### `AppConfig`
```typescript
interface AppConfig {
  lastServerPath: string;
  steamcmdPath: string;
  serverPath: string;
  installPath: string;
  iniConfigPath: string;
  logsPath: string;
  serverPort: number;
  maxPlayers: number;
  enableBattleye: boolean;
  hideVehicleOwnerSteamId: boolean;
}
```

#### `ServerCache`
```typescript
interface ServerCache {
  lastUpdate: string;
  config: ServerConfig;
  status: ServerStatus;
  players: PlayerStats[];
}
```

#### `ServerStatus`
```typescript
type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping';
```

#### `BackupInfo`
```typescript
interface BackupInfo {
  name: string;
  date: string;
  size: number;
  path: string;
}
```

#### `ValidationResult`
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

#### `DiscordWebhooks`
```typescript
interface DiscordWebhooks {
  logNovosPlayers: string;
  logDestruicaoVeiculos: string;
}
```

#### `RestartSchedule`
```typescript
interface RestartSchedule {
  day: string;
  time: string;
  enabled: boolean;
}
```

#### `PlayerStats`
```typescript
interface PlayerStats {
  name: string;
  steamId: string;
  timestamp: string;
  lastLogin: string;
  totalLogins: number;
  lastPosition?: {
    x: string;
    y: string;
    z: string;
  };
}
```

#### `DestructionEvent`
```typescript
interface DestructionEvent {
  datetime: string;
  eventType: 'Destroyed' | 'Disappeared' | 'ForbiddenZoneTimerExpired';
  vehicle: string;
  vehicleId: string;
  ownerSteamId: string;
  ownerName: string;
  location: string;
}
```

### Types de Eventos

#### `EventType`
```typescript
enum EventType {
  DESTROYED = 'Destroyed',
  DISAPPEARED = 'Disappeared',
  FORBIDDEN_ZONE_EXPIRED = 'ForbiddenZoneTimerExpired'
}
```

#### `NotificationSeverity`
```typescript
type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';
```

---

## Exemplos de Uso

### Configuração Completa do Servidor

```typescript
// Exemplo de configuração completa
const configureServer = async () => {
  try {
    // 1. Selecionar pasta do servidor
    const serverPath = await window.electronAPI.selectServerFolder();
    if (!serverPath) return;

    // 2. Carregar configurações atuais
    const currentConfig = await window.electronAPI.readServerConfig(serverPath);

    // 3. Atualizar configurações
    const updatedConfig: ServerConfig = {
      ...currentConfig,
      serverSettings: {
        ...currentConfig.serverSettings,
        serverPort: 8900,
        maxPlayers: 64,
        enableBattleye: true,
        serverName: 'Meu Servidor SCUM'
      }
    };

    // 4. Validar configurações
    const validation = await window.electronAPI.validateConfig(updatedConfig);
    if (!validation.isValid) {
      throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`);
    }

    // 5. Salvar configurações
    await window.electronAPI.saveServerConfig(serverPath, updatedConfig);

    console.log('Servidor configurado com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar servidor:', error);
  }
};
```

### Sistema de Backup Automático

```typescript
// Exemplo de sistema de backup
const backupSystem = async () => {
  try {
    // 1. Listar backups existentes
    const backups = await window.electronAPI.listBackups();
    console.log(`Encontrados ${backups.length} backups`);

    // 2. Verificar se precisa limpar backups antigos
    const oldBackups = backups.filter(backup => {
      const backupDate = new Date(backup.date);
      const daysOld = (Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 30; // Manter apenas 30 dias
    });

    // 3. Restaurar backup específico se necessário
    if (backups.length > 0) {
      const latestBackup = backups[backups.length - 1];
      console.log(`Último backup: ${latestBackup.name}`);
    }

  } catch (error) {
    console.error('Erro no sistema de backup:', error);
  }
};
```

### Monitoramento de Veículos

```typescript
// Exemplo de monitoramento de veículos
const vehicleMonitoring = async () => {
  try {
    // 1. Carregar configurações do Discord
    const webhooks = await window.electronAPI.loadDiscordWebhooks();
    
    // 2. Configurar notificações
    if (webhooks.logDestruicaoVeiculos) {
      await window.electronAPI.sendDiscordWebhookMessage(
        webhooks.logDestruicaoVeiculos,
        '🚗 Sistema de monitoramento de veículos ativado!'
      );
    }

    // 3. Monitorar eventos (isso é feito automaticamente pelo DestructionWatcher)
    console.log('Monitoramento de veículos ativo');

  } catch (error) {
    console.error('Erro no monitoramento de veículos:', error);
  }
};
```

### Gerenciamento de Logs

```typescript
// Exemplo de gerenciamento de logs
const logManagement = async () => {
  try {
    // 1. Carregar configurações do app
    const appConfig = await window.electronAPI.loadAppConfig();
    
    // 2. Verificar se a pasta de logs existe
    const logsExist = await window.electronAPI.checkPathExists(appConfig.logsPath);
    if (!logsExist) {
      console.error('Pasta de logs não encontrada:', appConfig.logsPath);
      return;
    }

    // 3. Listar arquivos de log
    const logFiles = await window.electronAPI.listDir(appConfig.logsPath);
    const vehicleLogs = logFiles.filter(file => 
      file.startsWith('vehicle_destruction_') && file.endsWith('.log')
    );

    console.log(`Encontrados ${vehicleLogs.length} arquivos de log de veículos`);

  } catch (error) {
    console.error('Erro no gerenciamento de logs:', error);
  }
};
```

### Controle do Servidor

```typescript
// Exemplo de controle do servidor
const serverControl = async () => {
  try {
    const appConfig = await window.electronAPI.loadAppConfig();
    
    // 1. Verificar status atual
    const status = await window.electronAPI.getServerStatus(appConfig.serverPath);
    console.log('Status atual:', status);

    // 2. Parar servidor se estiver rodando
    if (status === 'running') {
      console.log('Parando servidor...');
      await window.electronAPI.stopServer(appConfig.serverPath);
      
      // Aguardar parada
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 3. Iniciar servidor
    console.log('Iniciando servidor...');
    await window.electronAPI.startServer(appConfig.serverPath);

    // 4. Verificar novo status
    const newStatus = await window.electronAPI.getServerStatus(appConfig.serverPath);
    console.log('Novo status:', newStatus);

  } catch (error) {
    console.error('Erro no controle do servidor:', error);
  }
};
```

---

## Error Handling

### Padrão de Tratamento de Erros

```typescript
// Wrapper para operações da API
const safeApiCall = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

// Uso
const loadConfig = async () => {
  return await safeApiCall(
    () => window.electronAPI.readServerConfig(serverPath),
    'Erro ao carregar configurações'
  );
};
```

### Tratamento de Erros Específicos

```typescript
// Tratamento de erros específicos
const handleApiError = (error: any) => {
  if (error.message.includes('ENOENT')) {
    return 'Arquivo não encontrado';
  }
  if (error.message.includes('EACCES')) {
    return 'Permissão negada';
  }
  if (error.message.includes('ECONNREFUSED')) {
    return 'Conexão recusada';
  }
  return 'Erro desconhecido';
};

// Uso
try {
  await window.electronAPI.saveServerConfig(serverPath, config);
} catch (error) {
  const userMessage = handleApiError(error);
  console.error(userMessage);
}
```

---

## Performance

### Otimizações Recomendadas

#### Cache de Configurações
```typescript
// Cache de configurações para evitar leituras desnecessárias
const configCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCachedConfig = async (serverPath: string) => {
  const cached = configCache.get(serverPath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const config = await window.electronAPI.readServerConfig(serverPath);
  configCache.set(serverPath, { data: config, timestamp: Date.now() });
  return config;
};
```

#### Debouncing de Operações
```typescript
// Debouncing para operações frequentes
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Uso
const debouncedSave = debounce(async (config: ServerConfig) => {
  await window.electronAPI.saveServerConfig(serverPath, config);
}, 1000);
```

#### Lazy Loading
```typescript
// Lazy loading de componentes pesados
const LazyComponent = lazy(() => import('./HeavyComponent'));

const App = () => {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        Carregar Componente Pesado
      </button>
      {showHeavy && (
        <Suspense fallback={<div>Carregando...</div>}>
          <LazyComponent />
        </Suspense>
      )}
    </div>
  );
};
```

---

**Versão**: 1.0.0  
**Última Atualização**: 04/07/2025  
**Autor**: ScumServerManager Team 