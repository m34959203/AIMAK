# === ИМПОРТ СТАТЕЙ С WORDPRESS ===
$ErrorActionPreference = "Continue"

try {
    $oldSite = "https://aimaqaqshamy.kz"
    $newApi = "https://aimak-api-w8ps.onrender.com"

    Write-Host "`n=== ИМПОРТ СТАТЕЙ ===" -ForegroundColor Cyan

    # Пробуждение API
    Write-Host "Пробуждаем API..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "$newApi/api/health" -TimeoutSec 60 -UseBasicParsing | Out-Null
        Write-Host "API готов!" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка пробуждения API" -ForegroundColor Red
        throw
    }

    # Логин
    Write-Host "Вход в систему..." -ForegroundColor Yellow
    $login = @{ email = "admin@aimakakshamy.kz"; password = "admin123" } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "$newApi/api/auth/login" -Method POST -Body $login -ContentType "application/json"
    Write-Host "✓ Вход выполнен" -ForegroundColor Green

    # Категория
    $categories = Invoke-RestMethod -Uri "$newApi/api/categories"
    $category = $categories | Where-Object { $_.slug -eq "zhanalyqtar" }
    Write-Host "✓ Категория: $($category.nameKz)" -ForegroundColor Green

    # Статьи из WordPress
    $wpPosts = Invoke-RestMethod -Uri "$oldSite/wp-json/wp/v2/posts?per_page=10"
    Write-Host "✓ Получено $($wpPosts.Count) статей`n" -ForegroundColor Green

    # Импорт
    $imported = 0
    foreach ($wpPost in $wpPosts) {
        $title = $wpPost.title.rendered -replace '<[^>]+>', ''
        $slug = $title.ToLower() -replace '[^a-z0-9]', '-' + "-wp$($wpPost.id)"

        $article = @{
            titleKz = $title
            slugKz = $slug
            contentKz = $wpPost.content.rendered
            excerptKz = $title.Substring(0, [Math]::Min(200, $title.Length))
            categoryId = $category.id
            authorId = $auth.user.id
            status = "PUBLISHED"
            published = $true
        } | ConvertTo-Json -Depth 10

        try {
            Invoke-RestMethod -Uri "$newApi/api/articles" -Method POST -Body $article -Headers @{"Authorization"="Bearer $($auth.accessToken)";"Content-Type"="application/json"} | Out-Null
            Write-Host "✓ [$($imported+1)] $($title.Substring(0,50))..." -ForegroundColor Green
            $imported++
        } catch {
            Write-Host "⊘ Пропущено" -ForegroundColor Yellow
        }
    }

    Write-Host "`n=== ГОТОВО ===" -ForegroundColor Green
    Write-Host "Импортировано: $imported статей" -ForegroundColor Cyan
    [Console]::Beep(1000,300)

} catch {
    Write-Host "`nОШИБКА: $($_.Exception.Message)" -ForegroundColor Red
    [Console]::Beep(400,500)
} finally {
    Write-Host "`nНажмите Enter..." -ForegroundColor Gray
    Read-Host
}
