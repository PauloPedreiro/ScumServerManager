# ScumServerManager - Guia de Troubleshooting

## Índice
1. [Problemas Comuns](#problemas-comuns)
2. [Diagnóstico de Problemas](#diagnóstico-de-problemas)
3. [Logs e Debugging](#logs-e-debugging)
4. [Procedimentos de Recuperação](#procedimentos-de-recuperação)
5. [FAQ](#faq)

---

## Problemas Comuns

### 1. Aplicativo Não Inicia

#### Sintomas
- Aplicativo não abre após execução
- Erro de inicialização
- Tela em branco

#### Possíveis Causas
- Node.js não instalado ou versão incorreta
- Dependências não instaladas
- Arquivo de configuração corrompido
- Permissões insuficientes

#### Soluções

**1. Verificar Node.js**
```bash
# Verificar versão do Node.js
node --version
# Deve ser 18.0.0 ou superior

# Verificar versão do npm
npm --version
# Deve ser 9.0.0 ou superior
```

**2. Reinstalar Dependências**
```bash
# Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar dependências
npm install

# Verificar se não há erros
npm run type-check
```

**3. Verificar Configuração**
```bash
# Verificar se config.json existe e é válido
cat config.json

# Se corrompido, recriar com valores padrão
echo '{
  "lastServerPath": "",
  "steamcmdPath": "",
  "serverPath": "",
  "installPath": "",
  "iniConfigPath": "",
  "logsPath": "",
  "serverPort": 8900,
  "maxPlayers": 64,
  "enableBattleye": true,
  "hideVehicleOwnerSteamId": true
}' > config.json
```

**4. Executar como Administrador**
- Clique com botão direito no executável
- Selecione "Executar como administrador"

### 2. DestructionWatcher Não Detecta Eventos

#### Sintomas
- Veículos destruídos não geram notificações Discord
- Logs de destruição não aparecem
- Sistema de monitoramento inativo

#### Possíveis Causas
- `LogVehicleDestroyed` não habilitado no Game.ini
- Caminho dos logs incorreto
- Webhook Discord não configurado
- Permissões de leitura de arquivos

#### Soluções

**1. Verificar Configuração do Game.ini**
```ini
# Em C:\Servers\scum\SCUM\Saved\Config\WindowsServer\Game.ini
[/Script/Scum.ScumGameMode]
LogVehicleDestroyed=True
```

**2. Verificar Caminho dos Logs**
```bash
# Verificar se a pasta existe
dir "C:\Servers\scum\SCUM\Saved\Logs"

# Verificar se há arquivos de log
dir "C:\Servers\scum\SCUM\Saved\Logs\vehicle_destruction_*.log"
```

**3. Testar Webhook Discord**
```typescript
// No console do aplicativo
await window.electronAPI.sendDiscordWebhookMessage(
  'https://discord.com/api/webhooks/...',
  '🧪 Teste de webhook - ' + new Date().toISOString()
);
```

**4. Verificar Logs do Aplicativo**
```bash
# Verificar logs do console
cat LogConsole/LogConsole.txt

# Procurar por erros relacionados ao DestructionWatcher
grep -i "destruction" LogConsole/LogConsole.txt
```

### 3. Erro de Permissão de Arquivo

#### Sintomas
- Erro "EACCES" ou "Permission denied"
- Não consegue ler/escrever arquivos de configuração
- Backup falha

#### Possíveis Causas
- Executando sem privilégios de administrador
- Arquivos marcados como somente leitura
- Antivírus bloqueando acesso

#### Soluções

**1. Executar como Administrador**
```bash
# Windows
# Clique com botão direito no executável
# Selecione "Executar como administrador"
```

**2. Verificar Permissões de Arquivo**
```bash
# Verificar atributos dos arquivos
attrib "C:\Servers\scum\SCUM\Saved\Config\WindowsServer\*"

# Remover atributo somente leitura se necessário
attrib -r "C:\Servers\scum\SCUM\Saved\Config\WindowsServer\*"
```

**3. Configurar Antivírus**
- Adicionar pasta do servidor como exceção
- Adicionar aplicativo como exceção
- Desabilitar proteção em tempo real temporariamente

### 4. Webhook Discord Não Funciona

#### Sintomas
- Notificações não chegam no Discord
- Erro de conexão
- Mensagens de erro no console

#### Possíveis Causas
- URL do webhook incorreta
- Webhook deletado ou inválido
- Problemas de rede
- Rate limiting do Discord

#### Soluções

**1. Verificar URL do Webhook**
```typescript
// URL deve ter formato:
// https://discord.com/api/webhooks/[ID]/[TOKEN]
const webhookUrl = 'https://discord.com/api/webhooks/123456789/abcdef...';
```

**2. Testar Webhook Manualmente**
```bash
# Usando curl
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"Teste de webhook"}' \
  https://discord.com/api/webhooks/[ID]/[TOKEN]
```

**3. Verificar Rate Limiting**
```typescript
// Implementar delay entre mensagens
const sendWithDelay = async (webhookUrl: string, message: string) => {
  await window.electronAPI.sendDiscordWebhookMessage(webhookUrl, message);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
};
```

**4. Verificar Configuração do Canal**
- Canal deve permitir webhooks
- Bot deve ter permissões de envio
- Canal não deve estar arquivado

### 5. Configurações Não São Salvas

#### Sintomas
- Alterações não persistem após reiniciar
- Configurações voltam ao padrão
- Erro ao salvar

#### Possíveis Causas
- Arquivo de configuração corrompido
- Permissões de escrita
- Processo do servidor bloqueando arquivo

#### Soluções

**1. Verificar Integridade do Arquivo**
```bash
# Fazer backup do arquivo atual
copy "config.json" "config.json.backup"

# Verificar se é JSON válido
node -e "JSON.parse(require('fs').readFileSync('config.json', 'utf8'))"
```

**2. Parar Servidor Antes de Salvar**
```typescript
// Parar servidor antes de salvar configurações
await window.electronAPI.stopServer(serverPath);
await window.electronAPI.saveServerConfig(serverPath, config);
await window.electronAPI.startServer(serverPath);
```

**3. Verificar Permissões**
```bash
# Verificar se arquivo não está sendo usado
tasklist | findstr "SCUMServer"

# Se estiver rodando, parar primeiro
taskkill /f /im SCUMServer.exe
```

### 6. Performance Lenta

#### Sintomas
- Interface lenta
- Alto uso de CPU/memória
- Logs demoram para carregar

#### Possíveis Causas
- Arquivos de log muito grandes
- Muitos arquivos sendo monitorados
- Memory leaks

#### Soluções

**1. Limpar Logs Antigos**
```bash
# Remover logs com mais de 30 dias
forfiles /p "C:\Servers\scum\SCUM\Saved\Logs" /s /m *.log /d -30 /c "cmd /c del @path"
```

**2. Otimizar Monitoramento**
```typescript
// Implementar filtros para reduzir processamento
const shouldProcessFile = (filename: string) => {
  return filename.startsWith('vehicle_destruction_') && 
         filename.endsWith('.log') &&
         filename.includes(new Date().toISOString().split('T')[0]);
};
```

**3. Implementar Cache**
```typescript
// Cache de configurações para evitar leituras desnecessárias
const configCache = new Map();
const getCachedConfig = async (key: string) => {
  if (configCache.has(key)) {
    return configCache.get(key);
  }
  const config = await loadConfig(key);
  configCache.set(key, config);
  return config;
};
```

---

## Diagnóstico de Problemas

### 1. Coleta de Informações

#### Logs do Sistema
```bash
# Logs do aplicativo
cat LogConsole/LogConsole.txt
cat LogConsole/LogConsoleAPP.txt
cat LogConsole/LogConsoleBat.txt

# Logs do Windows
eventvwr.msc
# Procurar por erros relacionados ao aplicativo
```

#### Informações do Sistema
```bash
# Versões
node --version
npm --version
electron --version

# Configurações
cat config.json
cat discordWebhooks.json
cat vehicle_destruction_offsets.json

# Status do servidor
tasklist | findstr "SCUM"
netstat -an | findstr "8900"
```

#### Testes de Conectividade
```bash
# Testar acesso aos arquivos
dir "C:\Servers\scum\SCUM\Saved\Config\WindowsServer"
dir "C:\Servers\scum\SCUM\Saved\Logs"

# Testar webhook Discord
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"Teste"}' \
  [WEBHOOK_URL]
```

### 2. Análise de Logs

#### Padrões de Erro Comuns
```bash
# Erro de permissão
grep -i "eacces\|permission" LogConsole/LogConsole.txt

# Erro de arquivo não encontrado
grep -i "enoent\|not found" LogConsole/LogConsole.txt

# Erro de rede
grep -i "network\|connection" LogConsole/LogConsole.txt

# Erro de Discord
grep -i "discord\|webhook" LogConsole/LogConsole.txt
```

#### Logs de Performance
```bash
# Logs de tempo de resposta
grep -i "ms\|milliseconds" LogConsole/LogConsole.txt

# Logs de uso de memória
grep -i "memory\|heap" LogConsole/LogConsole.txt
```

### 3. Testes de Funcionalidade

#### Teste de Configuração
```typescript
// Testar carregamento de configurações
const testConfig = async () => {
  try {
    const config = await window.electronAPI.loadAppConfig();
    console.log('✅ Configuração carregada:', config);
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar configuração:', error);
    return false;
  }
};
```

#### Teste de Webhook
```typescript
// Testar webhook Discord
const testWebhook = async () => {
  try {
    const webhooks = await window.electronAPI.loadDiscordWebhooks();
    if (webhooks.logDestruicaoVeiculos) {
      await window.electronAPI.sendDiscordWebhookMessage(
        webhooks.logDestruicaoVeiculos,
        '🧪 Teste de funcionalidade - ' + new Date().toISOString()
      );
      console.log('✅ Webhook funcionando');
      return true;
    } else {
      console.log('⚠️ Webhook não configurado');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return false;
  }
};
```

#### Teste de Monitoramento
```typescript
// Testar monitoramento de veículos
const testMonitoring = async () => {
  try {
    const appConfig = await window.electronAPI.loadAppConfig();
    const logsExist = await window.electronAPI.checkPathExists(appConfig.logsPath);
    
    if (logsExist) {
      const logFiles = await window.electronAPI.listDir(appConfig.logsPath);
      const vehicleLogs = logFiles.filter(f => f.includes('vehicle_destruction'));
      console.log(`✅ ${vehicleLogs.length} arquivos de log de veículos encontrados`);
      return true;
    } else {
      console.log('❌ Pasta de logs não encontrada');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
    return false;
  }
};
```

---

## Logs e Debugging

### 1. Habilitar Logs Detalhados

#### Configuração de Debug
```json
// Adicionar ao config.json
{
  "debug": true,
  "logLevel": "verbose",
  "enableFileLogging": true,
  "logToFile": true
}
```

#### Logs Estruturados
```typescript
// Sistema de logs estruturado
const logger = {
  info: (component: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component,
      message,
      data
    };
    console.log(JSON.stringify(logEntry));
  },
  
  error: (component: string, message: string, error?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component,
      message,
      error: error?.message || error
    };
    console.error(JSON.stringify(logEntry));
  },
  
  debug: (component: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        component,
        message,
        data
      };
      console.log(JSON.stringify(logEntry));
    }
  }
};

// Uso
logger.info('FileManager', 'Carregando configurações', { serverPath });
logger.error('DestructionWatcher', 'Erro ao processar arquivo', error);
logger.debug('BackupManager', 'Criando backup', { backupName });
```

### 2. Ferramentas de Debug

#### Chrome DevTools
```bash
# Habilitar DevTools no Electron
# Adicionar ao main process
mainWindow.webContents.openDevTools();
```

#### React DevTools
```bash
# Instalar React DevTools
npm install -g react-devtools

# Executar em terminal separado
react-devtools
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

### 3. Monitoramento de Recursos

#### Monitoramento de Memória
```typescript
// Monitoramento de uso de memória
const monitorMemory = () => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  });
};

// Executar periodicamente
setInterval(monitorMemory, 30000); // A cada 30 segundos
```

#### Monitoramento de CPU
```typescript
// Monitoramento de uso de CPU
const monitorCPU = () => {
  const startUsage = process.cpuUsage();
  
  setTimeout(() => {
    const endUsage = process.cpuUsage(startUsage);
    const cpuPercent = (endUsage.user + endUsage.system) / 1000000; // em segundos
    console.log(`CPU usage: ${cpuPercent.toFixed(2)}s`);
  }, 1000);
};
```

---

## Procedimentos de Recuperação

### 1. Recuperação de Configurações

#### Backup Automático
```typescript
// Restaurar configurações do último backup
const restoreLastBackup = async () => {
  try {
    const backups = await window.electronAPI.listBackups();
    if (backups.length > 0) {
      const latestBackup = backups[backups.length - 1];
      await window.electronAPI.restoreBackup(latestBackup.name);
      console.log('Configurações restauradas do backup:', latestBackup.name);
    }
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
  }
};
```

#### Configuração Manual
```json
// Configuração padrão para recuperação
{
  "lastServerPath": "C:\\Servers\\scum\\SCUM\\Binaries\\Win64",
  "steamcmdPath": "C:\\Servers\\steamcmd\\steamcmd.exe",
  "serverPath": "C:\\Servers\\scum\\SCUM\\Binaries\\Win64\\SCUMServer.exe",
  "installPath": "C:\\Servers\\scum",
  "iniConfigPath": "C:\\Servers\\scum\\SCUM\\Saved\\Config\\WindowsServer",
  "logsPath": "C:\\Servers\\scum\\SCUM\\Saved\\Logs",
  "serverPort": 8900,
  "maxPlayers": 64,
  "enableBattleye": true,
  "hideVehicleOwnerSteamId": true
}
```

### 2. Recuperação de Dados

#### Recuperação de Logs
```bash
# Verificar se há logs corrompidos
for file in "C:\Servers\scum\SCUM\Saved\Logs\*.log"; do
  if ! tail -n 1 "$file" | grep -q ".*"; then
    echo "Arquivo corrompido: $file"
    # Fazer backup e recriar
    mv "$file" "$file.corrupted"
  fi
done
```

#### Recuperação de Offsets
```typescript
// Resetar offsets para reprocessar logs
const resetOffsets = async () => {
  try {
    await window.electronAPI.saveJsonFile('vehicle_destruction_offsets.json', {});
    console.log('Offsets resetados');
  } catch (error) {
    console.error('Erro ao resetar offsets:', error);
  }
};
```

### 3. Reinstalação Limpa

#### Procedimento Completo
```bash
# 1. Parar aplicativo
taskkill /f /im ScumServerManager.exe

# 2. Fazer backup de configurações
copy config.json config.json.backup
copy discordWebhooks.json discordWebhooks.json.backup

# 3. Remover arquivos do aplicativo
rmdir /s /q node_modules
del package-lock.json

# 4. Reinstalar
npm install

# 5. Restaurar configurações
copy config.json.backup config.json
copy discordWebhooks.json.backup discordWebhooks.json

# 6. Testar
npm run dev
```

---

## FAQ

### Q: O aplicativo não detecta eventos de destruição de veículos
**A**: Verifique se:
1. `LogVehicleDestroyed=True` está no Game.ini
2. O caminho dos logs está correto
3. O webhook do Discord está configurado
4. O servidor está gerando logs

### Q: As notificações Discord não chegam
**A**: Verifique se:
1. A URL do webhook está correta
2. O canal permite webhooks
3. Não há problemas de rede
4. O rate limiting não está sendo excedido

### Q: O aplicativo está lento
**A**: Tente:
1. Limpar logs antigos
2. Reiniciar o aplicativo
3. Verificar uso de memória
4. Otimizar configurações

### Q: Configurações não são salvas
**A**: Verifique se:
1. O arquivo não está sendo usado pelo servidor
2. Há permissões de escrita
3. O arquivo não está corrompido
4. O processo tem privilégios de administrador

### Q: Erro de permissão ao acessar arquivos
**A**: Execute o aplicativo como administrador e verifique se:
1. Os arquivos não estão marcados como somente leitura
2. O antivírus não está bloqueando
3. As permissões da pasta estão corretas

### Q: Como fazer backup das configurações?
**A**: O sistema faz backup automático antes de alterações, mas você pode:
1. Copiar manualmente os arquivos .json
2. Usar a funcionalidade de backup do aplicativo
3. Configurar backup automático do sistema

### Q: Como atualizar o aplicativo?
**A**: Para atualizar:
1. Fazer backup das configurações
2. Baixar nova versão
3. Substituir arquivos
4. Restaurar configurações se necessário

### Q: O servidor não inicia pelo aplicativo
**A**: Verifique se:
1. O caminho do executável está correto
2. Há permissões para executar
3. O servidor não está já rodando
4. As configurações estão válidas

---

## Contato e Suporte

### Informações de Contato
- **Issues**: GitHub Issues
- **Documentação**: Pasta Docs/
- **Logs**: Pasta LogConsole/

### Recursos Adicionais
- [Documentação Completa](DOCUMENTACAO_COMPLETA.md)
- [Guia do Desenvolvedor](GUIA_DEVELOPER.md)
- [API Reference](API_REFERENCE.md)
- [Changelog](CHANGELOG.md)

---

**Versão**: 1.0.0  
**Última Atualização**: 04/07/2025  
**Autor**: ScumServerManager Team 