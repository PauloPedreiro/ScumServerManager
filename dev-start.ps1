# SCUM Server Manager - Dev Mode Script
# Este script garante que o processo main rode corretamente com os watchers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SCUM Server Manager - Dev Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para limpar processos ao sair
function Cleanup {
    Write-Host "`n🛑 Limpando processos..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "electron" -and $_.MainWindowTitle -like "*SCUM Server Manager*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*vite*"} | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Registrar cleanup ao sair
trap { Cleanup; break }

Write-Host "[1/4] Compilando TypeScript do main..." -ForegroundColor Green
npm run build:main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na compilação do main" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[2/4] Verificando se há processos Electron rodando..." -ForegroundColor Green
$existingElectron = Get-Process | Where-Object {$_.ProcessName -eq "electron" -and $_.MainWindowTitle -like "*SCUM Server Manager*"}
if ($existingElectron) {
    Write-Host "⚠️  Encontrado processo Electron existente. Parando..." -ForegroundColor Yellow
    $existingElectron | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "[3/4] Iniciando processo main com watchers..." -ForegroundColor Green
$env:NODE_ENV = "development"
Start-Process -FilePath "electron" -ArgumentList "dist/main/index.js" -WindowStyle Normal -PassThru | Out-Null

Write-Host "[4/4] Iniciando Vite dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "✅ Dev mode iniciado com sucesso!" -ForegroundColor Green
Write-Host "📝 Main process: rodando em background" -ForegroundColor Blue
Write-Host "🌐 Renderer: http://localhost:5173" -ForegroundColor Blue
Write-Host ""
Write-Host "Para parar todos os processos, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar Vite e aguardar
try {
    npm run dev:renderer
} finally {
    Cleanup
} 