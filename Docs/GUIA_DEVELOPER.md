# ScumServerManager - Guia do Desenvolvedor

## Índice
1. [Setup do Ambiente](#setup-do-ambiente)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Padrões de Código](#padrões-de-código)
4. [Debugging](#debugging)
5. [Testes](#testes)
6. [Build e Deploy](#build-e-deploy)
7. [Contribuição](#contribuição)
8. [Troubleshooting](#troubleshooting)

---

## Setup do Ambiente

### Pré-requisitos

- **Node.js**: 18.0.0 ou superior
- **npm**: 9.0.0 ou superior
- **Git**: Para controle de versão
- **Editor**: VS Code recomendado (com extensões)

### Extensões VS Code Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-react-native"
  ]
}
```

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

3. **Configure o ambiente de desenvolvimento**
```bash
# Copie o arquivo de configuração de exemplo
cp config.example.json config.json

# Edite as configurações
code config.json
```

4. **Verifique a instalação**
```bash
npm run dev
```

### Scripts Disponíveis

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "set NODE_ENV=development && tsc -p src/main/tsconfig.json && electron dist/main/index.js",
    "dev:renderer": "vite",
    "build": "npm run build:main && npm run build:renderer",
    "build:main": "tsc -p src/main/tsconfig.json",
    "build:renderer": "vite build",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "lint": "eslint src/**/*.{ts,tsx} --ext .ts,.tsx",
    "lint:fix": "eslint src/**/*.{ts,tsx} --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Estrutura do Projeto

### Organização de Arquivos

```
src/
├── main/                    # Processo principal (Electron)
│   ├── index.ts            # Ponto de entrada
│   ├── preload.ts          # Bridge IPC
│   ├── fileManager.ts      # Gerenciamento de arquivos
│   ├── backupManager.ts    # Sistema de backup
│   ├── vehicleDestructionWatcher.ts # Monitor de veículos
│   └── tsconfig.json       # Config TypeScript (main)
├── renderer/               # Processo de renderização (React)
│   ├── main.tsx           # Ponto de entrada React
│   ├── App.tsx            # Componente principal
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Navigation.tsx
│   │   └── ServerTopFields.tsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── ServerSettings.tsx
│   │   ├── GameSettings.tsx
│   │   ├── EconomySettings.tsx
│   │   ├── RaidSettings.tsx
│   │   ├── LootSettings.tsx
│   │   ├── UserManagement.tsx
│   │   ├── FolderSettings.tsx
│   │   ├── LogsMonitoring.tsx
│   │   ├── BackupRestore.tsx
│   │   └── Discord.tsx
│   ├── contexts/          # Context API
│   │   ├── ServerConfigContext.tsx
│   │   └── PlayerStatsContext.tsx
│   ├── utils/             # Utilitários
│   │   └── playerUtils.ts
│   ├── types/             # Definições de tipos
│   │   └── electron.d.ts
│   ├── locales/           # Internacionalização
│   │   └── ptBR.ts
│   └── tsconfig.json      # Config TypeScript (renderer)
└── types/                 # Tipos compartilhados
    └── electron.d.ts
```

### Convenções de Nomenclatura

#### Arquivos e Pastas
- **PascalCase**: Componentes React, Classes
- **camelCase**: Funções, variáveis, arquivos utilitários
- **kebab-case**: Arquivos de configuração, CSS
- **UPPER_SNAKE_CASE**: Constantes

#### Exemplos
```
✅ Correto:
- ServerSettings.tsx
- fileManager.ts
- vehicle-destruction-watcher.ts
- API_ENDPOINTS.ts

❌ Incorreto:
- server-settings.tsx
- FileManager.ts
- vehicleDestructionWatcher.ts
- apiEndpoints.ts
```

#### Componentes React
```typescript
// ✅ Correto
interface ServerSettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ServerSettings: React.FC<ServerSettingsProps> = ({ showNotification }) => {
  // Component implementation
};

export default ServerSettings;
```

#### Funções e Variáveis
```typescript
// ✅ Correto
const loadServerConfig = async (serverPath: string): Promise<ServerConfig> => {
  // Implementation
};

const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
const isProcessing = useRef<boolean>(false);
```

---

## Padrões de Código

### 1. TypeScript

#### Configuração
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  }
}
```

#### Tipos e Interfaces
```typescript
// ✅ Correto - Interfaces para objetos
interface ServerConfig {
  serverSettings: ServerSettings;
  gameSettings: GameSettings;
  economyConfig: EconomyConfig;
  raidTimes: RaidTime[];
  users: UserConfig;
}

// ✅ Correto - Types para unions e primitivos
type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping';
type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

// ✅ Correto - Enums para valores constantes
enum EventType {
  DESTROYED = 'Destroyed',
  DISAPPEARED = 'Disappeared',
  FORBIDDEN_ZONE_EXPIRED = 'ForbiddenZoneTimerExpired'
}
```

#### Generics
```typescript
// ✅ Correto - Uso de generics
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const fetchData = async <T>(url: string): Promise<ApiResponse<T>> => {
  // Implementation
};
```

### 2. React

#### Hooks
```typescript
// ✅ Correto - Custom hooks
const useServerConfig = () => {
  const context = useContext(ServerConfigContext);
  if (!context) {
    throw new Error('useServerConfig must be used within a ServerConfigProvider');
  }
  return context;
};

// ✅ Correto - useEffect com dependências
useEffect(() => {
  if (serverPath && autoRefresh) {
    const interval = setInterval(() => {
      loadServerStatus();
      loadLogs();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }
}, [serverPath, autoRefresh, refreshInterval]);
```

#### Componentes Funcionais
```typescript
// ✅ Correto - Componente funcional com TypeScript
interface ComponentProps {
  title: string;
  onSave: (data: any) => Promise<void>;
  loading?: boolean;
}

const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  onSave, 
  loading = false 
}) => {
  const [data, setData] = useState<any>(null);

  const handleSave = async () => {
    try {
      await onSave(data);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
};
```

### 3. Electron

#### IPC Communication
```typescript
// ✅ Correto - Main process handler
ipcMain.handle('read-server-config', async (event, serverPath: string) => {
  try {
    return await fileManager.readServerConfig(serverPath);
  } catch (error) {
    console.error('Error reading server config:', error);
    throw error;
  }
});

// ✅ Correto - Preload script
contextBridge.exposeInMainWorld('electronAPI', {
  readServerConfig: (serverPath: string) => 
    ipcRenderer.invoke('read-server-config', serverPath),
});

// ✅ Correto - Renderer process
const config = await window.electronAPI.readServerConfig(serverPath);
```

#### Error Handling
```typescript
// ✅ Correto - Error handling robusto
const safeOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Operation failed:', error);
    throw new Error(`Operation failed: ${error.message}`);
  }
};
```

### 4. Material-UI

#### Componentes
```typescript
// ✅ Correto - Uso consistente de Material-UI
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert 
} from '@mui/material';

const MyComponent: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Título
      </Typography>
      <TextField
        fullWidth
        label="Campo"
        margin="normal"
        variant="outlined"
      />
      <Button variant="contained" color="primary">
        Ação
      </Button>
    </Box>
  );
};
```

#### Styling
```typescript
// ✅ Correto - Uso do sistema de styling do MUI
const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  button: {
    marginTop: theme.spacing(2),
  },
}));

// Ou usando sx prop (recomendado)
<Box sx={{ 
  p: 2, 
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 1 
}}>
```

---

## Debugging

### 1. Debugging do Main Process

#### Configuração VS Code
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/main/index.js",
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

#### Logs Estruturados
```typescript
// ✅ Correto - Logs estruturados
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
    }
  }
};

// Uso
logger.info('Server config loaded', { serverPath, configKeys: Object.keys(config) });
logger.error('Failed to save config', error);
```

### 2. Debugging do Renderer Process

#### React DevTools
```bash
# Instalar React DevTools
npm install -g react-devtools

# Executar em terminal separado
react-devtools
```

#### Debugging no Browser
```typescript
// ✅ Correto - Debugging condicional
const DEBUG = process.env.NODE_ENV === 'development';

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Uso
debugLog('Component rendered', { props, state });
```

### 3. Debugging de IPC

#### Logs de Comunicação
```typescript
// ✅ Correto - Logging de IPC
ipcMain.handle('read-server-config', async (event, serverPath: string) => {
  console.log(`[IPC] read-server-config called with:`, serverPath);
  try {
    const result = await fileManager.readServerConfig(serverPath);
    console.log(`[IPC] read-server-config success:`, result);
    return result;
  } catch (error) {
    console.error(`[IPC] read-server-config error:`, error);
    throw error;
  }
});
```

### 4. Debugging de Performance

#### Performance Monitoring
```typescript
// ✅ Correto - Monitoramento de performance
const measurePerformance = async <T>(
  name: string, 
  operation: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const end = performance.now();
    console.log(`[PERF] ${name} took ${end - start}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[PERF] ${name} failed after ${end - start}ms:`, error);
    throw error;
  }
};

// Uso
const config = await measurePerformance('loadConfig', () => 
  fileManager.readServerConfig(serverPath)
);
```

---

## Testes

### 1. Configuração do Jest

#### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 2. Testes Unitários

#### Exemplo de Teste
```typescript
// fileManager.test.ts
import { FileManager } from '../fileManager';

describe('FileManager', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager();
  });

  describe('readServerConfig', () => {
    it('should read server config successfully', async () => {
      const mockServerPath = '/mock/server/path';
      const mockConfig = {
        serverSettings: { port: 8900, maxPlayers: 64 },
        gameSettings: {},
        economyConfig: {},
        raidTimes: [],
        users: {}
      };

      // Mock fs-extra
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockConfig));

      const result = await fileManager.readServerConfig(mockServerPath);

      expect(result).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('server_config.json'),
        'utf8'
      );
    });

    it('should throw error when config file not found', async () => {
      const mockServerPath = '/invalid/path';

      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

      await expect(fileManager.readServerConfig(mockServerPath))
        .rejects
        .toThrow('File not found');
    });
  });
});
```

### 3. Testes de Integração

#### Exemplo de Teste de IPC
```typescript
// ipc.test.ts
import { ipcMain } from 'electron';

describe('IPC Communication', () => {
  beforeEach(() => {
    // Setup IPC handlers
    require('../main/index');
  });

  it('should handle read-server-config correctly', async () => {
    const mockServerPath = '/mock/server/path';
    const mockConfig = { serverSettings: { port: 8900 } };

    // Mock the handler
    jest.spyOn(fileManager, 'readServerConfig').mockResolvedValue(mockConfig);

    // Simulate IPC call
    const result = await ipcMain.handle('read-server-config', null, mockServerPath);

    expect(result).toEqual(mockConfig);
    expect(fileManager.readServerConfig).toHaveBeenCalledWith(mockServerPath);
  });
});
```

### 4. Testes de Componentes React

#### Exemplo com React Testing Library
```typescript
// ServerSettings.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServerConfigProvider } from '../contexts/ServerConfigContext';
import ServerSettings from '../pages/ServerSettings';

const mockShowNotification = jest.fn();

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ServerConfigProvider>
      {component}
    </ServerConfigProvider>
  );
};

describe('ServerSettings', () => {
  beforeEach(() => {
    mockShowNotification.mockClear();
  });

  it('should render server settings form', () => {
    renderWithProvider(<ServerSettings showNotification={mockShowNotification} />);

    expect(screen.getByLabelText(/porta do servidor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/máximo de jogadores/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('should save configuration when form is submitted', async () => {
    renderWithProvider(<ServerSettings showNotification={mockShowNotification} />);

    const portInput = screen.getByLabelText(/porta do servidor/i);
    const saveButton = screen.getByRole('button', { name: /salvar/i });

    fireEvent.change(portInput, { target: { value: '8900' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Configurações salvas com sucesso!',
        'success'
      );
    });
  });
});
```

---

## Build e Deploy

### 1. Build de Desenvolvimento

```bash
# Build completo
npm run build

# Build apenas main process
npm run build:main

# Build apenas renderer process
npm run build:renderer
```

### 2. Build de Produção

```bash
# Build para distribuição
npm run dist

# Build específico para Windows
npm run dist:win
```

### 3. Configuração do Electron Builder

#### package.json
```json
{
  "build": {
    "appId": "com.scumservermanager.app",
    "productName": "Scum Server Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/main/**/*",
      "dist/renderer/**/*",
      "node_modules/**/*",
      "config.json",
      "discordWebhooks.json"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### 4. Otimizações de Build

#### Vite Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material'],
  },
});
```

---

## Contribuição

### 1. Fluxo de Trabalho

```bash
# 1. Crie uma branch para sua feature
git checkout -b feature/nova-funcionalidade

# 2. Faça suas alterações
# ... código ...

# 3. Execute os testes
npm test

# 4. Verifique o linting
npm run lint

# 5. Commit suas alterações
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 6. Push para o repositório
git push origin feature/nova-funcionalidade

# 7. Crie um Pull Request
```

### 2. Padrões de Commit

#### Conventional Commits
```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

#### Exemplos
```bash
git commit -m "feat: adiciona monitoramento de veículos em tempo real"
git commit -m "fix: corrige problema de offset em logs de destruição"
git commit -m "docs: atualiza documentação do DestructionWatcher"
git commit -m "style: formata código do FileManager"
git commit -m "refactor: extrai lógica de parsing para função separada"
git commit -m "test: adiciona testes para BackupManager"
git commit -m "chore: atualiza dependências do projeto"
```

### 3. Code Review

#### Checklist
- [ ] Código segue os padrões estabelecidos
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Linting passa sem erros
- [ ] Build funciona corretamente
- [ ] Funcionalidade foi testada manualmente

#### Template de Pull Request
```markdown
## Descrição
Breve descrição das alterações realizadas.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Testes
- [ ] Testes unitários passam
- [ ] Testes de integração passam
- [ ] Testado manualmente

## Checklist
- [ ] Código segue os padrões
- [ ] Self-review realizado
- [ ] Documentação atualizada
- [ ] Commits seguem conventional commits

## Screenshots (se aplicável)
Adicione screenshots das mudanças visuais.
```

---

## Troubleshooting

### 1. Problemas Comuns

#### Erro de Build
```bash
# Limpe o cache
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

#### Erro de TypeScript
```bash
# Verifique tipos
npm run type-check

# Corrija automaticamente
npm run lint:fix
```

#### Erro de Electron
```bash
# Reinstale dependências do Electron
npm run postinstall

# Limpe cache do Electron
rm -rf ~/.electron
```

### 2. Debugging Avançado

#### Logs Detalhados
```typescript
// Habilite logs detalhados
const DEBUG_MODE = process.env.DEBUG === 'true';

const debugLog = (category: string, message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[${category}] ${new Date().toISOString()}: ${message}`, data || '');
  }
};

// Uso
debugLog('FileManager', 'Reading config file', { path: serverPath });
debugLog('DestructionWatcher', 'Processing event', { eventId, vehicleId });
```

#### Performance Profiling
```typescript
// Profiling de performance
const profile = (name: string) => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    console.log(`[PROFILE] ${name}: ${end - start}ms`);
  };
};

