<#
Kridar - Phase 8 reservations & availability smoke test.

Flow: register + verify an OWNER and a GUEST (two independent sessions)
-> owner creates + publishes 2 properties (A: rental_type=both, B:
rental_type=short_term only) -> guest books A short_term (pending) ->
overlap rejection -> owner confirms -> self-booking rejection ->
guests_count validation -> rental_type-compatibility rejection ->
long-term minimum-1-month validation -> a correct long-term booking
(checks month-rounding pricing) -> guest cancels it -> confirming a
cancelled reservation is rejected -> a reject flow -> GET /reservations
-> GET /properties/{id}/availability.

Property deletion is NOT used for cleanup: reservations restrictOnDelete
the property (see migration), so a property with any booking history
can no longer be hard-deleted - that's a deliberate business rule, not
a bug. Cleanup just unpublishes the two test properties instead.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-reservations.ps1
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

# Registers a fresh user, reads the verification link straight out of
# storage/logs/laravel.log (same trick as the other test scripts), and
# returns an independent cookie session for that user.
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

function Test-Expect422 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 422 validation error." -ForegroundColor Red
    } catch {
        if ($_.Exception.Message -match "422") {
            Write-Host "Correct: rejected with 422." -ForegroundColor Green
            if ($_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
        } else {
            Show-Error $_
        }
    }
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

# 3. Owner creates + publishes 2 properties
Show-Step "3. Owner creates + publishes 2 test properties"
try {
    $propA = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Reservation Test Property A (both)"
        description = "Offers both nightly and monthly stays, used for most of the reservation tests."
        property_type = "apartment"
        rental_type = "both"
        address = "1 Test Street"
        city = "Casablanca"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 300
        price_per_month = 6000
    }
    $propB = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Reservation Test Property B (short_term only)"
        description = "Only offers nightly stays, used for the rental_type-compatibility test."
        property_type = "apartment"
        rental_type = "short_term"
        address = "2 Test Street"
        city = "Casablanca"
        bedrooms = 1
        bathrooms = 1
        max_guests = 4
        price_per_night = 200
    }
    $propAId = $propA.property.id
    $propBId = $propB.property.id
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propAId/publish" -Session $owner.Session | Out-Null
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propBId/publish" -Session $owner.Session | Out-Null
    Write-Host "Property A id=$propAId, Property B id=$propBId"
} catch {
    Show-Error $_
    exit 1
}

# 4. Guest books property A, short_term, 3 nights -> pending
Show-Step "4. Guest books property A short_term (should be pending, total_price = 900)"
$reservation1Id = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propAId
        rental_type = "short_term"
        start_date = D 7
        end_date = D 10
        guests_count = 2
    }
    $reservation1Id = $booking.reservation.id
    $status = $booking.reservation.status
    $total = $booking.reservation.total_price
    if ($status -eq "pending" -and [decimal]$total -eq 900) {
        Write-Host "Correct: reservation $reservation1Id is pending, total_price=$total" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$status, total_price=$total" -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 5. Overlapping dates on the same property -> 409
Test-Expect409 -Label "5. Overlapping booking on property A (days 8-9) should be rejected (409)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propAId
        rental_type = "short_term"
        start_date = D 8
        end_date = D 9
        guests_count = 1
    }
}

# 6. Owner confirms reservation 1
Show-Step "6. Owner confirms reservation $reservation1Id"
try {
    $confirmed = Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservation1Id/confirm" -Session $owner.Session
    if ($confirmed.reservation.status -eq "confirmed") {
        Write-Host "Correct: status=confirmed" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$($confirmed.reservation.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 7. Owner cannot book their own property
Test-Expect422 -Label "7. Owner books their own property A (should fail: cannot book own property)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $owner.Session -Body @{
        property_id = $propAId
        rental_type = "short_term"
        start_date = D 20
        end_date = D 22
        guests_count = 1
    }
}

# 8. guests_count > max_guests (property A max_guests = 2)
Test-Expect422 -Label "8. guests_count=5 on property A (max_guests=2) should fail" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propAId
        rental_type = "short_term"
        start_date = D 20
        end_date = D 22
        guests_count = 5
    }
}

