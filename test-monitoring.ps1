# Script de teste rápido do monitoramento
# Execute: .\test-monitoring.ps1

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TESTE DE MONITORAMENTO - PeçaJá" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$errors = 0
$success = 0

# 1. Verificar containers
Write-Host "1️⃣ Verificando containers..." -ForegroundColor Yellow
try {
    $containers = docker-compose ps --format json | ConvertFrom-Json
    $backend = $containers | Where-Object { $_.Service -eq "backend" }
    $prometheus = $containers | Where-Object { $_.Service -eq "prometheus" }
    $grafana = $containers | Where-Object { $_.Service -eq "grafana" }
    
    if ($backend -and $backend.State -eq "running") {
        Write-Host "   ✅ Backend: $($backend.State)" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Backend: Não está rodando" -ForegroundColor Red
        $errors++
    }
    
    if ($prometheus -and $prometheus.State -eq "running") {
        Write-Host "   ✅ Prometheus: $($prometheus.State)" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Prometheus: Não está rodando" -ForegroundColor Red
        $errors++
    }
    
    if ($grafana -and $grafana.State -eq "running") {
        Write-Host "   ✅ Grafana: $($grafana.State)" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Grafana: Não está rodando" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "   ❌ Erro ao verificar containers: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 2. Testar Backend Health
Write-Host "2️⃣ Testando Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend Health: OK ($($response.StatusCode))" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Backend Health: Status $($response.StatusCode)" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "   ❌ Backend Health: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 3. Testar Endpoint de Métricas
Write-Host "3️⃣ Testando Endpoint de Métricas..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/metrics" -UseBasicParsing -TimeoutSec 5
    $content = $response.Content
    
    $hasHttpRequests = $content -match "pecaja_http_requests_total"
    $hasHttpDuration = $content -match "pecaja_http_request_duration_seconds"
    $hasNodeMetrics = $content -match "pecaja_process_"
    
    if ($hasHttpRequests) {
        Write-Host "   ✅ pecaja_http_requests_total encontrado" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ pecaja_http_requests_total NÃO encontrado" -ForegroundColor Red
        $errors++
    }
    
    if ($hasHttpDuration) {
        Write-Host "   ✅ pecaja_http_request_duration_seconds encontrado" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ pecaja_http_request_duration_seconds NÃO encontrado" -ForegroundColor Red
        $errors++
    }
    
    if ($hasNodeMetrics) {
        Write-Host "   ✅ Métricas do Node.js encontradas" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Métricas do Node.js NÃO encontradas" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "   ❌ Erro ao acessar métricas: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 4. Testar Prometheus
Write-Host "4️⃣ Testando Prometheus..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Prometheus: OK ($($response.StatusCode))" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Prometheus: Status $($response.StatusCode)" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "   ❌ Prometheus: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 5. Testar Grafana
Write-Host "5️⃣ Testando Grafana..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Grafana: OK ($($response.StatusCode))" -ForegroundColor Green
        $success++
    } else {
        Write-Host "   ❌ Grafana: Status $($response.StatusCode)" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "   ❌ Grafana: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 6. Gerar tráfego para criar métricas
Write-Host "6️⃣ Gerando tráfego para criar métricas..." -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
        Write-Host "   Requisição $i enviada" -ForegroundColor Gray
    } catch {
        # Ignorar erros silenciosamente
    }
    Start-Sleep -Milliseconds 500
}
Write-Host "   ✅ Tráfego gerado" -ForegroundColor Green
$success++

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESULTADO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Sucessos: $success" -ForegroundColor Green
Write-Host "❌ Erros: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "🎉 TUDO FUNCIONANDO CORRETAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Acesse:" -ForegroundColor Cyan
    Write-Host "   • Grafana: http://localhost:3002 (admin / admin123)" -ForegroundColor White
    Write-Host "   • Prometheus: http://localhost:9090" -ForegroundColor White
    Write-Host "   • Backend Metrics: http://localhost:3001/api/metrics" -ForegroundColor White
} else {
    Write-Host "⚠️  Alguns problemas foram encontrados. Verifique os erros acima." -ForegroundColor Yellow
}

Write-Host ""

