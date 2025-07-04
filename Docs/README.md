# ScumServerManager - Documentação

Bem-vindo à documentação completa do **ScumServerManager**, um gerenciador avançado para servidores SCUM desenvolvido em Electron/React com TypeScript.

## 📚 Índice da Documentação

### 📖 Documentação Principal
- **[📋 Documentação Completa](DOCUMENTACAO_COMPLETA.md)** - Visão geral completa do projeto, arquitetura, funcionalidades e instruções de uso
- **[🏗️ Arquitetura Técnica](ARQUITETURA_TECNICA.md)** - Detalhes técnicos da arquitetura, padrões de design e decisões de implementação
- **[👨‍💻 Guia do Desenvolvedor](GUIA_DEVELOPER.md)** - Setup do ambiente, padrões de código, debugging e contribuição

### 🔧 Referências Técnicas
- **[🔌 API Reference](API_REFERENCE.md)** - Documentação completa da API, tipos TypeScript e exemplos de uso
- **[🐛 Troubleshooting](TROUBLESHOOTING.md)** - Guia de solução de problemas, diagnóstico e procedimentos de recuperação
- **[📝 Changelog](CHANGELOG.md)** - Histórico completo de versões, mudanças e roadmap futuro

### 📋 Documentação Original
- **[📖 README Principal](../README.md)** - Documentação inicial do projeto
- **[⚙️ Informações Técnicas](INFORMACOES_TECNICAS.md)** - Informações técnicas básicas
- **[🚀 Como Executar](COMO_EXECUTAR.md)** - Instruções de instalação e execução

---

## 🎯 Visão Geral Rápida

O **ScumServerManager** é uma aplicação desktop completa para gerenciamento de servidores SCUM, oferecendo:

### ✨ Funcionalidades Principais
- 🎮 **Interface Visual Completa** para todas as configurações do servidor
- 📊 **Monitoramento em Tempo Real** de logs e status do servidor
- 🚗 **Sistema de Monitoramento de Veículos** com detecção automática de destruição
- 🔔 **Notificações Discord** automáticas para eventos importantes
- 💾 **Sistema de Backup** automático e restauração de configurações
- 👥 **Gestão de Jogadores** com estatísticas e controle de permissões

### 🛠️ Tecnologias Utilizadas
- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Electron + Node.js + TypeScript
- **Build**: Vite + Electron Builder
- **Persistência**: JSON files + Electron Store

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- npm 9+
- SCUM Server instalado
- Discord (opcional, para notificações)

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd ScumServerManager

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

### Configuração Inicial
1. Configure o caminho do servidor SCUM
2. Configure os webhooks do Discord (opcional)
3. Habilite `LogVehicleDestroyed=True` no Game.ini
4. Teste as notificações destruindo um veículo

---

## 📖 Por Onde Começar

### 🆕 Para Novos Usuários
1. **[📋 Documentação Completa](DOCUMENTACAO_COMPLETA.md)** - Visão geral e instruções de uso
2. **[🚀 Como Executar](COMO_EXECUTAR.md)** - Setup inicial e configuração
3. **[🐛 Troubleshooting](TROUBLESHOOTING.md)** - Solução de problemas comuns

### 👨‍💻 Para Desenvolvedores
1. **[👨‍💻 Guia do Desenvolvedor](GUIA_DEVELOPER.md)** - Setup do ambiente e padrões
2. **[🏗️ Arquitetura Técnica](ARQUITETURA_TECNICA.md)** - Detalhes da implementação
3. **[🔌 API Reference](API_REFERENCE.md)** - Documentação da API

### 🔧 Para Administradores
1. **[📋 Documentação Completa](DOCUMENTACAO_COMPLETA.md)** - Funcionalidades e configurações
2. **[🐛 Troubleshooting](TROUBLESHOOTING.md)** - Diagnóstico e recuperação
3. **[📝 Changelog](CHANGELOG.md)** - Histórico de versões e mudanças

---

## 🎯 Funcionalidades Destacadas

