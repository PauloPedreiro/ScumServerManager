@echo off
set ServerPath=C:\Servers\Scum\SCUM\Binaries\Win64
set SteamCMDPath=C:\Servers\steamcmd
set InstallPath=C:\Servers\Scum

:: Horários de restart (formato 24h)
set RestartHours=01,05,09,13,17,21

:start_server
echo ========================================
echo Iniciando servidor SCUM...
echo Data/Hora: %date% %time%
echo Horarios de restart: %RestartHours%
echo ========================================

:: Check and update SCUM server
echo Verificando atualizacoes do servidor...
"%SteamCMDPath%\steamcmd.exe" +force_install_dir "%InstallPath%" +login anonymous +app_update 3792580 +quit

cd /d "%ServerPath%"

:: Inicia o servidor em background
echo Iniciando SCUMServer.exe...
start /B SCUMServer.exe -log -port=8900

echo Servidor iniciado.
echo ========================================

:: Loop principal - verifica horários de restart
:check_restart
:: Obtém hora atual
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set CurrentHour=%%a
    set CurrentMinute=%%b
    set CurrentSecond=%%c
)

:: Remove espaços da hora atual
set CurrentHour=%CurrentHour: =%

:: Verifica se é hora de restart
for %%h in (%RestartHours%) do (
    if "%CurrentHour%"=="%%h" (
        if "%CurrentMinute%"=="00" (
            echo ========================================
            echo HORA DO RESTART AUTOMATICO!
            echo Data/Hora: %date% %time%
            echo ========================================
            
            :: Aguarda 2 minutos para jogadores se prepararem
            echo Aguardando 2 minutos antes do restart...
            timeout /t 120 /nobreak >nul
            
            :: Força o fechamento do servidor
            echo Finalizando servidor...
            taskkill /f /im SCUMServer.exe >nul 2>&1
            
            :: Aguarda 10 segundos antes de reiniciar
            echo Aguardando 10 segundos antes de reiniciar...
            timeout /t 10 /nobreak >nul
            
            :: Volta ao início do loop
            goto start_server
        )
    )
)

:: Aguarda 1 minuto antes de verificar novamente
timeout /t 60 /nobreak >nul

:: Volta para verificar horário
goto check_restart

:: Additional startup arguments:
::
:: -port=8900           : Server will run on port 8900
::                        Players will connect on port 8902 (port+2)
::
:: -MaxPlayers=64       : Override max players set in ServerSettings.ini
::
:: -nobattleye          : Launch server without Battleye (not recommended)