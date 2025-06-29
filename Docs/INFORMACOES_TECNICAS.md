# 🔧 Informações Técnicas - SCUM Server Manager

Este documento contém informações técnicas detalhadas sobre a arquitetura e funcionamento do SCUM Server Manager.

## 🏗️ Arquitetura do Projeto

### **Tecnologias Utilizadas**

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Electron** | 28+ | Aplicativo desktop multiplataforma |
| **React** | 18+ | Interface de usuário |
| **TypeScript** | 5+ | Tipagem estática |
| **Material-UI** | 5+ | Design system |
| **Vite** | 5+ | Build tool e dev server |
| **React Router** | 6+ | Navegação SPA |

### **Estrutura de Pastas**

```
ScumServerManager/
├── src/
│   ├── main/                 # Processo principal (Electron)
│   │   ├── index.ts         # Ponto de entrada
│   │   ├── fileManager.ts   # Gerenciamento de arquivos
│   │   └── backupManager.ts # Sistema de backup
│   ├── renderer/            # Interface React
│   │   ├── App.tsx         # Componente principal
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── contexts/       # Contextos React
│   │   └── types/          # Definições de tipos
│   └── shared/             # Código compartilhado
├── Docs/                   # Documentação
├── dist/                   # Build de produção
└── package.json           # Configuração do projeto
```

## 📁 Arquivos de Configuração Suportados

### **Arquivos INI**
- `ServerSettings.ini` - Configurações básicas do servidor
- `GameUserSettings.ini` - Configurações do jogo
- `AdminUsers.ini` - Lista de administradores
- `WhitelistedUsers.ini` - Lista de usuários autorizados
- `BannedUsers.ini` - Lista de usuários banidos
- `SilencedUsers.ini` - Lista de usuários silenciados
- `ExclusiveUsers.ini` - Lista de usuários exclusivos

### **Arquivos JSON**
- `EconomyOverride.json` - Sistema de economia
- `RaidTimes.json` - Horários de raid
- `LootOverride.json` - Configurações de loot

## 🔄 Fluxo de Dados

### **1. Carregamento de Configurações**
```
Usuário seleciona pasta → Electron lê arquivos → Parse para JSON → React exibe
```

### **2. Salvamento de Configurações**
```
React envia dados → Validação → Backup automático → Escrita no arquivo → Confirmação
```

### **3. Sistema de Backup**
```
Antes de salvar → Criar backup → Salvar arquivo → Limpar backups antigos
```

## 🛡️ Sistema de Segurança

### **Validação de Dados**
- **Campos obrigatórios**: Verificação de preenchimento
- **Tipos de dados**: Validação de formato (número, texto, etc.)
- **Ranges**: Valores mínimos e máximos
- **Formato**: Validação de padrões (Steam ID, IP, etc.)

### **Backup Automático**
- **Frequência**: Antes de cada salvamento
- **Formato**: ZIP com timestamp
- **Retenção**: Configurável (padrão: 30 dias)
- **Localização**: `Servers/Scum/backups/`

### **Tratamento de Erros**
- **Try-catch**: Em todas as operações de arquivo
- **Logs**: Registro de erros e operações
- **Fallback**: Restauração automática em caso de erro
- **Notificações**: Feedback visual para o usuário

## 🎨 Interface de Usuário

### **Componentes Principais**
- **Navigation**: Barra lateral com navegação
- **Dashboard**: Visão geral e estatísticas
- **Form Components**: Campos de entrada validados
- **Notification System**: Sistema de notificações
- **Modal Dialogs**: Diálogos de confirmação

### **Design System**
- **Material-UI**: Componentes base
- **Tema**: Cores e tipografia consistentes
- **Responsividade**: Adaptação a diferentes tamanhos
- **Acessibilidade**: Suporte a leitores de tela

## 🔌 APIs do Electron

### **File Operations**
```typescript
// Seleção de pasta
window.electronAPI.selectServerFolder()

// Leitura de arquivo
window.electronAPI.readConfigFile(filePath)

// Escrita de arquivo
window.electronAPI.writeConfigFile(filePath, data)
```

### **Backup Operations**
```typescript
// Listar backups
window.electronAPI.getBackups()

// Criar backup
window.electronAPI.createBackup(options)

// Restaurar backup
window.electronAPI.restoreBackup(backupId, serverPath)
```

### **Server Operations**
```typescript
// Status do servidor
window.electronAPI.getServerStatus(serverPath)

// Logs do servidor
window.electronAPI.getServerLogs(serverPath, options)

// Controle do servidor
window.electronAPI.startServer(serverPath)
window.electronAPI.stopServer(serverPath)
window.electronAPI.restartServer(serverPath)
```

## 📊 Performance

### **Otimizações Implementadas**
- **Lazy Loading**: Carregamento sob demanda
- **Memoização**: React.memo para componentes
- **Debouncing**: Redução de chamadas de API
- **Virtual Scrolling**: Para listas grandes
- **Code Splitting**: Separação de bundles

### **Métricas Esperadas**
- **Tempo de inicialização**: < 3 segundos
- **Tempo de carregamento**: < 1 segundo
- **Uso de memória**: < 200MB
- **Tamanho do executável**: < 100MB

## 🧪 Testes

### **Tipos de Teste**
- **Unit Tests**: Testes de componentes individuais
- **Integration Tests**: Testes de fluxos completos
- **E2E Tests**: Testes end-to-end
- **Performance Tests**: Testes de performance

### **Ferramentas de Teste**
- **Jest**: Framework de testes
- **React Testing Library**: Testes de componentes
- **Playwright**: Testes E2E
- **Lighthouse**: Testes de performance

## 🔧 Configuração de Desenvolvimento

### **Variáveis de Ambiente**
```env
NODE_ENV=development
ELECTRON_IS_DEV=true
VITE_DEV_SERVER_URL=http://localhost:5173
```

### **Scripts Disponíveis**
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "electron": "electron .",
  "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\""
}
```

## 🚀 Deploy

### **Build de Produção**
```bash
npm run build
npm run electron:build
```

### **Distribuição**
- **Windows**: `.exe` e `.msi`
- **macOS**: `.dmg`
- **Linux**: `.AppImage` e `.deb`

### **Auto-updater**
- **Electron Updater**: Atualizações automáticas
- **Code Signing**: Assinatura digital
- **Release Channels**: Beta e stable

## 📈 Monitoramento

### **Métricas Coletadas**
- **Uso de CPU**: Monitoramento de recursos
- **Uso de memória**: Controle de vazamentos
- **Tempo de resposta**: Performance da UI
- **Erros**: Logs de erro e crash

### **Ferramentas**
- **Electron Crash Reporter**: Relatórios de crash
- **Custom Analytics**: Métricas personalizadas
- **Error Tracking**: Rastreamento de erros

## 🔮 Roadmap

### **Versão 1.0**
- [x] Interface básica
- [x] Gerenciamento de configurações
- [x] Sistema de backup
- [x] Validação de dados

### **Versão 1.1**
- [ ] Plugins de terceiros
- [ ] Temas personalizáveis
- [ ] Atalhos de teclado
- [ ] Modo escuro

### **Versão 2.0**
- [ ] Múltiplos servidores
- [ ] Sincronização em nuvem
- [ ] API REST
- [ ] Interface web

---

**📝 Nota**: Este documento é atualizado conforme o projeto evolui. 