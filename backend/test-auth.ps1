<#
Kridar - Phase 4 auth smoke test.

What it does, in order: register -> me -> logout -> me (expect 401) -> login -> me.
It also tells you where to find the email verification link (storage/logs/laravel.log).

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from the backend/ folder:
       powershell -ExecutionPolicy Bypass -File .\test-auth.ps1

Why not plain curl: Sanctum's SPA auth needs a CSRF token read from a cookie
and echoed back as a header on every write request (POST/PUT/DELETE). The
Get-XsrfToken helper below does that automatically, the same way axios would
in the real React app later.
#>

$base = "http://localhost:8000"
$email = "test-$(Get-Random -Maximum 99999)@example.com"
$password = "password123"

function Get-XsrfToken {
    $cookie = $session.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "XSRF-TOKEN" }
    return [System.Net.WebUtility]::UrlDecode($cookie.Value)
}

function Show-Step {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

# 0. Prime the session + CSRF cookie
Show-Step "0. GET /sanctum/csrf-cookie"
Invoke-WebRequest -Uri "$base/sanctum/csrf-cookie" -SessionVariable session | Out-Null
Write-Host "Session cookie jar initialized."

# 1. Register
Show-Step "1. POST /api/v1/auth/register ($email)"
$registerBody = @{
    name = "Test User"
    email = $email
    password = $password
    password_confirmation = $password
} | ConvertTo-Json

try {
    $registerParams = @{
        Uri = "$base/api/v1/auth/register"
        Method = "Post"
        WebSession = $session
        Headers = @{ "X-XSRF-TOKEN" = (Get-XsrfToken); "Accept" = "application/json" }
        ContentType = "application/json"
        Body = $registerBody
    }
    $register = Invoke-RestMethod @registerParams
    $register | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# 2. Me (should already be logged in - register() auto-logs in)
Show-Step "2. GET /api/v1/auth/me"
try {
    $meParams = @{
        Uri = "$base/api/v1/auth/me"
        WebSession = $session
        Headers = @{ "Accept" = "application/json" }
    }
    $me = Invoke-RestMethod @meParams
    $me | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

Write-Host ""
Write-Host ">>> Check storage/logs/laravel.log now for the verification email." -ForegroundColor Yellow
Write-Host ">>> Look for a line containing /api/v1/auth/email/verify/" -ForegroundColor Yellow
Write-Host ">>> See the bottom of this script for how to test that link." -ForegroundColor Yellow

# 3. Logout
Show-Step "3. POST /api/v1/auth/logout"
try {
    $logoutParams = @{
        Uri = "$base/api/v1/auth/logout"
        Method = "Post"
        WebSession = $session
        Headers = @{ "X-XSRF-TOKEN" = (Get-XsrfToken); "Accept" = "application/json" }
    }
    $logout = Invoke-RestMethod @logoutParams
    $logout | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# 4. Me while logged out (should fail with 401)
Show-Step "4. GET /api/v1/auth/me (expect 401, logged out)"
try {
    $meParams2 = @{
        Uri = "$base/api/v1/auth/me"
        WebSession = $session
        Headers = @{ "Accept" = "application/json" }
    }
    Invoke-RestMethod @meParams2
} catch {
    Write-Host "Correctly rejected: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Green
}

# 5. Login again
Show-Step "5. POST /api/v1/auth/login"
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
try {
    $loginParams = @{
        Uri = "$base/api/v1/auth/login"
        Method = "Post"
        WebSession = $session
        Headers = @{ "X-XSRF-TOKEN" = (Get-XsrfToken); "Accept" = "application/json" }
        ContentType = "application/json"
        Body = $loginBody
    }
    $login = Invoke-RestMethod @loginParams
    $login | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# 6. Me again (should work now)
Show-Step "6. GET /api/v1/auth/me (should work again)"
try {
    $meParams3 = @{
        Uri = "$base/api/v1/auth/me"
        WebSession = $session
        Headers = @{ "Accept" = "application/json" }
    }
    $me2 = Invoke-RestMethod @meParams3
    $me2 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAILED:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

Write-Host ""
Write-Host "=== Done. To test email verification: ===" -ForegroundColor Cyan
Write-Host "1. Open storage/logs/laravel.log, find the last /api/v1/auth/email/verify/... URL."
Write-Host "2. Paste the FULL url (with the expires and signature query params) below, then run in this same session:"
Write-Host '   $verifyUrl = "<paste-url-here>"'
Write-Host '   Invoke-RestMethod -Uri $verifyUrl -WebSession $session -Headers @{ "Accept" = "application/json" }'
Write-Host "   (must reuse the same session from this run - the link only works for the currently logged-in user)"
