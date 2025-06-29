@ECHO OFF
start /w "" "%~dp0\VC_redist.x86.exe" /q /norestart
IF %ERRORLEVEL% == 3010 EXIT /B 0
EXIT /B %ERRORLEVEL%
