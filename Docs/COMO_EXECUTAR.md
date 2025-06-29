# 🚀 Como Executar o SCUM Server Manager

Este documento contém todas as instruções necessárias para executar o SCUM Server Manager em seu computador.

## 📋 Pré-requisitos

### Software Necessário
- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **npm** (vem com o Node.js)
- **Git** (opcional, para clonar o repositório)

### Verificar Instalação
Abra o CMD e execute:
```cmd
node --version
npm --version
```

Se ambos retornarem versões, você está pronto para prosseguir!

## 🎯 Passos para Execução

### 1. **Navegar até a pasta do projeto**
```cmd
cd "C:\Users\paulo\Desktop\Cursor Ai\Scum\ScumServerManager"
```

### 2. **Instalar dependências**
```cmd
npm install
```
**Tempo estimado**: 2-5 minutos (dependendo da conexão)

### 3. **Executar em modo de desenvolvimento**
```cmd
npm run dev
```

Após este comando, o aplicativo deve abrir automaticamente em uma janela do Electron!

## 🔧 Comandos Disponíveis

### **Desenvolvimento**
```cmd
npm run dev          # Executa em modo de desenvolvimento
npm run dev -- --verbose  # Executa com logs detalhados
```

### **Build e Produção**
```cmd
npm run build        # Cria build de produção
npm run preview      # Executa build de produção
```

### **Utilitários**
```cmd
npm run lint         # Verifica código (se configurado)
npm run type-check   # Verifica tipos TypeScript
```

## ⚠️ Solução de Problemas

### **Erro: "npm não é reconhecido"**
- **Solução**: Reinstale o Node.js
- **Download**: https://nodejs.org/

### **Erro: "Dependências não encontradas"**
```cmd
npm cache clean --force
npm install
```

### **Erro: "Permissão negada"**
- Execute o CMD como **Administrador**
- Ou use:
```cmd
npm install --no-optional
```

### **Erro: "Porta já em uso"**
- Feche outros aplicativos que possam estar usando a porta
- Ou reinicie o computador

### **Erro: "Módulo não encontrado"**
```cmd
rm -rf node_modules
npm install
```

## 🎮 Primeiro Uso

### 1. **Selecionar Servidor**
- Clique em "Selecionar Servidor" na barra lateral
- Navegue até a pasta do seu servidor SCUM
- Exemplo: `C:\Servers\SCUM\`

### 2. **Verificar Arquivos**
O aplicativo deve detectar automaticamente:
- `ServerSettings.ini`
- `GameUserSettings.ini`
- `EconomyOverride.json`
- Outros arquivos de configuração

### 3. **Começar a Configurar**
- Use o Dashboard para visão geral
- Navegue pelas diferentes seções
- Faça alterações e salve

## 📁 Estrutura de Pastas Esperada

```
ScumServerManager/
├── src/                    # Código fonte
├── node_modules/          # Dependências (criada após npm install)
├── Docs/                  # Documentação
├── package.json           # Configuração do projeto
└── README.md             # Documentação principal
```

## 🔄 Atualizações

### **Para atualizar o projeto:**
```cmd
git pull origin main
npm install
npm run dev
```

### **Para reinstalar tudo:**
```cmd
rm -rf node_modules
npm install
npm run dev
```

## 📞 Suporte

### **Logs de Erro**
Se algo der errado, verifique:
- Console do CMD onde executou o comando
- Logs do Electron (F12 no aplicativo)
- Arquivo de log em `%APPDATA%/ScumServerManager/`

### **Problemas Comuns**

1. **Aplicativo não abre**
   - Verifique se não há erros no CMD
   - Tente `npm run build` primeiro

2. **Interface não carrega**
   - Verifique conexão com internet (para Material-UI)
   - Tente recarregar (Ctrl+R)

3. **Configurações não salvam**
   - Verifique permissões de escrita na pasta do servidor
   - Certifique-se de que o servidor não está rodando

## 🎯 Sequência Rápida

Para usuários experientes, aqui está a sequência completa:

```cmd
cd "C:\Users\paulo\Desktop\Cursor Ai\Scum\ScumServerManager"
npm install
npm run dev
```

## ✅ Checklist de Verificação

- [ ] Node.js instalado
- [ ] Pasta do projeto acessível
- [ ] Dependências instaladas
- [ ] Aplicativo abre sem erros
- [ ] Servidor SCUM selecionado
- [ ] Configurações carregadas

---

**🎉 Se tudo funcionou, você está pronto para gerenciar seu servidor SCUM!**

Para mais informações, consulte o `README.md` principal. 