# 9. rental_type not offered by the property (B is short_term only)
Test-Expect422 -Label "9. long_term booking on property B (short_term only) should fail" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propBId
        rental_type = "long_term"
        start_date = D 20
        end_date = D 50
        guests_count = 1
    }
}

# 10. long-term booking shorter than 1 month should fail
Test-Expect422 -Label "10. long_term booking of only 10 days on property A should fail (min 1 month)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propAId
        rental_type = "long_term"
        start_date = D 30
        end_date = D 40
    }
}

# 11. A correct long-term booking - checks month-rounding pricing
Show-Step "11. Guest books property A long_term, 40 days (should round up to 2 months, total_price=12000)"
$reservation2Id = $null
try {
    $longBooking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propAId
        rental_type = "long_term"
        start_date = D 40
        end_date = D 80
    }
    $reservation2Id = $longBooking.reservation.id
    $total2 = $longBooking.reservation.total_price
    if ([decimal]$total2 -eq 12000) {
        Write-Host "Correct: reservation $reservation2Id total_price=$total2 (2 months x 6000)" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: total_price=$total2 (expected 12000)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 12. Guest cancels the long-term reservation
Show-Step "12. Guest cancels reservation $reservation2Id"
try {
    $cancelled = Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservation2Id/cancel" -Session $guest.Session -Body @{
        reason = "Changed my mind"
    }
    if ($cancelled.reservation.status -eq "cancelled") {
        Write-Host "Correct: status=cancelled" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$($cancelled.reservation.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 13. Confirming an already-cancelled reservation should fail (409)
Test-Expect409 -Label "13. Owner confirms the now-cancelled reservation $reservation2Id (should fail)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservation2Id/confirm" -Session $owner.Session
}

# 14. Reject flow: a new pending request, rejected by the owner
Show-Step "14. Reject flow: guest requests days 90-92, owner rejects it"
try {
    $toReject = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propAId
        rental_type = "short_term"
        start_date = D 90
        end_date = D 92
        guests_count = 1
    }
    $rejectId = $toReject.reservation.id
    $rejected = Invoke-Api -Method Patch -Path "/api/v1/reservations/$rejectId/reject" -Session $owner.Session
    if ($rejected.reservation.status -eq "rejected") {
        Write-Host "Correct: reservation $rejectId status=rejected" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status=$($rejected.reservation.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 15. GET /reservations as guest - should list the guest's own bookings
Show-Step "15. GET /reservations (guest's own bookings)"
try {
    $list = Invoke-Api -Method Get -Path "/api/v1/reservations" -Session $guest.Session
    Write-Host "Guest has $($list.data.Count) reservation(s) on this page (meta.total=$($list.meta.total))"
} catch {
    Show-Error $_
}

# 16. GET /properties/{id}/availability - only the confirmed reservation
#     (days 7-10) should show up; the cancelled and rejected ones must not.
Show-Step "16. GET /properties/$propAId/availability (days 0-120)"
try {
    $availability = Invoke-Api -Method Get -Path "/api/v1/properties/$propAId/availability?start=$(D 0)&end=$(D 120)" -Session $guest.Session
    $count = $availability.reservations.Count
    if ($count -eq 1 -and $availability.reservations[0].start_date -eq (D 7)) {
        Write-Host "Correct: exactly 1 blocked range, days 7-10 (cancelled/rejected ones correctly excluded)." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $count blocked range(s):" -ForegroundColor Red
        $availability.reservations | ConvertTo-Json
    }
} catch {
    Show-Error $_
}

# 17. Cleanup - unpublish (NOT delete: reservations restrictOnDelete the property)
Show-Step "17. Cleanup: unpublish the 2 test properties (deletion is blocked by booking history, on purpose)"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propAId/unpublish" -Session $owner.Session | Out-Null
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propBId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished properties $propAId and $propBId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
