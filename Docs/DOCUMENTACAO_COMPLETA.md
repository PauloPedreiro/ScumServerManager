# ScumServerManager - Documentação Completa

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Documentação do Código](#documentação-do-código)
6. [Configuração e Instalação](#configuração-e-instalação)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## Visão Geral

O **ScumServerManager** é um gerenciador completo para servidores SCUM desenvolvido em Electron/React com TypeScript. O aplicativo oferece uma interface gráfica intuitiva para gerenciar configurações de servidor, monitorar logs em tempo real, enviar notificações via Discord e automatizar tarefas administrativas.

### Características Principais
- 🎮 **Gerenciamento de Configurações**: Interface visual para configurar todos os parâmetros do servidor SCUM
- 📊 **Monitoramento em Tempo Real**: Acompanhamento de logs, status do servidor e jogadores online
- 🔔 **Notificações Discord**: Sistema automatizado de notificações para eventos importantes
- 🚗 **Monitoramento de Veículos**: Detecção automática de destruição/desaparecimento de veículos
- 👥 **Gestão de Jogadores**: Controle de usuários, permissões e estatísticas
- 💾 **Sistema de Backup**: Backup automático e restauração de configurações
- ⚙️ **Automação**: Reinicialização programada e atualizações automáticas

---

## Arquitetura do Sistema

### Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Electron + Node.js + TypeScript
- **Build**: Vite + Electron Builder
- **Persistência**: JSON files + Electron Store

### Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface do Usuário                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Dashboard     │  │   Configurações │  │   Monitor    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Renderização                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   React App     │  │   Context API   │  │   Material-UI│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Comunicação                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   IPC Bridge    │  │   Preload API   │  │   TypeScript │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Negócio                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ FileManager     │  │ BackupManager   │  │ Destruction  │ │
│  │                 │  │                 │  │ Watcher      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Sistema                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   File System   │  │   Discord API   │  │   SCUM Logs  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

```
ScumServerManager/
├── src/
│   ├── main/                          # Processo principal (Electron)
│   │   ├── index.ts                   # Ponto de entrada do main process
│   │   ├── preload.ts                 # Bridge IPC entre main e renderer
│   │   ├── fileManager.ts             # Gerenciamento de arquivos
│   │   ├── backupManager.ts           # Sistema de backup
│   │   ├── vehicleDestructionWatcher.ts # Monitor de destruição de veículos
│   │   ├── chatGlobalWatcher.ts       # Monitor de chat global
│   │   ├── adminLogWatcher.ts         # Monitor de logs admin
│   │   ├── loginWatcher.ts            # Monitor de login de jogadores
│   │   └── tsconfig.json              # Configuração TypeScript (main)
│   ├── renderer/                      # Processo de renderização (React)
│   │   ├── main.tsx                   # Ponto de entrada do React
│   │   ├── App.tsx                    # Componente principal
│   │   ├── components/                # Componentes reutilizáveis
│   │   ├── pages/                     # Páginas da aplicação
│   │   ├── contexts/                  # Context API (React)
│   │   ├── utils/                     # Utilitários
│   │   ├── types/                     # Definições de tipos
│   │   └── tsconfig.json              # Configuração TypeScript (renderer)
│   └── types/                         # Tipos compartilhados
├── assets/                            # Recursos estáticos
├── Docs/                              # Documentação
├── dist/                              # Build compilado
├── config.json                        # Configurações do aplicativo
├── discordWebhooks.json               # Webhooks do Discord
├── vehicle_destruction_offsets.json   # Controle de offset dos logs
├── processed_chat_messages.json       # Eventos de chat processados
├── admin_processed_events.json        # Eventos admin processados
├── login_processed_events.json        # Eventos de login processados
├── vehicle_processed_events.json      # Eventos de veículos processados
├── package.json                       # Dependências e scripts
└── README.md                          # Documentação inicial
```

---

## Funcionalidades Principais

### 1. Dashboard
- **Status do Servidor**: Monitoramento em tempo real do status do servidor SCUM
- **Estatísticas**: CPU, memória, jogadores online, uptime
- **Controles Rápidos**: Iniciar, parar, reiniciar servidor
- **Gráficos**: Visualização de performance e uso de recursos

### 2. Configurações do Servidor
- **Configurações Gerais**: Porta, max players, BattlEye
- **Configurações de Jogo**: Loot, economia, raids, veículos
- **Configurações de Usuários**: Permissões, whitelist, blacklist
- **Configurações de Pastas**: Caminhos do servidor, logs, backups

### 3. Monitoramento de Logs
- **Logs em Tempo Real**: Visualização instantânea dos logs do servidor
- **Filtros Avançados**: Por nível, conteúdo, período
- **Logs de Login**: Monitoramento de entrada/saída de jogadores
- **Estatísticas de Jogadores**: Histórico de logins, posições, atividade

### 4. Sistema de Notificações Discord
- **Webhooks Configuráveis**: URLs personalizáveis para diferentes eventos
- **Notificações de Veículos**: Destruição, desaparecimento, expiração
- **Notificações de Jogadores**: Novos jogadores, logins importantes
- **Configurações de Privacidade**: Opção de ocultar SteamIDs

### 5. Monitoramento de Veículos
- **Detecção Automática**: Monitoramento contínuo de logs de veículos
- **Eventos Suportados**: 
  - `[Destroyed]`: Veículo destruído
  - `[Disappeared]`: Veículo desaparecido
  - `[ForbiddenZoneTimerExpired]`: Veículo expirado em zona proibida
- **Sistema Anti-Duplicação**: Controle de eventos já processados
- **Processamento em Tempo Real**: Detecção imediata de novos eventos

### 6. Sistema de Backup
- **Backup Automático**: Antes de qualquer alteração nas configurações
- **Backup Manual**: Interface para criar backups sob demanda
- **Restauração**: Recuperação de configurações anteriores
- **Gerenciamento**: Lista, download e exclusão de backups

### 7. Sistema de Watchers e Monitoramento
- **Monitoramento em Tempo Real**: Usando Chokidar para detecção eficiente de mudanças
- **Deduplicação Inteligente**: Sistema de persistência que evita reprocessamento de eventos
- **Proteção contra Rate Limit**: Debounce e controle de frequência para evitar HTTP 429 do Discord
- **Tratamento Robusto de Erros**: Ignora arquivos temporários e lida com erros de permissão
- **Processamento Inicial Otimizado**: Apenas o arquivo de log mais recente é processado na inicialização
- **Limpeza Automática**: Remove eventos antigos dos arquivos de persistência

#### Tipos de Watchers

##### ChatGlobalWatcher
- **Monitoramento**: Arquivos `chat_*.log` para mensagens globais
- **Deduplicação**: Arquivo `processed_chat_messages.json` com IDs únicos
- **Formato Discord**: `nome: mensagem` (sem timestamp)
- **Filtros**: Apenas mensagens marcadas como `'Global: '`

##### AdminLogWatcher
- **Monitoramento**: Arquivos `admin_*.log` para comandos administrativos
- **Deduplicação**: Arquivo `admin_processed_events.json` com IDs únicos
- **Formato Discord**: Comando completo com timestamp
- **Filtros**: Todos os comandos admin são enviados

##### LoginWatcher
- **Monitoramento**: Logs de login/logout de jogadores
- **Deduplicação**: Arquivo `login_processed_events.json` com IDs únicos
- **Formato Discord**: Notificação de entrada/saída com nome do jogador
- **Filtros**: Eventos de login/logout válidos

##### VehicleDestructionWatcher
- **Monitoramento**: Logs de destruição/desaparecimento de veículos
- **Deduplicação**: Arquivo `vehicle_processed_events.json` com IDs únicos
- **Formato Discord**: Detalhes do veículo com ou sem SteamID (configurável)
- **Filtros**: Eventos `[Destroyed]`, `[Disappeared]`, `[ForbiddenZoneTimerExpired]`

#### Sistema de Deduplicação e Persistência

##### Arquivos de Persistência
```json
// processed_chat_messages.json
{
  "chat_20250704_031821_mariocs10_oi_galera": true,
  "chat_20250704_031822_joao123_boa_noite": true
}

// admin_processed_events.json
{
  "admin_20250704_031821_kick_player_123": true,
  "admin_20250704_031822_ban_player_456": true
}

// login_processed_events.json
{
  "login_20250704_031821_mariocs10_76561198140545020": true,
  "logout_20250704_031822_joao123_76561198140545021": true
}

// vehicle_processed_events.json
{
  "vehicle_20250704_031821_destroyed_car_123": true,
  "vehicle_20250704_031822_disappeared_truck_456": true
}
```

##### Limpeza Automática
- **Frequência**: A cada 24 horas
- **Critério**: Remove eventos com mais de 24 horas
- **Benefício**: Evita crescimento indefinido dos arquivos
- **Implementação**: Função `cleanupOldEvents()` em cada watcher

#### Proteção contra Rate Limit (HTTP 429)

##### Debounce e Controle de Frequência
```typescript
// Debounce de 500ms entre processamentos
await sleep(500);

// Delay de 1 segundo entre envios para Discord
await sleep(1000);
```

##### Tratamento de Erros HTTP 429
- **Detecção**: Captura de erro "Too Many Requests"
- **Ação**: Aguarda 5 segundos antes de tentar novamente
- **Log**: Registra tentativa de rate limit no console
- **Recuperação**: Continua processamento após delay

#### Tratamento Robusto de Erros

##### Erros de Arquivo Ignorados
- **Arquivos Temporários**: `.temp`, `.tmp`, `.bak`
- **Erros de Permissão**: `EPERM` (comum em network shares)
- **Arquivos Não Encontrados**: `ENOENT` (arquivo deletado durante processamento)
- **Comportamento**: Log de erro mas continua processamento

##### Tratamento de Encoding
- **Detecção**: UTF-16 vs UTF-8
- **Conversão**: Automática quando necessário
- **Fallback**: Continua processamento mesmo com erro de encoding

#### Comportamento de Inicialização

##### Processamento Inicial
1. **Identificação**: Encontra o arquivo de log mais recente
2. **Leitura**: Carrega eventos já processados do arquivo de persistência
3. **Filtragem**: Processa apenas eventos não marcados como processados
4. **Envio**: Envia apenas eventos novos para o Discord
5. **Persistência**: Salva novos eventos processados

##### Benefícios
- **Eficiência**: Não reprocessa eventos antigos
- **Controle**: Usuário pode escolher enviar todos ou apenas novos
- **Performance**: Inicialização rápida mesmo com logs grandes
- **Confiabilidade**: Não envia duplicatas após reinício

---

## Documentação do Código

### 1. Main Process (src/main/)

#### index.ts
```typescript
/**
 * Ponto de entrada do processo principal do Electron
 * Responsável por:
 * - Criar e gerenciar a janela principal
 * - Configurar handlers IPC
 * - Inicializar serviços (FileManager, BackupManager, DestructionWatcher)
 * - Gerenciar ciclo de vida da aplicação
 */

// Handlers IPC principais:
// - select-server-folder: Seleção de pasta do servidor
// - read-server-config: Leitura de configurações
// - save-server-config: Salvamento de configurações
// - send-discord-webhook-message: Envio de mensagens Discord
// - load-app-config: Carregamento de configurações do app
// - save-app-config: Salvamento de configurações do app
```

#### preload.ts
```typescript
/**
 * Bridge de segurança entre main e renderer processes
 * Expõe APIs seguras para o renderer através do contextBridge
 * 
 * APIs expostas:
 * - selectServerFolder(): Seleção de pasta do servidor
 * - readServerConfig(serverPath): Leitura de configurações
 * - saveServerConfig(serverPath, config): Salvamento de configurações
 * - sendDiscordWebhookMessage(webhookUrl, message): Envio Discord
 * - loadAppConfig(): Carregamento de config.json
 * - saveAppConfig(config): Salvamento de config.json
 * - loadServerCache(): Cache do servidor
 * - clearServerCache(): Limpeza de cache
 * - listBackups(): Lista de backups
 * - restoreBackup(): Restauração de backup
 * - validateConfig(): Validação de configurações
 * - readIniFile(): Leitura de arquivos INI
 * - saveIniFile(): Salvamento de arquivos INI
 * - readJsonFile(): Leitura de arquivos JSON
 * - saveJsonFile(): Salvamento de arquivos JSON
 * - listDir(): Listagem de diretórios
 * - checkPathExists(): Verificação de existência de caminhos
 * - getServerStatus(): Status do servidor
 * - getServerLogs(): Logs do servidor
 * - startServer(): Iniciar servidor
 * - stopServer(): Parar servidor
 * - restartServer(): Reiniciar servidor
 * - updateServerWithSteamcmd(): Atualização via SteamCMD
 * - loadRestartSchedule(): Horários de reinicialização
 * - saveRestartSchedule(): Salvamento de horários
 * - saveDiscordWebhooks(): Salvamento de webhooks
 * - loadDiscordWebhooks(): Carregamento de webhooks
 * - clearNotifiedPlayers(): Limpeza de jogadores notificados
 * - getNotifiedPlayers(): Lista de jogadores notificados
 */
```

#### fileManager.ts
```typescript
/**
 * Gerenciador central de arquivos e configurações
 * Responsável por:
 * - Leitura/escrita de arquivos INI e JSON
 * - Validação de configurações
 * - Cache de informações do servidor
 * - Comunicação com APIs externas (Discord)
 * - Gerenciamento de configurações persistentes
 */

class FileManager {
  /**
   * Lê configurações do servidor SCUM
   * @param serverPath Caminho do executável do servidor
   * @returns Configurações parseadas do servidor
   */
  async readServerConfig(serverPath: string): Promise<ServerConfig>

  /**
   * Salva configurações no servidor SCUM
   * @param serverPath Caminho do executável do servidor
   * @param config Configurações a serem salvas
   * @returns Resultado da operação
   */
  async saveServerConfig(serverPath: string, config: ServerConfig): Promise<any>

  /**
   * Envia mensagem para webhook do Discord
   * @param webhookUrl URL do webhook
   * @param message Mensagem a ser enviada
   * @returns Resultado da operação
   */
  async sendDiscordWebhookMessage(webhookUrl: string, message: string): Promise<any>

  /**
   * Carrega configurações do aplicativo (config.json)
   * @returns Configurações do aplicativo
   */
  async loadAppConfig(): Promise<AppConfig>

  /**
   * Salva configurações do aplicativo (config.json)
   * @param config Configurações a serem salvas
   */
  async saveAppConfig(config: AppConfig): Promise<void>

  /**
   * Lê arquivo INI e retorna objeto parseado
   * @param filePath Caminho do arquivo INI
   * @returns Conteúdo parseado do arquivo
   */
  async readIniFile(filePath: string): Promise<any>

  /**
   * Salva objeto como arquivo INI
   * @param filePath Caminho do arquivo INI
   * @param content Conteúdo a ser salvo
   */
  async saveIniFile(filePath: string, content: any): Promise<void>

  /**
   * Valida configurações do servidor
   * @param config Configurações a serem validadas
   * @returns Resultado da validação
   */
  async validateConfig(config: any): Promise<ValidationResult>
}
```

#### backupManager.ts
```typescript
/**
 * Gerenciador de backup e restauração
 * Responsável por:
 * - Criação automática de backups antes de alterações
 * - Restauração de configurações anteriores
 * - Gerenciamento de histórico de backups
 * - Compressão e armazenamento de backups
 */

class BackupManager {
  /**
   * Cria backup das configurações atuais
   * @param serverPath Caminho do servidor
   * @returns Informações do backup criado
   */
  async createBackup(serverPath: string): Promise<BackupInfo>

  /**
   * Lista todos os backups disponíveis
   * @param serverPath Caminho do servidor
   * @returns Lista de backups
   */
  async listBackups(serverPath: string): Promise<BackupInfo[]>

  /**
   * Restaura backup específico
   * @param serverPath Caminho do servidor
   * @param backupName Nome do backup
   * @returns Resultado da restauração
   */
  async restoreBackup(serverPath: string, backupName: string): Promise<any>

  /**
   * Remove backup específico
   * @param backupName Nome do backup
   * @returns Resultado da remoção
   */
  async deleteBackup(backupName: string): Promise<boolean>
}
```

#### vehicleDestructionWatcher.ts
```typescript
/**
 * Monitor de destruição de veículos em tempo real
 * Responsável por:
 * - Monitoramento contínuo de logs de veículos usando Chokidar
 * - Detecção de eventos de destruição/desaparecimento
 * - Envio automático de notificações Discord com proteção contra rate limit
 * - Sistema de deduplicação com persistência em arquivos JSON
 * - Tratamento robusto de erros (EPERM, ENOENT, arquivos temporários)
 * - Processamento inicial inteligente (apenas arquivo mais recente)
 * - Limpeza automática de eventos antigos para evitar crescimento indefinido
 */

/**
 * Inicia o monitoramento de destruição de veículos
 * @param fileManager Instância do FileManager para operações de arquivo
 */
export async function startVehicleDestructionWatcher(fileManager: FileManager): Promise<void>

/**
 * Processa linha de log de destruição de veículo
 * @param line Linha do log a ser processada
 * @returns Dados extraídos do evento ou null se não for evento válido
 */
function parseDestructionLine(line: string): DestructionEvent | null

/**
 * Processa arquivo de log específico com deduplicação
 * @param logFileName Nome do arquivo de log
 * @param webhookUrl URL do webhook Discord
 */
async function processFile(logFileName: string, webhookUrl: string): Promise<void>

/**
 * Gera ID único para evento baseado em dados do evento
 * @param data Dados do evento
 * @returns ID único do evento
 */
function generateEventId(data: DestructionEvent): string

/**
 * Converte encoding UTF-16 para UTF-8
 * @param text Texto a ser convertido
 * @returns Texto convertido
 */
function convertUtf16ToUtf8(text: string): string

/**
 * Lê eventos processados salvos em arquivo JSON
 * @returns Objeto com eventos processados por ID
 */
async function readProcessedEvents(): Promise<Record<string, boolean>>

/**
 * Salva eventos processados em arquivo JSON
 * @param processedEvents Eventos processados a serem salvos
 */
async function writeProcessedEvents(processedEvents: Record<string, boolean>): Promise<void>

/**
 * Limpa eventos antigos (mais de 24 horas) do arquivo de persistência
 * @param processedEvents Eventos processados atuais
 * @returns Eventos processados limpos
 */
function cleanupOldEvents(processedEvents: Record<string, boolean>): Record<string, boolean>

/**
 * Aguarda por tempo específico (usado para debounce)
 * @param ms Milissegundos para aguardar
 */
function sleep(ms: number): Promise<void>
```

### 2. Renderer Process (src/renderer/)

#### App.tsx
```typescript
/**
 * Componente principal da aplicação
 * Responsável por:
 * - Roteamento entre páginas
 * - Gerenciamento de estado global
 * - Configuração de providers
 * - Layout principal da aplicação
 */

// Estrutura de navegação:
// - Dashboard: Página principal com status do servidor
// - ServerSettings: Configurações gerais do servidor
// - GameSettings: Configurações de jogo
// - EconomySettings: Configurações de economia
// - RaidSettings: Configurações de raids
// - LootSettings: Configurações de loot
// - UserManagement: Gerenciamento de usuários
// - FolderSettings: Configurações de pastas
// - LogsMonitoring: Monitoramento de logs
// - BackupRestore: Sistema de backup
// - Discord: Configurações do Discord
```

#### Contexts

##### ServerConfigContext.tsx
```typescript
/**
 * Contexto para gerenciamento de configurações do servidor
 * Fornece:
 * - Estado das configurações atuais
 * - Funções para carregar/salvar configurações
 * - Cache de informações do servidor
 * - Validação de configurações
 * - Gerenciamento de caminhos de arquivos
 */

interface ServerConfigContextType {
  config: ServerConfig | null
  serverPath: string | null
  serverCache: ServerCache | null
  loading: boolean
  error: string | null
  logsPath: string
  setServerPath: (path: string | null) => void
  setLogsPath: (path: string) => void
  loadConfig: () => Promise<void>
  saveConfig: (config: Partial<ServerConfig>) => Promise<void>
  validateConfig: (config: any) => Promise<ValidationResult>
  loadServerCache: () => Promise<void>
  clearServerCache: () => Promise<void>
}
```

##### PlayerStatsContext.tsx
```typescript
/**
 * Contexto para estatísticas de jogadores
 * Fornece:
 * - Lista de jogadores processados
 * - Estatísticas de login/logout
 * - Posições dos jogadores
 * - Histórico de atividade
 */

interface PlayerStatsContextType {
  playerStats: PlayerStats[]
  setPlayerStats: (stats: PlayerStats[]) => void
  updatePlayerStats: (newStats: PlayerStats[]) => void
  clearPlayerStats: () => void
}
```

#### Pages

##### Dashboard.tsx
```typescript
/**
 * Página principal com visão geral do servidor
 * Funcionalidades:
 * - Status em tempo real do servidor
 * - Estatísticas de performance
 * - Controles rápidos (start/stop/restart)
 * - Gráficos de uso de recursos
 * - Informações de jogadores online
 */
```

##### ServerSettings.tsx
```typescript
/**
 * Página de configurações gerais do servidor
 * Funcionalidades:
 * - Configuração de porta e max players
 * - Configuração do BattlEye
 * - Configurações de performance
 * - Configurações de rede
 */
```

##### GameSettings.tsx
```typescript
/**
 * Página de configurações de jogo
 * Funcionalidades:
 * - Configurações de loot
 * - Configurações de veículos
 * - Configurações de zumbis
 * - Configurações de clima
 * - Configurações de crafting
 */
```

##### EconomySettings.tsx
```typescript
/**
 * Página de configurações de economia
 * Funcionalidades:
 * - Configurações de traders
 * - Preços de itens
 * - Configurações de moeda
 * - Configurações de mercado
 */
```

##### RaidSettings.tsx
```typescript
/**
 * Página de configurações de raids
 * Funcionalidades:
 * - Horários de raid
 * - Configurações de proteção
 * - Configurações de dano
 * - Configurações de explosivos
 */
```

##### LootSettings.tsx
```typescript
/**
 * Página de configurações de loot
 * Funcionalidades:
 * - Configurações de spawn de itens
 * - Probabilidades de loot
 * - Configurações de respawn
 * - Configurações de qualidade
 */
```

##### UserManagement.tsx
```typescript
/**
 * Página de gerenciamento de usuários
 * Funcionalidades:
 * - Lista de usuários
 * - Configuração de permissões
 * - Whitelist/Blacklist
 * - Configurações de admin
 */
```

##### FolderSettings.tsx
```typescript
/**
 * Página de configurações de pastas
 * Funcionalidades:
 * - Configuração de caminhos do servidor
 * - Configuração de pasta de logs
 * - Configuração de pasta de backups
 * - Validação de caminhos
 */
```

##### LogsMonitoring.tsx
```typescript
/**
 * Página de monitoramento de logs
 * Funcionalidades:
 * - Visualização de logs em tempo real
 * - Filtros por nível e conteúdo
 * - Logs de login de jogadores
 * - Estatísticas de atividade
 * - Download de logs
 */
```

##### BackupRestore.tsx
```typescript
/**
 * Página de backup e restauração
 * Funcionalidades:
 * - Lista de backups disponíveis
 * - Criação de backup manual
 * - Restauração de backup
 * - Download de backups
 * - Exclusão de backups
 */
```

##### Discord.tsx
```typescript
/**
 * Página de configurações do Discord
 * Funcionalidades:
 * - Configuração de webhooks
 * - Teste de webhooks
 * - Configurações de notificações
 * - Gerenciamento de jogadores notificados
 * - Configurações de privacidade
 */
```

#### Utils

##### playerUtils.ts
```typescript
/**
 * Utilitários para processamento de dados de jogadores
 * Funções:
 * - fetchPlayersFromLogs: Extrai dados de jogadores dos logs
 * - processLoginEvents: Processa eventos de login/logout
 * - updatePlayersJson: Atualiza arquivo JSON de jogadores
 * - parsePlayerData: Parseia dados de jogadores
 */

/**
 * Extrai dados de jogadores dos logs de login
 * @param logsPath Caminho da pasta de logs
 * @param windowElectronAPI API do Electron
 * @param setPlayersList Função para atualizar lista de jogadores
 * @param showNotification Função para mostrar notificações
 * @returns Array de dados de jogadores
 */
export async function fetchPlayersFromLogs(
  logsPath: string, 
  windowElectronAPI: any, 
  setPlayersList?: (players: any[]) => void, 
  showNotification?: (msg: string, sev?: string) => void
): Promise<PlayerData[]>
```

---

## Configuração e Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- SCUM Server instalado
- Discord (opcional, para notificações)

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd ScumServerManager
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Distribuição
npm run dist
```

### Configuração Inicial

1. **config.json** - Configurações principais
```json
{
  "lastServerPath": "C:\\Servers\\scum\\SCUM\\Binaries\\Win64",
  "steamcmdPath": "C:\\Servers\\steamcmd\\steamcmd.exe",
  "serverPath": "C:\\Servers\\scum\\SCUM\\Binaries\\Win64\\SCUMServer.exe",
  "installPath": "C:\\Servers\\scum",
  "iniConfigPath": "C:\\Servers\\scum\\SCUM\\Saved\\Config\\WindowsServer",
  "logsPath": "\\\\192.168.100.15\\Servers\\Scum\\SCUM\\Saved\\SaveFiles\\Logs",
  "serverPort": 8900,
  "maxPlayers": 64,
  "enableBattleye": true,
  "hideVehicleOwnerSteamId": true
}
```

2. **discordWebhooks.json** - Webhooks do Discord
```json
{
  "logNovosPlayers": "https://discord.com/api/webhooks/...",
  "logDestruicaoVeiculos": "https://discord.com/api/webhooks/...",
  "logChatGlobal": "https://discord.com/api/webhooks/...",
  "logAdmin": "https://discord.com/api/webhooks/...",
  "logLogin": "https://discord.com/api/webhooks/..."
}
```

3. **Arquivos de Persistência** - Controle de eventos processados
```json
// processed_chat_messages.json - Evita duplicação de mensagens de chat
{
  "chat_20250704_031821_mariocs10_oi_galera": true
}

// admin_processed_events.json - Evita duplicação de comandos admin
{
  "admin_20250704_031821_kick_player_123": true
}

// login_processed_events.json - Evita duplicação de eventos de login
{
  "login_20250704_031821_mariocs10_76561198140545020": true
}

// vehicle_processed_events.json - Evita duplicação de eventos de veículos
{
  "vehicle_20250704_031821_destroyed_car_123": true
}
```

### Configuração do Servidor SCUM

1. **Habilite logs de veículos** no arquivo `Game.ini`:
```ini
[/Script/Scum.ScumGameMode]
LogVehicleDestroyed=True
```

2. **Configure o caminho dos logs** no aplicativo
3. **Configure os webhooks do Discord** (opcional)
4. **Teste as notificações** destruindo um veículo no jogo

### Tipos de Logs Monitorados

#### Logs de Veículos
- **Arquivo**: `vehicle_destruction_*.log`
- **Eventos**: `[Destroyed]`, `[Disappeared]`, `[ForbiddenZoneTimerExpired]`
- **Configuração**: `LogVehicleDestroyed=True` no `Game.ini`

#### Logs de Chat
- **Arquivo**: `chat_*.log`
- **Eventos**: Mensagens globais marcadas como `'Global: '`
- **Formato**: `nome: mensagem` (sem timestamp)

#### Logs Admin
- **Arquivo**: `admin_*.log`
- **Eventos**: Comandos administrativos e ações de admin
- **Formato**: Comando completo com timestamp

#### Logs de Login
- **Arquivo**: Logs de login/logout de jogadores
- **Eventos**: Entrada e saída de jogadores
- **Formato**: Notificação com nome do jogador

---

## Troubleshooting

### Problemas Comuns

#### 1. DestructionWatcher não detecta eventos
**Sintomas**: Veículos destruídos não geram notificações Discord

**Soluções**:
- Verifique se `LogVehicleDestroyed=True` está no `Game.ini`
- Confirme se o caminho dos logs está correto
- Verifique se o webhook do Discord está configurado
- Reinicie o aplicativo para recarregar o watcher

#### 2. Erro de permissão de arquivo
**Sintomas**: Erro ao ler/escrever arquivos de configuração

**Soluções**:
- Execute o aplicativo como administrador
- Verifique permissões da pasta do servidor
- Confirme se os caminhos estão corretos

#### 3. Webhook Discord não funciona
**Sintomas**: Notificações não chegam no Discord

**Soluções**:
- Verifique se a URL do webhook está correta
- Teste o webhook usando o botão "Testar Webhook"
- Confirme se o canal tem permissões para receber webhooks

#### 4. Aplicativo não inicia
**Sintomas**: Erro ao executar `npm run dev`

**Soluções**:
- Verifique se Node.js está instalado corretamente
- Delete `node_modules` e execute `npm install` novamente
- Verifique se todas as dependências estão instaladas

#### 5. Logs não aparecem em tempo real
**Sintomas**: Logs não são atualizados automaticamente

**Soluções**:
- Verifique se o caminho dos logs está correto
- Confirme se o servidor está gerando logs
- Reinicie o aplicativo

#### 6. Mensagens duplicadas no Discord
**Sintomas**: Mesmo evento é enviado múltiplas vezes

**Soluções**:
- Verifique se os arquivos de persistência não foram corrompidos
- Delete os arquivos `*_processed_events.json` para reprocessar
- Confirme se não há múltiplas instâncias do aplicativo rodando
- Verifique se o sistema de deduplicação está funcionando

#### 7. Rate limit do Discord (HTTP 429)
**Sintomas**: Erro "Too Many Requests" no console

**Soluções**:
- O sistema automaticamente aguarda 5 segundos e tenta novamente
- Verifique se não há flood de eventos sendo gerado
- Confirme se o debounce está funcionando (500ms entre processamentos)
- Considere aumentar o delay entre envios se necessário

#### 8. Erro EPERM em network shares
**Sintomas**: Erro "operation not permitted" ao acessar arquivos

**Soluções**:
- Este erro é comum em network shares e é tratado automaticamente
- O sistema ignora arquivos temporários (`.temp`, `.tmp`, `.bak`)
- Verifique se a conexão de rede está estável
- Considere usar caminho local se possível

#### 9. Arquivos de persistência muito grandes
**Sintomas**: Arquivos `*_processed_events.json` crescem indefinidamente

**Soluções**:
- O sistema automaticamente limpa eventos com mais de 24 horas
- Se necessário, delete manualmente os arquivos de persistência
- Verifique se a limpeza automática está funcionando
- Monitore o tamanho dos arquivos periodicamente

#### 10. Watcher não detecta mudanças em network shares
**Sintomas**: Mudanças em arquivos de rede não são detectadas

**Soluções**:
- O Chokidar pode ter limitações com network shares
- Verifique se a conexão de rede está estável
- Considere usar caminho local se possível
- Reinicie o aplicativo para recarregar o watcher

### Logs de Debug

Para habilitar logs detalhados, adicione no `config.json`:
```json
{
  "debug": true,
  "logLevel": "verbose"
}
```

### Verificação de Status

1. **Status do Servidor**: Dashboard mostra se o servidor está rodando
2. **Status do Watcher**: Logs do console mostram atividade do DestructionWatcher
3. **Status do Discord**: Teste webhook na página Discord
4. **Status dos Logs**: Página de monitoramento mostra logs em tempo real

---

## API Reference

### IPC Handlers (Main Process)

#### Configurações do Servidor
```typescript
// Seleção de pasta do servidor
ipcMain.handle('select-server-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Selecionar pasta do servidor SCUM'
  });
  return result.canceled ? null : result.filePaths[0];
});

