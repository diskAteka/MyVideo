# Сохраните это как diagnosis.ps1 и выполните
cd C:\KP\MyVideo\Nginx

Write-Host "=== ДИАГНОСТИКА NGINX ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Проверка относительного пути:" -ForegroundColor Yellow
$fullPath = Resolve-Path "../frontend/dist" -ErrorAction SilentlyContinue
if ($fullPath) {
    Write-Host "   ../frontend/dist -> $fullPath" -ForegroundColor Green
} else {
    Write-Host "   ../frontend/dist -> ПУТЬ НЕ НАЙДЕН!" -ForegroundColor Red
}
Write-Host ""

Write-Host "2. Проверка index.html:" -ForegroundColor Yellow
if (Test-Path "C:\KP\MyVideo\frontend\dist\index.html") {
    $size = (Get-Item "C:\KP\MyVideo\frontend\dist\index.html").Length
    Write-Host "   index.html найден, размер: $size байт" -ForegroundColor Green
    Write-Host "   Первые 3 строки:"
    Get-Content "C:\KP\MyVideo\frontend\dist\index.html" -TotalCount 3 | ForEach-Object { Write-Host "     $_" }
} else {
    Write-Host "   index.html НЕ НАЙДЕН!" -ForegroundColor Red
}
Write-Host ""

Write-Host "3. Проверка прав доступа:" -ForegroundColor Yellow
$acl = Get-Acl "C:\KP\MyVideo\frontend\dist" -ErrorAction SilentlyContinue
if ($acl) {
    Write-Host "   Папка доступна для чтения" -ForegroundColor Green
} else {
    Write-Host "   ОШИБКА ДОСТУПА К ПАПКЕ!" -ForegroundColor Red
}
Write-Host ""

Write-Host "4. Проверка запуска Nginx:" -ForegroundColor Yellow
$nginx = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginx) {
    Write-Host "   Nginx запущен, PID: $($nginx.Id -join ', ')" -ForegroundColor Green
} else {
    Write-Host "   Nginx НЕ ЗАПУЩЕН!" -ForegroundColor Red
}
Write-Host ""

Write-Host "5. Проверка портов:" -ForegroundColor Yellow
$port443 = netstat -ano | Select-String ":443 " | Select-String "LISTENING"
if ($port443) {
    Write-Host "   Порт 443 слушается" -ForegroundColor Green
} else {
    Write-Host "   Порт 443 НЕ СЛУШАЕТСЯ!" -ForegroundColor Red
}
Write-Host ""

Write-Host "6. Проверка через curl (без PowerShell):" -ForegroundColor Yellow
Write-Host "   Выполняю запрос..."
$result = curl.exe -k -s https://localhost/test.txt 2>&1
if ($result) {
    Write-Host "   Ответ: $result" -ForegroundColor Cyan
} else {
    Write-Host "   Ответ пустой или ошибка" -ForegroundColor Red
}
Write-Host ""

Write-Host "7. Последние ошибки Nginx:" -ForegroundColor Yellow
$errors = Get-Content "logs\error.log" -Tail 10 -ErrorAction SilentlyContinue
if ($errors) {
    $errors | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
} else {
    Write-Host "   Нет ошибок в логе" -ForegroundColor Green
}