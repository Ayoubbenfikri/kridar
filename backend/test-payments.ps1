<#
Kridar - Phase 8.5 payments smoke test (FakeCmiGateway).

Flow: register + verify an OWNER and a GUEST -> owner creates + publishes
a property -> guest books it -> owner confirms -> guest tries to pay
BEFORE confirmation on a second, still-pending reservation (should fail)
-> guest initiates payment on the confirmed one -> callback with
success=false (payment fails) -> guest retries -> callback with
success=true (payment succeeds) -> trying to pay again should fail
(already paid) -> GET /payments/{id} -> GET /reservations/{id}/payments
shows both attempts.

Remember: this uses FakeCmiGateway, not a real CMI account. The
/payments/{id}/callback endpoint is PUBLIC (that's how a real gateway's
webhook works too) and this fake version does not verify any signature -
the test script calls it directly to simulate what CMI would normally
call automatically.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-payments.ps1
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

function Test-Expect409 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 409 conflict." -ForegroundColor Red
    } catch {
        if ($_.Exception.Message -match "409") {
            Write-Host "Correct: rejected with 409." -ForegroundColor Green
            if ($_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
        } else {
            Show-Error $_
        }
    }
}

function D {
    param([int]$Days)
    return (Get-Date).AddDays($Days).ToString("yyyy-MM-dd")
}

# 1-2. Two independent users
Show-Step "1. Register + verify OWNER"
$owner = New-VerifiedUser -NamePrefix "owner"

Show-Step "2. Register + verify GUEST"
$guest = New-VerifiedUser -NamePrefix "guest"

# 3. Owner creates + publishes a property
Show-Step "3. Owner creates + publishes a test property (price_per_night=300)"
$propId = $null
try {
    $prop = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Payment Test Property"
        description = "Used only to exercise the Phase 8.5 payment flow end to end."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Payment Street"
        city = "Casablanca"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 300
    }
    $propId = $prop.property.id
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/publish" -Session $owner.Session | Out-Null
    Write-Host "Property id=$propId"
} catch {
    Show-Error $_
    exit 1
}

# 4. Guest books it (3 nights -> total_price = 900), still pending
Show-Step "4. Guest books the property (3 nights, pending)"
$reservationId = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propId
        rental_type = "short_term"
        start_date = D 7
        end_date = D 10
        guests_count = 2
    }
    $reservationId = $booking.reservation.id
    Write-Host "Reservation $reservationId created, status=$($booking.reservation.status), total_price=$($booking.reservation.total_price)"
} catch {
    Show-Error $_
    exit 1
}

# 5. Paying a still-pending reservation should fail (must be confirmed first)
Test-Expect409 -Label "5. Guest tries to pay while reservation is still pending (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
}

# 6. Owner confirms the reservation
Show-Step "6. Owner confirms reservation $reservationId"
try {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationId/confirm" -Session $owner.Session | Out-Null
    Write-Host "Confirmed."
} catch {
    Show-Error $_
    exit 1
}

# 7. Guest initiates a payment (attempt #1)
Show-Step "7. Guest initiates a payment (attempt #1)"
$payment1Id = $null
try {
    $pay1 = Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
    $payment1Id = $pay1.payment.id
    $amount1 = $pay1.payment.amount
    if ($pay1.payment.status -eq "pending" -and [decimal]$amount1 -eq 900) {
        Write-Host "Correct: payment $payment1Id is pending, amount=$amount1, redirect_url=$($pay1.redirect_url)" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$($pay1.payment.status), amount=$amount1" -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 8. Simulate CMI calling back with a FAILURE (attempt #1 fails)
Show-Step "8. Callback for payment $payment1Id with success=false (simulates a failed card)"
try {
    $cb1 = Invoke-Api -Method Post -Path "/api/v1/payments/$payment1Id/callback" -Session $guest.Session -Body @{
        success = $false
    }
    if ($cb1.payment.status -eq "failed") {
        Write-Host "Correct: payment $payment1Id is now failed" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$($cb1.payment.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 9. Guest retries: initiates a second payment attempt for the same reservation
Show-Step "9. Guest retries: initiates a payment (attempt #2)"
$payment2Id = $null
try {
    $pay2 = Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
    $payment2Id = $pay2.payment.id
    Write-Host "New payment attempt $payment2Id created (status=$($pay2.payment.status))"
} catch {
    Show-Error $_
    exit 1
}

# 10. Simulate CMI calling back with SUCCESS this time
Show-Step "10. Callback for payment $payment2Id with success=true"
try {
    $cb2 = Invoke-Api -Method Post -Path "/api/v1/payments/$payment2Id/callback" -Session $guest.Session -Body @{
        success = $true
        provider_transaction_id = "TEST-TXN-12345"
    }
    if ($cb2.payment.status -eq "paid" -and $cb2.payment.provider_transaction_id -eq "TEST-TXN-12345") {
        Write-Host "Correct: payment $payment2Id is now paid (provider_transaction_id=TEST-TXN-12345)" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$($cb2.payment.status), provider_transaction_id=$($cb2.payment.provider_transaction_id)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 11. Trying to pay again should fail (already paid)
Test-Expect409 -Label "11. Guest tries to pay again (should fail: already paid)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
}

# 12. GET /payments/{id} - the owner can also view it (not just the guest)
Show-Step "12. GET /payments/$payment2Id as OWNER (owner can view payments on their property)"
try {
    $view = Invoke-Api -Method Get -Path "/api/v1/payments/$payment2Id" -Session $owner.Session
    Write-Host "Owner can see payment $($view.payment.id), status=$($view.payment.status)" -ForegroundColor Green
} catch {
    Show-Error $_
}

# 13. GET /reservations/{id}/payments - both attempts should be listed
Show-Step "13. GET /reservations/$reservationId/payments (should list both attempts)"
try {
    $list = Invoke-Api -Method Get -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
    $count = $list.data.Count
    if ($count -eq 2) {
        Write-Host "Correct: 2 payment attempts on this reservation." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $count payment attempt(s) found (expected 2)." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 14. Cleanup - unpublish (see test-reservations.ps1 for why we don't delete)
Show-Step "14. Cleanup: unpublish the test property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished property $propId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
