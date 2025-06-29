# CONFIGURAÇÃO DO SERVIDOR

Após a inicialização inicial do servidor, os arquivos necessários para a configuração serão gerados, incluindo todos os arquivos .ini que você pode editar.

Para acessar esses arquivos, navegue até:
"...\SCUM Server\SCUM\Saved\Config\WindowsServer"

# AdminUsers.ini
Colocar SteamIDs nesta pasta dará direitos de administrador aos jogadores, permitindo executar comandos básicos.

Argumentos acessíveis:
[SetGodMode] - Dá ao jogador acesso ao comando "#SetGodMode True/False", que ativa ou desativa construção instantânea.
[RestartServer] - Dá ao jogador acesso ao comando "#RestartServer pretty please", que iniciará uma sequência de desligamento do servidor.

Exemplo de como adicionar um usuário ao AdminUsers.ini:
76561199637135087 <- comandos de admin
76561199637135087[SetGodMode] <- comandos de admin + setgodmode
76561199637135087[SetGodMode, RestartServer] <- comandos de admin + setgodmode + restartserver pretty please

# BannedUsers.ini
Todos os jogadores banidos do seu servidor serão listados neste arquivo. Você também pode adicionar SteamIDs manualmente.

# EconomyOverride.json
Neste arquivo, você pode ajustar os preços de itens e serviços nos comerciantes das zonas seguras. Já existem alguns exemplos de como isso é feito no arquivo, basta substituir o nome do item ou serviço que você deseja ajustar e colocá-lo no comerciante correspondente.

# ExclusiveUsers.ini
Neste arquivo, você pode colocar SteamIDs dos jogadores que terão acesso ao servidor. Qualquer jogador que não estiver nesta lista não terá acesso. Isso só será ativado após você inserir o primeiro SteamID no arquivo.

# GameUserSettings.ini e Input.ini
Estes arquivos não têm utilidade para o servidor, então podem ser ignorados completamente.

# RaidTimes.json
Este arquivo é usado para definir os horários globais de raid.

# ServerSettings.ini
Dentro deste arquivo, você encontrará todas as configurações do servidor. É possível configurar manualmente as configurações sem entrar no jogo através deste arquivo.

# ServerSettingsAdminUsers.ini
Neste arquivo, você pode dar acesso à configuração das configurações do servidor no jogo. Basta inserir o SteamID no arquivo, após isso, o jogador especificado terá acesso às configurações do servidor no jogo.

# SilencedUsers.ini
Neste arquivo, você pode ver quais jogadores foram silenciados e qual é a duração do silenciamento no servidor.

# WhitelistedUsers.ini
Neste arquivo, você pode colocar SteamIDs dos jogadores que terão prioridade para se conectar ao servidor. Isso significa que qualquer jogador nesta lista terá acesso prioritário ao servidor, mesmo que esteja cheio (se o servidor estiver cheio, um jogador será expulso do servidor).

# Portas
Importante: A porta de resposta usada para conexões de clientes é sempre a porta definida +2. Então, se você iniciar o servidor com -port=7000, os jogadores precisarão se conectar usando IP:7002.

Se nenhuma porta for definida, o servidor usará a porta padrão 7779 