// Leitura de configurações
ipcMain.handle('read-server-config', async (event, serverPath: string) => {
  return await fileManager.readServerConfig(serverPath);
});

// Salvamento de configurações
ipcMain.handle('save-server-config', async (event, serverPath: string, config: any) => {
  await backupManager.createBackup(serverPath);
  return await fileManager.saveServerConfig(serverPath, config);
});
```

#### Sistema de Backup
```typescript
// Listar backups
ipcMain.handle('list-backups', async (event, serverPath: string) => {
  return await backupManager.listBackups(serverPath);
});

// Restaurar backup
ipcMain.handle('restore-backup', async (event, serverPath: string, backupName: string) => {
  return await backupManager.restoreBackup(serverPath, backupName);
});
```

#### Operações de Arquivo
```typescript
// Ler arquivo INI
ipcMain.handle('read-ini-file', async (event, filePath: string) => {
  return await fileManager.readIniFile(filePath);
});

// Salvar arquivo INI
ipcMain.handle('save-ini-file', async (event, filePath: string, content: any) => {
  return await fileManager.saveIniFile(filePath, content);
});

// Ler arquivo JSON
ipcMain.handle('read-json-file', async (event, filePath: string) => {
  return await fileManager.readJsonFile(filePath);
});

// Salvar arquivo JSON
ipcMain.handle('save-json-file', async (event, filePath: string, content: any) => {
  return await fileManager.saveJsonFile(filePath, content);
});
```

#### Controle do Servidor
```typescript
// Status do servidor
ipcMain.handle('get-server-status', async (event, serverPath: string) => {
  return await fileManager.getServerStatus(serverPath);
});