### 🚗 Monitoramento de Veículos
```typescript
// Detecção automática de eventos
- Veículos destruídos [💥]
- Veículos desaparecidos [🚗]
- Veículos expirados em zona proibida [⏰]
```

### 🔔 Notificações Discord
```typescript
// Webhooks configuráveis
- Notificações de destruição de veículos
- Notificações de novos jogadores
- Configurações de privacidade
```

### 💾 Sistema de Backup
```typescript
// Backup automático e manual
- Backup antes de alterações
- Restauração de configurações
- Gerenciamento de histórico
```

### 📊 Monitoramento de Logs
```typescript
// Logs em tempo real
- Filtros avançados
- Estatísticas de jogadores
- Performance do servidor
```

---

## 🔧 Configuração Avançada

### Arquivos de Configuração
```json
// config.json - Configurações principais
{
  "serverPath": "C:\\Servers\\scum\\SCUM\\Binaries\\Win64\\SCUMServer.exe",
  "logsPath": "C:\\Servers\\scum\\SCUM\\Saved\\Logs",
  "serverPort": 8900,
  "maxPlayers": 64
}

// discordWebhooks.json - Webhooks do Discord
{
  "logNovosPlayers": "https://discord.com/api/webhooks/...",
  "logDestruicaoVeiculos": "https://discord.com/api/webhooks/..."
}
```

### Configuração do Servidor SCUM
```ini
# Game.ini - Habilitar logs de veículos
[/Script/Scum.ScumGameMode]
LogVehicleDestroyed=True
```

---

## 🐛 Problemas Comuns

### ❓ FAQ Rápido

**Q: O DestructionWatcher não detecta eventos?**
A: Verifique se `LogVehicleDestroyed=True` está no Game.ini e se o caminho dos logs está correto.

**Q: Notificações Discord não chegam?**
A: Verifique se a URL do webhook está correta e se o canal permite webhooks.

**Q: Aplicativo não inicia?**
A: Execute como administrador e verifique se Node.js 18+ está instalado.

**Q: Configurações não são salvas?**
A: Verifique permissões de escrita e se o servidor não está usando os arquivos.

Para soluções detalhadas, consulte **[🐛 Troubleshooting](TROUBLESHOOTING.md)**.

---

## 📈 Roadmap

### Versão 1.1.0 (Planejada)
- [ ] Suporte a múltiplos servidores
- [ ] Sistema de plugins
- [ ] API REST para integração externa
- [ ] Dashboard customizável

### Versão 1.2.0 (Planejada)
- [ ] Suporte a cluster de servidores
- [ ] Load balancing automático
- [ ] Monitoramento de performance avançado

### Versão 2.0.0 (Planejada)
- [ ] Inteligência artificial para análise
- [ ] Detecção automática de problemas
- [ ] Interface web separada

---

## 🤝 Contribuição

### Como Contribuir
1. Fork o repositório
2. Crie uma branch para sua feature
3. Siga os padrões de código
4. Adicione testes
5. Crie um Pull Request

### Padrões de Commit
```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

Para mais detalhes, consulte **[👨‍💻 Guia do Desenvolvedor](GUIA_DEVELOPER.md)**.

---

## 📞 Suporte

### Recursos de Ajuda
- **[🐛 Troubleshooting](TROUBLESHOOTING.md)** - Solução de problemas
- **[🔌 API Reference](API_REFERENCE.md)** - Documentação da API
- **[📝 Changelog](CHANGELOG.md)** - Histórico de mudanças

### Comunidade
- GitHub Issues para bugs e feature requests
- Documentação completa na pasta Docs/
- Logs detalhados na pasta LogConsole/

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📊 Status do Projeto

- **Versão Atual**: 1.0.0
- **Status**: ✅ Estável
- **Última Atualização**: 04/07/2025
- **Compatibilidade**: Windows 10/11, SCUM Server 1.0+, Node.js 18+

---

**🎮 ScumServerManager** - Gerenciamento Avançado para Servidores SCUM

*Desenvolvido com ❤️ pela comunidade SCUM* 