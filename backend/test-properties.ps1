<#
Kridar - Phase 5 property management smoke test.

Flow: register -> verify email (auto-extracted from the log) -> create a
draft property -> confirm it's hidden from the public index -> publish it
-> confirm it now appears -> update a field -> unpublish -> delete.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-properties.ps1
#>

$base = "http://localhost:8000"
$frontendOrigin = "http://localhost:5173"
$email = "owner-$(Get-Random -Maximum 99999)@example.com"
$password = "password123"

function Get-XsrfToken {
    $cookie = $session.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "XSRF-TOKEN" }
    if (-not $cookie) { return "" }
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
    Write-Host ("Exception message: " + $ErrorRecord.Exception.Message)
    if ($ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
        Write-Host "Response body:"
        Write-Host $ErrorRecord.ErrorDetails.Message
    }
}

$commonHeaders = @{
    "Accept" = "application/json"
    "Origin" = $frontendOrigin
    "Referer" = "$frontendOrigin/"
}

function Invoke-Api {
    param(
        [string]$Method = "Get",
        [string]$Path,
        $Body = $null,
        [switch]$NoAuth
    )
    $headers = $commonHeaders.Clone()
    if ($Method -ne "Get") {
        $headers["X-XSRF-TOKEN"] = Get-XsrfToken
    }
    $params = @{
        Uri = "$base$Path"
        Method = $Method
        Headers = $headers
    }
    if (-not $NoAuth) { $params["WebSession"] = $session }
    if ($Body) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    return Invoke-RestMethod @params
}

# 0. CSRF cookie
Show-Step "0. GET /sanctum/csrf-cookie"
Invoke-WebRequest -Uri "$base/sanctum/csrf-cookie" -Headers $commonHeaders -SessionVariable session -UseBasicParsing | Out-Null
Write-Host "Session ready."

# 1. Register a fresh owner
Show-Step "1. POST /api/v1/auth/register ($email)"
try {
    $reg = Invoke-Api -Method Post -Path "/api/v1/auth/register" -Body @{
        name = "Test Owner"
        email = $email
        password = $password
        password_confirmation = $password
    }
    Write-Host "Registered, user id = $($reg.user.id)"
} catch {
    Show-Error $_
    exit 1
}

# 2. Auto-verify email (read the link straight out of the log)
Show-Step "2. Verifying email (reading storage/logs/laravel.log)"
Start-Sleep -Milliseconds 300
$logPath = "storage/logs/laravel.log"
if (-not (Test-Path $logPath)) {
    Write-Host "No log file found at $logPath - skipping verification, property creation will fail with 409." -ForegroundColor Yellow
} else {
    $raw = Get-Content -Raw $logPath
    # Undo quoted-printable soft line breaks / encoded '=' that Laravel's
    # log mail driver may introduce so the URL isn't split across lines,
    # and undo HTML-entity escaping ('&amp;' -> '&') from the HTML part of
    # the email so the query string (expires/signature) is reconstructed
    # correctly - otherwise the signature check fails with 403.
    $decoded = $raw -replace "=\r?\n", "" -replace "=3D", "=" -replace "&amp;", "&"
    $urlMatches = [regex]::Matches($decoded, 'https?://[^\s"<]+/api/v1/auth/email/verify/[^\s"<]+')
    if ($urlMatches.Count -eq 0) {
        Write-Host "Could not find a verification link in the log." -ForegroundColor Yellow
    } else {
        $verifyUrl = $urlMatches[0].Value.TrimEnd('.', ',', ')')
        try {
            $verify = Invoke-RestMethod -Uri $verifyUrl -WebSession $session -Headers $commonHeaders
            Write-Host ($verify | ConvertTo-Json -Depth 5)
        } catch {
            Show-Error $_
        }
    }
}

# 3. Create a draft property
Show-Step "3. POST /api/v1/properties (create as draft)"
try {
    $created = Invoke-Api -Method Post -Path "/api/v1/properties" -Body @{
        title = "Cozy Test Apartment"
        description = "A lovely place for automated testing purposes only."
        property_type = "apartment"
        rental_type = "short_term"
        address = "123 Test Street"
        city = "Casablanca"
        bedrooms = 2
        bathrooms = 1
        max_guests = 4
        price_per_night = 450
    }
    $propertyId = $created.property.id
    Write-Host "Created property id=$propertyId status=$($created.property.status)"
} catch {
    Show-Error $_
    exit 1
}

# 4. Public index should NOT show the draft
Show-Step "4. GET /api/v1/properties (public index - draft should be absent)"
try {
    $index1 = Invoke-Api -Method Get -Path "/api/v1/properties" -NoAuth
    $found = $index1.data | Where-Object { $_.id -eq $propertyId }
    if ($found) {
        Write-Host "UNEXPECTED: draft property appeared in the public index!" -ForegroundColor Red
    } else {
        Write-Host "Correct: draft property is not in the public index." -ForegroundColor Green
    }
} catch {
    Show-Error $_
}

# 5. Publish it
Show-Step "5. PATCH /api/v1/properties/$propertyId/publish"
try {
    $published = Invoke-Api -Method Patch -Path "/api/v1/properties/$propertyId/publish"
    Write-Host "Status is now: $($published.property.status)"
} catch {
    Show-Error $_
}

# 6. Public index SHOULD show it now
Show-Step "6. GET /api/v1/properties (should now include it)"
try {
    $index2 = Invoke-Api -Method Get -Path "/api/v1/properties" -NoAuth
    $found2 = $index2.data | Where-Object { $_.id -eq $propertyId }
    if ($found2) {
        Write-Host "Correct: published property appears in the public index." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: published property is missing from the index!" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 7. Update a field
Show-Step "7. PATCH /api/v1/properties/$propertyId (update price)"
try {
    $updated = Invoke-Api -Method Patch -Path "/api/v1/properties/$propertyId" -Body @{ price_per_night = 500 }
    Write-Host "New price_per_night: $($updated.property.price_per_night)"
} catch {
    Show-Error $_
}

# 8. Unpublish
Show-Step "8. PATCH /api/v1/properties/$propertyId/unpublish"
try {
    $unpub = Invoke-Api -Method Patch -Path "/api/v1/properties/$propertyId/unpublish"
    Write-Host "Status is now: $($unpub.property.status)"
} catch {
    Show-Error $_
}

# 9. Delete
Show-Step "9. DELETE /api/v1/properties/$propertyId"
try {
    $deleted = Invoke-Api -Method Delete -Path "/api/v1/properties/$propertyId"
    Write-Host ($deleted | ConvertTo-Json -Depth 5)
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
