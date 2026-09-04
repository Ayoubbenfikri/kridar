<#
Kridar - Phase 7 search & filters smoke test.

Flow: register -> verify email -> create + publish 3 properties with
deliberately different attributes -> exercise each filter (city,
property_type, rental_type, min_price, bedrooms, amenities, free-text
q) and check exactly which of the 3 properties come back -> check the
min_price > max_price validation error -> cleanup.

Assumes the standard AmenitiesSeeder order (WiFi=1, Swimming pool=8) -
adjust the two $amenityWifi / $amenityPool ids below if your amenities
table was seeded differently.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-property-search.ps1
#>

$base = "http://localhost:8000"
$frontendOrigin = "http://localhost:5173"
$email = "owner-$(Get-Random -Maximum 99999)@example.com"
$password = "password123"

$amenityWifi = 1
$amenityPool = 8

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

# Checks that a filtered /properties response contains exactly the
# expected set of property ids (order doesn't matter).
function Test-FilterResult {
    param(
        [string]$Label,
        [string]$Query,
        [int[]]$ExpectedIds
    )
    Show-Step $Label
    try {
        $result = Invoke-Api -Method Get -Path "/api/v1/properties?$Query" -NoAuth
        $gotIds = @($result.data | ForEach-Object { $_.id }) | Sort-Object
        $wantIds = @($ExpectedIds) | Sort-Object
        if (($gotIds -join ',') -eq ($wantIds -join ',')) {
            Write-Host "Correct: got ids [$($gotIds -join ', ')]" -ForegroundColor Green
        } else {
            Write-Host "UNEXPECTED: got ids [$($gotIds -join ', ')], expected [$($wantIds -join ', ')]" -ForegroundColor Red
        }
    } catch {
        Show-Error $_
    }
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
if (Test-Path $logPath) {
    $raw = Get-Content -Raw $logPath
    $decoded = $raw -replace "=\r?\n", "" -replace "=3D", "=" -replace "&amp;", "&"
    $userId = $reg.user.id
    $pattern = 'https?://[^\s"<]+/api/v1/auth/email/verify/' + $userId + '/[^\s"<]+'
    $urlMatches = [regex]::Matches($decoded, $pattern)
    if ($urlMatches.Count -gt 0) {
        $verifyUrl = $urlMatches[$urlMatches.Count - 1].Value.TrimEnd('.', ',', ')')
        try {
            $verify = Invoke-RestMethod -Uri $verifyUrl -WebSession $session -Headers $commonHeaders
            Write-Host $verify.message
        } catch {
            Show-Error $_
        }
    } else {
        Write-Host "Could not find a verification link for user id $userId." -ForegroundColor Yellow
    }
}

# 3. Create + publish 3 properties with deliberately different attributes
Show-Step "3. Create + publish 3 test properties"
try {
    $p1 = Invoke-Api -Method Post -Path "/api/v1/properties" -Body @{
        title = "Cozy Studio Downtown"
        description = "A small studio right in the city center, walking distance to everything."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Downtown Street"
        city = "Casablanca"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 300
        amenity_ids = @($amenityWifi)
    }
    $p2 = Invoke-Api -Method Post -Path "/api/v1/properties" -Body @{
        title = "Spacious Family Villa"
        description = "A large villa with a garden, perfect for a long-term family stay."
        property_type = "villa"
        rental_type = "long_term"
        address = "2 Family Avenue"
        city = "Casablanca"
        bedrooms = 4
        bathrooms = 3
        price_per_month = 8000
        amenity_ids = @($amenityWifi, $amenityPool)
    }
    $p3 = Invoke-Api -Method Post -Path "/api/v1/properties" -Body @{
        title = "Traditional Riad Marrakech"
        description = "An authentic riad in the Marrakech medina, available nightly or monthly."
        property_type = "riad"
        rental_type = "both"
        address = "3 Medina Alley"
        city = "Marrakech"
        bedrooms = 3
        bathrooms = 2
        max_guests = 6
        price_per_night = 600
        price_per_month = 12000
        amenity_ids = @($amenityPool)
    }

    $id1 = $p1.property.id
    $id2 = $p2.property.id
    $id3 = $p3.property.id

    Invoke-Api -Method Patch -Path "/api/v1/properties/$id1/publish" | Out-Null
    Invoke-Api -Method Patch -Path "/api/v1/properties/$id2/publish" | Out-Null
    Invoke-Api -Method Patch -Path "/api/v1/properties/$id3/publish" | Out-Null

    Write-Host "Created + published: P1=$id1 (Casablanca/apartment/short_term/300/1bd/WiFi)"
    Write-Host "                     P2=$id2 (Casablanca/villa/long_term/8000mo/4bd/WiFi+Pool)"
    Write-Host "                     P3=$id3 (Marrakech/riad/both/600-12000/3bd/Pool)"
} catch {
    Show-Error $_
    exit 1
}

# 4. Run each filter and check the exact set of ids returned
Test-FilterResult -Label "4a. city=Casablanca"          -Query "city=Casablanca"        -ExpectedIds @($id1, $id2)
Test-FilterResult -Label "4b. property_type=riad"        -Query "property_type=riad"     -ExpectedIds @($id3)
Test-FilterResult -Label "4c. rental_type=short_term"     -Query "rental_type=short_term" -ExpectedIds @($id1, $id3)
Test-FilterResult -Label "4d. rental_type=long_term"      -Query "rental_type=long_term"  -ExpectedIds @($id2, $id3)
Test-FilterResult -Label "4e. min_price=500 (price_per_night, no rental_type)" -Query "min_price=500" -ExpectedIds @($id3)
Test-FilterResult -Label "4f. bedrooms=3 (at least 3)"    -Query "bedrooms=3"             -ExpectedIds @($id2, $id3)
Test-FilterResult -Label "4g. amenities[]=$amenityPool (Swimming pool)" -Query "amenities[]=$amenityPool" -ExpectedIds @($id2, $id3)
Test-FilterResult -Label "4h. q=Riad (free-text, matches title)" -Query "q=Riad"          -ExpectedIds @($id3)
Test-FilterResult -Label "4i. combined: city=Casablanca AND bedrooms=3" -Query "city=Casablanca&bedrooms=3" -ExpectedIds @($id2)

# 4j. min_price > max_price should be rejected
Show-Step "4j. min_price=1000&max_price=500 (should fail validation)"
try {
    Invoke-Api -Method Get -Path "/api/v1/properties?min_price=1000&max_price=500" -NoAuth | Out-Null
    Write-Host "UNEXPECTED: the API accepted max_price < min_price." -ForegroundColor Red
} catch {
    if ($_.Exception.Message -match "422") {
        Write-Host "Correct: rejected with a validation error (422)." -ForegroundColor Green
    } else {
        Show-Error $_
    }
}

# 5. Cleanup
Show-Step "5. Cleanup (delete the 3 test properties)"
foreach ($id in @($id1, $id2, $id3)) {
    try {
        Invoke-Api -Method Delete -Path "/api/v1/properties/$id" | Out-Null
        Write-Host "Deleted property $id"
    } catch {
        Show-Error $_
    }
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
