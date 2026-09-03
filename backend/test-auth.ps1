<#
Kridar — Phase 4 auth smoke test.

What it does, in order: register -> me -> logout -> login -> me -> logout.
It also prints where to find the email verification link (storage/logs/laravel.log)
and, if you paste that link's id+hash below, verifies the email too.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from the backend/ folder:
       powershell -ExecutionPolicy Bypass -File .\test-auth.ps1

Why not plain curl: Sanctum's SPA auth needs a CSRF token read from a cookie
and echoed back as a header on every write request (POST/PUT/DELETE) — that's
what the Get-XsrfToken helper below does automatically, the same way axios
would in the real React app later.
#>

$base = "http://localhost:8000"
$email = "test-$(Get-Random -Maximum 99999)@example.com"
$password = "password123"

function Get-XsrfToken {
    $cookie = $session.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "XSRF-TOKEN" }
    return [System.Net.WebUtility]::UrlDecode($cookie.Value)
}

function Show-Step($title) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

# 0. Prime the session + CSRF cookie
Show-Step "0. GET /sanctum/csrf-cookie"
Invoke-WebRequest -Uri "$base/sanctum/csrf-cookie" -SessionVariable session | Out-Null
Write-Host "Session cookie jar initialized."

# 1. Register
Show-Step "1. POST /api/v1/auth/register  ($email)"
$registerBody = @{
    name = "Test User"
    email = $email
    password = $password
    password_confirmation = $password
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$base/api/v1/auth/register" -Method Post `
        -WebSession $session `
        -Headers @{ "X-XSRF-TOKEN" = (Get-XsrfToken); "Accept" = "application/json" } `
        -ContentType "application/json" -Body $registerBody
    $register | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    $_.Exception.Response | Out-Null
    Write-Host $_.ErrorDetails.Message
}

# 2. Me (should already be logged in — register() auto-logs in)
Show-Step "2. GET /api/v1/auth/me"
try {
    $me = Invoke-RestMethod -Uri "$base/api/v1/auth/me" -WebSession $session -Headers @{ "Accept" = "application/json" }
    $me | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

Write-Host "`n>>> Check storage/logs/laravel.log now for the verification email." -ForegroundColor Yellow
Write-Host ">>> Look for a line containing '/api/v1/auth/email/verify/'." -ForegroundColor Yellow
Write-Host ">>> Open that exact URL in the SAME PowerShell session below if you want to test verification (see bottom of this script)." -ForegroundColor Yellow

# 3. Logout
Show-Step "3. POST /api/v1/auth/logout"
try {
    $logout = Invoke-RestMethod -Uri "$base/api/v1/auth/logout" -Method Post `
        -WebSession $session `
        -Headers @{ "X-XSRF-TOKEN" = (Get-XsrfToken); "Accept" = "application/json" }
    $logout | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# 4. Me while logged out (should fail with 401)
Show-Step "4. GET /api/v1/auth/me (expect 401 — logged out)"
try {
    Invoke-RestMethod -Uri "$base/api/v1/auth/me" -WebSession $session -Headers @{ "Accept" = "application/json" }
} catch {
    Write-Host "Correctly rejected: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Green
}

# 5. Login again
Show-Step "5. POST /api/v1/auth/login"
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
try {
    $login = Invoke-RestMethod -Uri "$base/api/v1/auth/login" -Method Post `
        -WebSession $session `
        -Headers @{ "X-XSRF-TOKEN" = (Get-XsrfToken); "Accept" = "application/json" } `
        -ContentType "application/json" -Body $loginBody
    $login | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# 6. Me again (should work now)
Show-Step "6. GET /api/v1/auth/me (should work again)"
try {
    $me2 = Invoke-RestMethod -Uri "$base/api/v1/auth/me" -WebSession $session -Headers @{ "Accept" = "application/json" }
    $me2 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

Write-Host "`n=== Done. To test email verification: ===" -ForegroundColor Cyan
Write-Host "1. Open storage/logs/laravel.log, find the last '/api/v1/auth/email/verify/...' URL."
Write-Host "2. Paste the FULL url (with ?expires=...&signature=...) into the variable below and run it manually in this same session:"
Write-Host '   Invoke-RestMethod -Uri "<paste-url-here>" -WebSession $session -Headers @{ "Accept" = "application/json" }'
Write-Host "   (must reuse `$session` from this run — the link only works for the currently logged-in user, that's what 'auth:sanctum' + the signed hash check enforce)"
