<#
Kridar - Phase 10 favorites smoke test.

Flow: register + verify an OWNER and a GUEST -> owner creates + publishes
a property -> unauthenticated requests to /favorites are rejected (401)
-> guest adds the property to favorites -> adding it again is idempotent
(no error, still just one row) -> guest lists favorites and sees the
property -> guest removes the favorite -> listing is empty again ->
removing again is idempotent (no error) -> favoriting a property that
doesn't exist returns 404.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-favorites.ps1
#>

$base = "http://localhost:8000"
$frontendOrigin = "http://localhost:5173"
$password = "password123"

$commonHeaders = @{
    "Accept" = "application/json"
    "Origin" = $frontendOrigin
    "Referer" = "$frontendOrigin/"
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

function Get-XsrfToken {
    param($Session)
    $cookie = $Session.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "XSRF-TOKEN" }
    if (-not $cookie) { return "" }
    return [System.Net.WebUtility]::UrlDecode($cookie.Value)
}

function Invoke-Api {
    param(
        [string]$Method = "Get",
        [string]$Path,
        $Body = $null,
        [Parameter(Mandatory = $true)]$Session
    )
    $headers = $commonHeaders.Clone()
    if ($Method -ne "Get") {
        $headers["X-XSRF-TOKEN"] = Get-XsrfToken -Session $Session
    }
    $params = @{
        Uri = "$base$Path"
        Method = $Method
        Headers = $headers
        WebSession = $Session
    }
    if ($Body) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    return Invoke-RestMethod @params
}

function New-VerifiedUser {
    param([string]$NamePrefix)

    Invoke-WebRequest -Uri "$base/sanctum/csrf-cookie" -Headers $commonHeaders -SessionVariable sess -UseBasicParsing | Out-Null

    $email = "$NamePrefix-$(Get-Random -Maximum 99999)@example.com"
    $reg = Invoke-Api -Method Post -Path "/api/v1/auth/register" -Session $sess -Body @{
        name = "$NamePrefix Test"
        email = $email
        password = $password
        password_confirmation = $password
    }
    $userId = $reg.user.id

    Start-Sleep -Milliseconds 300
    $logPath = "storage/logs/laravel.log"
    if (Test-Path $logPath) {
        $raw = Get-Content -Raw $logPath
        $decoded = $raw -replace "=\r?\n", "" -replace "=3D", "=" -replace "&amp;", "&"
        $pattern = 'https?://[^\s"<]+/api/v1/auth/email/verify/' + $userId + '/[^\s"<]+'
        $urlMatches = [regex]::Matches($decoded, $pattern)
        if ($urlMatches.Count -gt 0) {
            $verifyUrl = $urlMatches[$urlMatches.Count - 1].Value.TrimEnd('.', ',', ')')
            Invoke-RestMethod -Uri $verifyUrl -WebSession $sess -Headers $commonHeaders | Out-Null
        } else {
            Write-Host "Could not find a verification link for user id $userId." -ForegroundColor Yellow
        }
    }

    Write-Host "$NamePrefix ready: id=$userId, email=$email"
    return @{ Session = $sess; UserId = $userId; Email = $email }
}

function Test-Expect401 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 401 unauthenticated error." -ForegroundColor Red
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "Correct: rejected with 401." -ForegroundColor Green
        } else {
            Show-Error $_
        }
    }
}

function Test-Expect404 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 404 not found error." -ForegroundColor Red
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "Correct: rejected with 404." -ForegroundColor Green
        } else {
            Show-Error $_
        }
    }
}

# 1-2. Two independent users - favorites have no ownership-based rules,
# any authenticated user can favorite any published property.
Show-Step "1. Register + verify OWNER"
$owner = New-VerifiedUser -NamePrefix "owner"

Show-Step "2. Register + verify GUEST"
$guest = New-VerifiedUser -NamePrefix "guest"

# 3. Owner creates + publishes a property
Show-Step "3. Owner creates + publishes a test property"
$propId = $null
try {
    $prop = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Favorite Test Property"
        description = "Used only to exercise the Phase 10 favorites flow end to end."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Favorite Street"
        city = "Rabat"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 250
    }
    $propId = $prop.property.id
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/publish" -Session $owner.Session | Out-Null
    Write-Host "Property id=$propId"
} catch {
    Show-Error $_
    exit 1
}

# 4-5. Unauthenticated access is rejected
$anonSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Test-Expect401 -Label "4. GET /favorites while logged out (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/favorites" -Session $anonSession
}
Test-Expect401 -Label "5. POST /favorites/$propId while logged out (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/favorites/$propId" -Session $anonSession
}

# 6. Guest adds the property to favorites
Show-Step "6. Guest adds the property to favorites"
try {
    $add = Invoke-Api -Method Post -Path "/api/v1/favorites/$propId" -Session $guest.Session
    if ($add.favorited -eq $true) {
        Write-Host "Correct: favorited=true." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($add | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 7. Adding it again is idempotent - no error, still favorited
Show-Step "7. Guest adds the SAME property again (should be idempotent, no error)"
try {
    $addAgain = Invoke-Api -Method Post -Path "/api/v1/favorites/$propId" -Session $guest.Session
    if ($addAgain.favorited -eq $true) {
        Write-Host "Correct: no error, favorited=true." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($addAgain | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 8. List favorites - should contain exactly one row for this property,
# even though we added it twice (double-add must not create a duplicate).
Show-Step "8. Guest lists favorites (should contain the property exactly once)"
try {
    $list = Invoke-Api -Method Get -Path "/api/v1/favorites" -Session $guest.Session
    $matches = @($list.data | Where-Object { $_.id -eq $propId })
    if ($matches.Count -eq 1) {
        Write-Host "Correct: property $propId appears exactly once in favorites." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: property appears $($matches.Count) time(s). Full response:" -ForegroundColor Red
        Write-Host ($list | ConvertTo-Json -Depth 5)
    }
} catch {
    Show-Error $_
}

# 9. Guest removes the favorite
Show-Step "9. Guest removes the property from favorites"
try {
    $remove = Invoke-Api -Method Delete -Path "/api/v1/favorites/$propId" -Session $guest.Session
    if ($remove.favorited -eq $false) {
        Write-Host "Correct: favorited=false." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($remove | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 10. Listing favorites again should now be empty
Show-Step "10. Guest lists favorites again (should be empty)"
try {
    $listAfter = Invoke-Api -Method Get -Path "/api/v1/favorites" -Session $guest.Session
    $stillThere = @($listAfter.data | Where-Object { $_.id -eq $propId })
    if ($stillThere.Count -eq 0) {
        Write-Host "Correct: favorites list no longer contains property $propId." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: property is still in the list." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 11. Removing again is idempotent - no error, just nothing to do
Show-Step "11. Guest removes the SAME property again (should be idempotent, no error)"
try {
    $removeAgain = Invoke-Api -Method Delete -Path "/api/v1/favorites/$propId" -Session $guest.Session
    if ($removeAgain.favorited -eq $false) {
        Write-Host "Correct: no error, favorited=false." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($removeAgain | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 12. Favoriting a property that doesn't exist should 404 (route model binding)
Test-Expect404 -Label "12. Guest tries to favorite a nonexistent property id (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/favorites/999999" -Session $guest.Session
}

# 13. Cleanup - unpublish (see test-reservations.ps1 for why we don't delete)
Show-Step "13. Cleanup: unpublish the test property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished property $propId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
