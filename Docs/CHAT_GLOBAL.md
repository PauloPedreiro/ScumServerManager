# Sistema de Chat Global - SCUM Server Manager

## Visão Geral

O sistema de Chat Global monitora automaticamente os logs de chat do servidor SCUM e envia mensagens globais para o Discord através de webhooks configurados.

## Como Funciona

### 1. Monitoramento de Logs
- O sistema monitora arquivos de log que começam com `chat_` na pasta de logs configurada
- Exemplo: `chat_20250704000255.log`

### 2. Filtragem de Mensagens
- Apenas mensagens marcadas como `'Global: '` são processadas
- Mensagens locais são ignoradas

### 3. Formato das Mensagens
**Log Original:**
```
2025.07.04-03.18.21: '76561198140545020:mariocs10(12)' 'Global: alguem ai'
```

**Mensagem no Discord:**
```
mariocs10: alguem ai
```

## Configuração

### 1. Configurar Webhook
1. Acesse a página **Discord** no aplicativo
2. Expanda o card **"Chat Global"**
3. Cole a URL do webhook do Discord
4. Clique em **"Salvar"**

### 2. Testar Configuração
- **"Testar Webhook"**: Envia uma mensagem de teste simples
- **"Testar Processamento"**: Simula o processamento de uma mensagem de chat

## Funcionalidades

### ✅ Recursos Implementados
- **Monitoramento em tempo real** dos logs de chat
- **Detecção automática** de novas mensagens globais
- **Prevenção de duplicatas** usando IDs únicos
- **Processamento incremental** (não reprocessa mensagens antigas)
- **Logs detalhados** no console do aplicativo
- **Fallback com polling** caso o watcher falhe

### 🔧 Características Técnicas
- **Arquivo de offsets**: `.chat_global_offsets.json` para controlar progresso
- **Processamento assíncrono** para não bloquear o sistema
- **Tratamento de encoding** UTF-16/UTF-8
- **Controle de concorrência** para evitar processamento simultâneo

## Logs do Sistema

### Mensagens de Sucesso
```
[ChatGlobalWatcher] 🚀 Iniciando ChatGlobalWatcher...
[ChatGlobalWatcher] ✅ Iniciando watcher para: C:\Servers\scum\SCUM\Saved\Logs
[ChatGlobalWatcher] ✅ Webhook configurado: https://discord.com/api/webhooks/...
[ChatGlobalWatcher] 👁️ Watcher configurado para detecção em tempo real
[ChatGlobalWatcher] 💬 Processando mensagem: mariocs10: alguem ai
[ChatGlobalWatcher] ✅ Discord: Mensagem enviada com sucesso!
```

### Mensagens de Erro
```
[ChatGlobalWatcher] ❌ webhook de chat global não configurado
[ChatGlobalWatcher] ❌ Erro ao ler arquivo de log: [erro]
[ChatGlobalWatcher] ❌ Discord: Falha ao enviar mensagem: [erro]
```

## Estrutura dos Arquivos

### Arquivos de Log
- **Localização**: `{logsPath}/chat_*.log`
- **Formato**: `chat_YYYYMMDDHHMMSS.log`
- **Exemplo**: `chat_20250704000255.log`

### Arquivo de Controle
- **Nome**: `.chat_global_offsets.json`
- **Função**: Controlar quais linhas já foram processadas
- **Formato**:
```json
{
  "chat_20250704000255.log": 1024,
  "chat_20250704000256.log": 2048
}
```

## Solução de Problemas

### 1. Mensagens não aparecem no Discord
- Verificar se o webhook está configurado corretamente
- Testar o webhook usando o botão "Testar Webhook"
- Verificar logs do console para erros

### 2. Mensagens duplicadas
- O sistema tem proteção contra duplicatas
- Se ocorrer, verificar se o arquivo `.chat_global_offsets.json` foi corrompido
- Deletar o arquivo para reprocessar desde o início

### 3. Sistema não detecta novas mensagens
- Verificar se o caminho dos logs está correto em `config.json`
- Verificar se existem arquivos `chat_*.log` na pasta
- Reiniciar o aplicativo para reiniciar o watcher

### 4. Performance
- O sistema processa apenas novas linhas (usando offsets)
- Polling a cada 0.5 segundos como fallback
- Logs de atividade a cada 60 segundos

## Exemplos de Uso

### Mensagem Simples
**Log**: `'76561198140545020:mariocs10(12)' 'Global: oi galera'`
**Discord**: `mariocs10: oi galera`

### Mensagem com Caracteres Especiais
**Log**: `'76561198140545020:mariocs10(12)' 'Global: alguém aí?'`
**Discord**: `mariocs10: alguém aí?`

### Mensagem Longa
**Log**: `'76561198140545020:mariocs10(12)' 'Global: essa é uma mensagem muito longa que pode ter várias linhas'`
**Discord**: `mariocs10: essa é uma mensagem muito longa que pode ter várias linhas`

## Configuração Avançada

### Modificar Intervalo de Polling
No arquivo `src/main/chatGlobalWatcher.ts`, linha 280:
```typescript
await sleep(500); // Polling a cada 0.5 segundo
```

### Modificar Frequência de Logs
No arquivo `src/main/chatGlobalWatcher.ts`, linha 275:
```typescript
if (pollCount % 120 === 0) { // Log a cada 60 segundos
```

### Adicionar Filtros Adicionais
No arquivo `src/main/chatGlobalWatcher.ts`, função `parseChatLine`:
```typescript
// Adicionar filtros para outros tipos de mensagem
if (cleanLine.includes("'Local: ")) {
  // Processar mensagens locais
}
``` 