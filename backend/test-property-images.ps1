<#
Kridar - Phase 6 property images smoke test.

Flow: register -> verify email -> create + publish a property -> upload 2
images in one batch (first becomes cover) -> confirm they appear on the
public property page -> try uploading 11 at once (should be rejected,
max 10) -> delete the cover image -> confirm the remaining image is
promoted to cover -> cleanup.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-property-images.ps1

NOTE: run "php artisan storage:link" once before this (so uploaded
files under storage/app/public are reachable via /storage/...).
#>

$base = "http://localhost:8000"
$frontendOrigin = "http://localhost:5173"
$email = "owner-$(Get-Random -Maximum 99999)@example.com"
$password = "password123"

# A genuinely valid 1x1 PNG, embedded so this script has no external file
# dependency. Verified server-side too (Laravel's "image" rule actually
# inspects the file content, not just the extension).
$testPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
$testPngBytes = [Convert]::FromBase64String($testPngBase64)

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

# Builds a raw multipart/form-data body by hand (Windows PowerShell 5.1
# has no -Form parameter for Invoke-RestMethod, that's a PS 6+ feature)
# and posts it as one or more files under the "images[]" field.
function Invoke-MultipartImageUpload {
    param(
        [string]$Path,
        [byte[][]]$FilesBytes,
        [string[]]$FileNames
    )
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    $ms = New-Object System.IO.MemoryStream

    for ($i = 0; $i -lt $FilesBytes.Count; $i++) {
        $headerText = "--$boundary$LF" +
            "Content-Disposition: form-data; name=`"images[]`"; filename=`"$($FileNames[$i])`"$LF" +
            "Content-Type: image/png$LF$LF"
        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerText)
        $ms.Write($headerBytes, 0, $headerBytes.Length)
        $ms.Write($FilesBytes[$i], 0, $FilesBytes[$i].Length)
        $tailBytes = [System.Text.Encoding]::UTF8.GetBytes($LF)
        $ms.Write($tailBytes, 0, $tailBytes.Length)
    }
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("--$boundary--$LF")
    $ms.Write($footerBytes, 0, $footerBytes.Length)

    $bodyBytes = $ms.ToArray()
    $ms.Dispose()

    $headers = $commonHeaders.Clone()
    $headers["X-XSRF-TOKEN"] = Get-XsrfToken

    return Invoke-RestMethod -Uri "$base$Path" -Method Post -WebSession $session -Headers $headers -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyBytes
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

# 2. Auto-verify email
Show-Step "2. Verifying email (reading storage/logs/laravel.log)"
Start-Sleep -Milliseconds 300
$logPath = "storage/logs/laravel.log"
if (-not (Test-Path $logPath)) {
    Write-Host "No log file found at $logPath - skipping verification, next steps will fail with 409." -ForegroundColor Yellow
} else {
    $raw = Get-Content -Raw $logPath
    $decoded = $raw -replace "=\r?\n", "" -replace "=3D", "=" -replace "&amp;", "&"
    $userId = $reg.user.id
    $pattern = 'https?://[^\s"<]+/api/v1/auth/email/verify/' + $userId + '/[^\s"<]+'
    $urlMatches = [regex]::Matches($decoded, $pattern)
    if ($urlMatches.Count -eq 0) {
        Write-Host "Could not find a verification link for user id $userId in the log." -ForegroundColor Yellow
    } else {
        $verifyUrl = $urlMatches[$urlMatches.Count - 1].Value.TrimEnd('.', ',', ')')
        try {
            $verify = Invoke-RestMethod -Uri $verifyUrl -WebSession $session -Headers $commonHeaders
            Write-Host ($verify | ConvertTo-Json -Depth 5)
        } catch {
            Show-Error $_
        }
    }
}

# 3. Create + publish a property
Show-Step "3. Create + publish a property"
try {
    $created = Invoke-Api -Method Post -Path "/api/v1/properties" -Body @{
        title = "Apartment With Photos"
        description = "A lovely place for automated image-upload testing."
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
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propertyId/publish" | Out-Null
    Write-Host "Property id=$propertyId created and published."
} catch {
    Show-Error $_
    exit 1
}

# 4. Upload 2 images in one batch
Show-Step "4. POST /api/v1/properties/$propertyId/images (2 files)"
try {
    $upload = Invoke-MultipartImageUpload -Path "/api/v1/properties/$propertyId/images" `
        -FilesBytes @($testPngBytes, $testPngBytes) `
        -FileNames @("photo1.png", "photo2.png")
    Write-Host ($upload | ConvertTo-Json -Depth 10)
    $images = $upload.images
    if ($images.Count -eq 2 -and $images[0].is_cover -eq $true -and $images[1].is_cover -eq $false) {
        Write-Host "Correct: 2 images uploaded, first one is the cover." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: image count or cover flags are not what we expected." -ForegroundColor Red
    }
    $coverImageId = $images[0].id
    $secondImageId = $images[1].id
} catch {
    Show-Error $_
    exit 1
}

# 5. Public property page should include both images
Show-Step "5. GET /api/v1/properties/$propertyId (public - should include images)"
try {
    $publicView = Invoke-Api -Method Get -Path "/api/v1/properties/$propertyId" -NoAuth
    if ($publicView.property.images.Count -eq 2) {
        Write-Host "Correct: public property page lists 2 images." -ForegroundColor Green
        Write-Host "Sample URL: $($publicView.property.images[0].url)"
    } else {
        Write-Host "UNEXPECTED: expected 2 images, got $($publicView.property.images.Count)." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 6. Uploading 11 at once should be rejected (max 10 per property)
Show-Step "6. POST 11 images in one request (should fail validation)"
try {
    $elevenBytes = @()
    $elevenNames = @()
    for ($i = 1; $i -le 11; $i++) {
        $elevenBytes += ,$testPngBytes
        $elevenNames += "extra$i.png"
    }
    Invoke-MultipartImageUpload -Path "/api/v1/properties/$propertyId/images" -FilesBytes $elevenBytes -FileNames $elevenNames | Out-Null
    Write-Host "UNEXPECTED: the API accepted 11 images in one request." -ForegroundColor Red
} catch {
    if ($_.Exception.Message -match "422") {
        Write-Host "Correct: rejected with a validation error (422)." -ForegroundColor Green
    } else {
        Show-Error $_
    }
}

# 7. Delete the cover image -> the second one should be promoted to cover
Show-Step "7. DELETE /api/v1/properties/$propertyId/images/$coverImageId (was the cover)"
try {
    Invoke-Api -Method Delete -Path "/api/v1/properties/$propertyId/images/$coverImageId" | Out-Null
    $recheck = Invoke-Api -Method Get -Path "/api/v1/properties/$propertyId" -NoAuth
    $remaining = $recheck.property.images
    if ($remaining.Count -eq 1 -and $remaining[0].id -eq $secondImageId -and $remaining[0].is_cover -eq $true) {
        Write-Host "Correct: cover image deleted, the remaining image was promoted to cover." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: cover promotion did not happen as expected." -ForegroundColor Red
        Write-Host ($recheck | ConvertTo-Json -Depth 10)
    }
} catch {
    Show-Error $_
}

# 8. Cleanup
Show-Step "8. DELETE /api/v1/properties/$propertyId (cleanup)"
try {
    $deleted = Invoke-Api -Method Delete -Path "/api/v1/properties/$propertyId"
    Write-Host ($deleted | ConvertTo-Json -Depth 5)
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
