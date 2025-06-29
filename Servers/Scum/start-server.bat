@echo off
set ServerPath=C:\Servers\Scum\SCUM\Binaries\Win64
set SteamCMDPath=C:\Servers\steamcmd
set InstallPath=C:\Servers\Scum

:: Check and update SCUM server
"%SteamCMDPath%\steamcmd.exe" +force_install_dir "%InstallPath%" +login anonymous +app_update 3792580 +quit

cd /d "%ServerPath%"
start SCUMServer.exe -log -port=8900

:: Additional startup arguments:
::
:: -port=8900           : Server will run on port 8900
::                        Players will connect on port 8902 (port+2)
::
:: -MaxPlayers=64       : Override max players set in ServerSettings.ini
::
:: -nobattleye          : Launch server without Battleye (not recommended)
pause