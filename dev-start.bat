@echo off
echo ========================================
echo   SCUM Server Manager - Dev Mode
echo ========================================
echo.

echo [1/3] Compilando TypeScript do main...
call npm run build:main
if %errorlevel% neq 0 (
    echo ❌ Erro na compilação do main
    pause
    exit /b 1
)

echo [2/3] Iniciando processo main com watchers...
start "SCUM Server Manager - Main Process" cmd /c "set NODE_ENV=development && electron dist/main/index.js"

echo [3/3] Iniciando Vite dev server...
call npm run dev:renderer

echo.
echo ✅ Dev mode iniciado com sucesso!
echo 📝 Main process: rodando em background
echo 🌐 Renderer: http://localhost:5173
echo.
echo Para parar todos os processos, feche esta janela.
pause 