// Iniciar servidor
ipcMain.handle('start-server', async (event, serverPath: string) => {
  return await fileManager.startServer(serverPath);
});

// Parar servidor
ipcMain.handle('stop-server', async (event, serverPath: string) => {
  return await fileManager.stopServer(serverPath);
});

// Reiniciar servidor
ipcMain.handle('restart-server', async (event, serverPath: string) => {
  return await fileManager.restartServer(serverPath);
});
```

#### Discord
```typescript
// Enviar mensagem Discord
ipcMain.handle('send-discord-webhook-message', async (event, webhookUrl: string, message: string) => {
  return await fileManager.sendDiscordWebhookMessage(webhookUrl, message);
});

// Salvar webhooks
ipcMain.handle('save-discord-webhooks', async (event, webhooks: any) => {
  return await fileManager.saveDiscordWebhooks(webhooks);
});

// Carregar webhooks
ipcMain.handle('load-discord-webhooks', async () => {
  return await fileManager.loadDiscordWebhooks();
});
```

### Tipos TypeScript

#### ServerConfig
```typescript
interface ServerConfig {
  serverSettings: {
    serverPort: number
    maxPlayers: number
    enableBattleye: boolean
    serverName: string
    serverPassword: string
    adminPassword: string
  }
  gameSettings: {
    lootSettings: any
    vehicleSettings: any
    zombieSettings: any
    weatherSettings: any
  }
  economyConfig: {
    traderSettings: any
    itemPrices: any
    currencySettings: any
  }
  raidTimes: Array<{
    day: string
    startTime: string
    endTime: string
  }>
  users: {
    admins: string[]
    whitelist: string[]
    blacklist: string[]
  }
}
```

#### AppConfig
```typescript
interface AppConfig {
  lastServerPath: string
  steamcmdPath: string
  serverPath: string
  installPath: string
  iniConfigPath: string
  logsPath: string
  serverPort: number
  maxPlayers: number
  enableBattleye: boolean
  hideVehicleOwnerSteamId: boolean
}
```

#### DestructionEvent
```typescript
interface DestructionEvent {
  datetime: string
  eventType: 'Destroyed' | 'Disappeared' | 'ForbiddenZoneTimerExpired'
  vehicle: string
  vehicleId: string
  ownerSteamId: string
  ownerName: string
  location: string
}
```

#### PlayerStats
```typescript
interface PlayerStats {
  name: string
  steamId: string
  timestamp: string
  lastLogin: string
  totalLogins: number
  lastPosition?: {
    x: string
    y: string
    z: string
  }
}
```

---

## Contribuição

### Como Contribuir

1. **Fork o repositório**
2. **Crie uma branch** para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit suas mudanças** (`git commit -am 'Adiciona nova funcionalidade'`)
4. **Push para a branch** (`git push origin feature/nova-funcionalidade`)
5. **Crie um Pull Request**

### Padrões de Código

- **TypeScript**: Use TypeScript para todo o código
- **ESLint**: Siga as regras do ESLint configurado
- **Prettier**: Use Prettier para formatação
- **Commits**: Use mensagens descritivas em português
- **Documentação**: Documente novas funcionalidades

### Estrutura de Commits

```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

---

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação
- Verifique a seção de troubleshooting

---

**Versão da Documentação**: 1.0.0  
**Última Atualização**: 04/07/2025  
**Autor**: ScumServerManager Team 