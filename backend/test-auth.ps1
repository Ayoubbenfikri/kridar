<#
Kridar - Phase 4 auth smoke test.

What it does, in order: register -> me -> logout -> me (expect 401) -> login -> me.
It also tells you where to find the email verification link (storage/logs/laravel.log).

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from the backend/ folder:
       powershell -ExecutionPolicy Bypass -File .\test-auth.ps1

Why the extra headers: Sanctum only treats a request as coming from the
frontend SPA (and therefore applies session + CSRF handling) when the
Origin/Referer header matches an entry in SANCTUM_STATEFUL_DOMAINS. A real
browser sends this automatically; PowerShell/curl do not, so this script
sets it manually to http://localhost:5173 (the configured frontend origin)
to simulate what the real React app will do later.

Why not plain curl: Sanctum's SPA auth also needs a CSRF token read from a
cookie and echoed back as a header on every write request (POST/PUT/DELETE).
The Get-XsrfToken helper below does that automatically.
#>

$base = "http://localhost:8000"
$frontendOrigin = "http://localhost:5173"
$email = "test-$(Get-Random -Maximum 99999)@example.com"
$password = "password123"

function Get-XsrfToken {
    $cookie = $session.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "XSRF-TOKEN" }
    if (-not $cookie) {
        Write-Host "WARNING: no XSRF-TOKEN cookie found in session yet." -ForegroundColor Yellow
        return ""
    }
    return [System.Net.WebUtility]::UrlDecode($cookie.Value)
}

function Show-Step {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function Show-Error {
    param($ErrorRecord)
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host ("Exception type: " + $ErrorRecord.Exception.GetType().FullName)
    Write-Host ("Exception message: " + $ErrorRecord.Exception.Message)

    if ($ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
        Write-Host "Response body:"
        Write-Host $ErrorRecord.ErrorDetails.Message
    } elseif ($ErrorRecord.Exception.Response) {
        try {
            $stream = $ErrorRecord.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $bodyText = $reader.ReadToEnd()
            Write-Host "Response body (read manually):"
            Write-Host $bodyText
        } catch {
            Write-Host "(could not read response body)"
        }
    } else {
        Write-Host "(no response object at all - likely could not reach the server, or PowerShell version mismatch)"
    }
}

$commonHeaders = @{
    "Accept" = "application/json"
    "Origin" = $frontendOrigin
    "Referer" = "$frontendOrigin/"
}

# 0. Prime the session + CSRF cookie
Show-Step "0. GET /sanctum/csrf-cookie"
try {
    Invoke-WebRequest -Uri "$base/sanctum/csrf-cookie" -Headers $commonHeaders -SessionVariable session -UseBasicParsing | Out-Null
    Write-Host "Session cookie jar initialized."
    $token = Get-XsrfToken
    Write-Host ("XSRF token captured: " + [bool]$token)
} catch {
    Show-Error $_
}

# 1. Register
Show-Step "1. POST /api/v1/auth/register ($email)"
$registerBody = @{
    name = "Test User"
    email = $email
    password = $password
    password_confirmation = $password
} | ConvertTo-Json

try {
    $headers1 = $commonHeaders.Clone()
    $headers1["X-XSRF-TOKEN"] = Get-XsrfToken
    $registerParams = @{
        Uri = "$base/api/v1/auth/register"
        Method = "Post"
        WebSession = $session
        Headers = $headers1
        ContentType = "application/json"
        Body = $registerBody
    }
    $register = Invoke-RestMethod @registerParams
    $register | ConvertTo-Json -Depth 5
} catch {
    Show-Error $_
}

# 2. Me (should already be logged in - register() auto-logs in)
Show-Step "2. GET /api/v1/auth/me"
try {
    $meParams = @{
        Uri = "$base/api/v1/auth/me"
        WebSession = $session
        Headers = $commonHeaders
    }
    $me = Invoke-RestMethod @meParams
    $me | ConvertTo-Json -Depth 5
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host ">>> Check storage/logs/laravel.log now for the verification email." -ForegroundColor Yellow
Write-Host ">>> Look for a line containing /api/v1/auth/email/verify/" -ForegroundColor Yellow
Write-Host ">>> See the bottom of this script for how to test that link." -ForegroundColor Yellow

# 3. Logout
Show-Step "3. POST /api/v1/auth/logout"
try {
    $headers3 = $commonHeaders.Clone()
    $headers3["X-XSRF-TOKEN"] = Get-XsrfToken
    $logoutParams = @{
        Uri = "$base/api/v1/auth/logout"
        Method = "Post"
        WebSession = $session
        Headers = $headers3
    }
    $logout = Invoke-RestMethod @logoutParams
    $logout | ConvertTo-Json -Depth 5
} catch {
    Show-Error $_
}

# 4. Me while logged out (should fail with 401)
Show-Step "4. GET /api/v1/auth/me (expect 401, logged out)"
try {
    $meParams2 = @{
        Uri = "$base/api/v1/auth/me"
        WebSession = $session
        Headers = $commonHeaders
    }
    Invoke-RestMethod @meParams2
} catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "Correctly rejected: 401" -ForegroundColor Green
    } else {
        Show-Error $_
    }
}

# 5. Login again
Show-Step "5. POST /api/v1/auth/login"
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
try {
    $headers5 = $commonHeaders.Clone()
    $headers5["X-XSRF-TOKEN"] = Get-XsrfToken
    $loginParams = @{
        Uri = "$base/api/v1/auth/login"
        Method = "Post"
        WebSession = $session
        Headers = $headers5
        ContentType = "application/json"
        Body = $loginBody
    }
    $login = Invoke-RestMethod @loginParams
    $login | ConvertTo-Json -Depth 5
} catch {
    Show-Error $_
}

# 6. Me again (should work now)
Show-Step "6. GET /api/v1/auth/me (should work again)"
try {
    $meParams3 = @{
        Uri = "$base/api/v1/auth/me"
        WebSession = $session
        Headers = $commonHeaders
    }
    $me2 = Invoke-RestMethod @meParams3
    $me2 | ConvertTo-Json -Depth 5
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done. To test email verification: ===" -ForegroundColor Cyan
Write-Host "1. Open storage/logs/laravel.log, find the last /api/v1/auth/email/verify/... URL."
Write-Host "2. Paste the FULL url (with the expires and signature query params) below, then run in this same session:"
Write-Host '   $verifyUrl = "<paste-url-here>"'
Write-Host '   Invoke-RestMethod -Uri $verifyUrl -WebSession $session -Headers @{ "Accept" = "application/json" }'
Write-Host "   (must reuse the same session from this run - the link only works for the currently logged-in user)"
