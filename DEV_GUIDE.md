# Guia de Desenvolvimento - SCUM Server Manager

## 🚀 Scripts de Desenvolvimento

### Problema Identificado
O `npm run dev` original usava `concurrently` para rodar dois processos separados, causando conflitos e delays no envio de notificações em tempo real.

### Soluções Implementadas

#### 1. Script Unificado (Recomendado)
```bash
npm run dev
```
- Usa `concurrently` com `--kill-others` para garantir que todos os processos sejam encerrados juntos
- Compila o TypeScript do main em modo watch
- Garante que o processo main rode corretamente com os watchers

#### 2. Script PowerShell (Mais Robusto)
```powershell
.\dev-start.ps1
```
- Compila o TypeScript do main primeiro
- Verifica e para processos Electron existentes
- Inicia o processo main em background
- Inicia o Vite dev server
- Limpa processos automaticamente ao sair

#### 3. Script Batch (Alternativa)
```cmd
dev-start.bat
```
- Versão mais simples para Windows
- Compila e inicia os processos sequencialmente

#### 4. Script Original (Para Comparação)
```bash
npm run dev:main
```
- Roda apenas o processo main
- Sem hot reload do renderer
- Funciona bem para testes dos watchers

## 🔍 Por que os Novos Scripts Resolvem o Problema

### Antes (npm run dev original)
```
concurrently "npm run dev:main" "npm run dev:renderer"
```
- Dois processos separados sem sincronização
- Possível conflito entre processos
- Watchers podiam ser interrompidos pelo hot reload

### Depois (Scripts Melhorados)
1. **Controle de Processos**: Verifica e limpa processos existentes
2. **Sincronização**: Garante que o main rode antes do renderer
3. **Logs Detalhados**: Monitora o ciclo de vida dos processos
4. **Cleanup Automático**: Para todos os processos ao sair

## 📊 Comparação de Performance

| Script | Tempo Real | Hot Reload | Estabilidade |
|--------|------------|------------|--------------|
| `npm run dev:main` | ✅ Excelente | ❌ Não | ✅ Excelente |
| `npm run dev` (novo) | ✅ Excelente | ✅ Sim | ✅ Excelente |
| `.\dev-start.ps1` | ✅ Excelente | ✅ Sim | ✅ Excelente |
| `npm run dev` (antigo) | ❌ Lento | ✅ Sim | ⚠️ Instável |

## 🛠️ Como Usar

### Para Desenvolvimento Normal
```bash
npm run dev
```

### Para Desenvolvimento com Mais Controle
```powershell
.\dev-start.ps1
```

### Para Testar Apenas os Watchers
```bash
npm run dev:main
```

## 🔧 Troubleshooting

### Se os watchers não iniciarem:
1. Verifique se o `config.json` existe e tem `logsPath` configurado
2. Verifique se o `discordWebhooks.json` existe e tem webhooks válidos
3. Use `npm run dev:main` para ver logs detalhados

### Se houver conflitos de processo:
1. Use `.\dev-start.ps1` que limpa processos automaticamente
2. Ou feche manualmente todos os processos Electron e Node.js

### Se o Vite não carregar:
1. Verifique se a porta 5173 está livre
2. Use `npm run dev:renderer` separadamente para debug

## 📝 Logs Importantes

Os novos scripts adicionam logs detalhados:
- `🚀 [MAIN] Iniciando SCUM Server Manager...`
- `🔍 [MAIN] Iniciando watchers...`
- `✅ [MAIN] Todos os watchers iniciados com sucesso!`
- `🪟 [MAIN] Janela principal criada e exibida`

## 🎯 Resultado Esperado

Com os novos scripts, você deve ver:
- Notificações em tempo real tanto no `npm run dev` quanto no `npm run dev:main`
- Hot reload funcionando corretamente
- Processos estáveis sem conflitos
- Logs claros para debug 