// Uso
const endProfile = profile('loadServerConfig');
const config = await fileManager.readServerConfig(serverPath);
endProfile();
```

### 3. Problemas Específicos

#### Problema: DestructionWatcher não detecta eventos
```typescript
// Verifique se o watcher está funcionando
console.log('[DestructionWatcher] Iniciando watcher para:', logsPath);

// Adicione logs detalhados
const watcher = fs.watch(logsPath, { recursive: false }, async (eventType, filename) => {
  console.log(`[DestructionWatcher] Evento detectado: ${eventType} - ${filename}`);
  // ... resto do código
});
```

#### Problema: IPC não funciona
```typescript
// Verifique se o preload está correto
contextBridge.exposeInMainWorld('electronAPI', {
  readServerConfig: (serverPath: string) => {
    console.log('[Preload] readServerConfig called with:', serverPath);
    return ipcRenderer.invoke('read-server-config', serverPath);
  },
});

// Verifique se o handler está registrado
ipcMain.handle('read-server-config', async (event, serverPath: string) => {
  console.log('[Main] read-server-config handler called with:', serverPath);
  // ... resto do código
});
```

#### Problema: Build falha
```bash
# Verifique versões das dependências
npm ls

# Atualize dependências
npm update

# Limpe cache
npm cache clean --force

# Reinstale
rm -rf node_modules package-lock.json
npm install
```

---

## Recursos Adicionais

### 1. Documentação Externa
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Material-UI Documentation](https://mui.com/getting-started)

### 2. Ferramentas Úteis
- [Electron DevTools Extension](https://github.com/electron/electron-devtools-installer)
- [React DevTools](https://github.com/facebook/react-devtools)
- [TypeScript Playground](https://www.typescriptlang.org/play)

### 3. Comunidade
- [Electron Discord](https://discord.gg/electron)
- [React Community](https://reactjs.org/community/support.html)
- [TypeScript Community](https://github.com/microsoft/TypeScript)

---

**Versão**: 1.0.0  
**Última Atualização**: 04/07/2025  
**Autor**: ScumServerManager Team 