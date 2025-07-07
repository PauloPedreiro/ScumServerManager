# SCUM Server Manager - Dev Mode Script (Versão Simples)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SCUM Server Manager - Dev Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Compilando TypeScript do main..." -ForegroundColor Green
npm run build:main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na compilação do main" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[2/3] Iniciando processo main..." -ForegroundColor Green
$env:NODE_ENV = "development"
Start-Process -FilePath "electron" -ArgumentList "dist/main/index.js" -WindowStyle Normal

Write-Host "[3/3] Iniciando Vite dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "✅ Dev mode iniciado!" -ForegroundColor Green
Write-Host "📝 Main process: rodando em background" -ForegroundColor Blue
Write-Host "🌐 Renderer: http://localhost:5173" -ForegroundColor Blue
Write-Host ""

npm run dev:renderer 