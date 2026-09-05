<#
Kridar - Phase 12 owner dashboard smoke test.

Flow: register + verify an OWNER and a GUEST -> unauthenticated and
non-owner (0 properties) access to /owner/* is rejected (401/403) ->
owner creates a DRAFT property (visible on /owner/properties, unlike
the public listing) -> publishes it -> guest books it (pending) ->
owner sees it on /owner/reservations (guest cannot, still owns 0
properties) -> stats reflect properties/reservations counts -> owner
confirms -> guest pays (fake CMI callback, same as test-payments.ps1)
-> stats reflect the paid revenue -> fast-forward + complete-past (same
test-only shortcut as test-reviews.ps1/test-notifications.ps1) -> guest
reviews it -> stats reflect completed_reservations_count, reviews_count
and average_rating.

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-owner.ps1
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

function Test-Expect403 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 403 forbidden error." -ForegroundColor Red
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 403) {
            Write-Host "Correct: rejected with 403." -ForegroundColor Green
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

$anonSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 3-4. Only an owner (0 properties = not one) can reach /owner/*
Test-Expect401 -Label "3. GET /owner/stats while logged out (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/owner/stats" -Session $anonSession
}
Test-Expect403 -Label "4. GET /owner/stats as GUEST, who owns 0 properties (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/owner/stats" -Session $guest.Session
}

# 5. Owner creates a DRAFT property (not published yet)
Show-Step "5. Owner creates a property (draft, not published)"
$propId = $null
try {
    $prop = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Owner Dashboard Test Property"
        description = "Used only to exercise the Phase 12 owner dashboard flow end to end."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Owner Street"
        city = "Rabat"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 200
    }
    $propId = $prop.property.id
    Write-Host "Property id=$propId, status=$($prop.property.status)"
} catch {
    Show-Error $_
    exit 1
}

# 6. GET /owner/properties should show it even though it's still a draft
Show-Step "6. GET /owner/properties shows the draft property"
try {
    $ownerProps = Invoke-Api -Method Get -Path "/api/v1/owner/properties" -Session $owner.Session
    $found = $ownerProps.data | Where-Object { $_.id -eq $propId }
    if ($found -and $found.status -eq "draft") {
        Write-Host "Correct: draft property is visible on the owner dashboard." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: draft property not found (or wrong status) in /owner/properties." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 7. Publish it
Show-Step "7. Owner publishes the property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/publish" -Session $owner.Session | Out-Null
    Write-Host "Published."
} catch {
    Show-Error $_
    exit 1
}

# 8. Baseline stats: 1 property, published, nothing else yet
Show-Step "8. GET /owner/stats baseline (1 published property, no reservations yet)"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/owner/stats" -Session $owner.Session).stats
    if ($stats.properties_count -eq 1 -and $stats.published_properties_count -eq 1 -and $stats.reservations_count -eq 0) {
        Write-Host "Correct: properties_count=1, published_properties_count=1, reservations_count=0." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED stats:" -ForegroundColor Red
        Write-Host ($stats | ConvertTo-Json)
    }
} catch {
    Show-Error $_
}

# 9. Guest books it (pending)
Show-Step "9. Guest books the property (pending)"
$reservationId = $null
$totalPrice = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propId
        rental_type = "short_term"
        start_date = D 1
        end_date = D 2
        guests_count = 2
    }
    $reservationId = $booking.reservation.id
    $totalPrice = $booking.reservation.total_price
    Write-Host "Reservation id=$reservationId, total_price=$totalPrice"
} catch {
    Show-Error $_
    exit 1
}

# 10-11. Owner (not guest) can see it on /owner/reservations
Show-Step "10. GET /owner/reservations shows the booking, with the guest's name"
try {
    $ownerReservations = Invoke-Api -Method Get -Path "/api/v1/owner/reservations" -Session $owner.Session
    $found = $ownerReservations.data | Where-Object { $_.id -eq $reservationId }
    if ($found -and $found.guest.name -match "guest") {
        Write-Host "Correct: reservation visible, guest name = $($found.guest.name)." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: reservation not found or guest name missing." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}
Test-Expect403 -Label "11. GET /owner/reservations as GUEST, who still owns 0 properties (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/owner/reservations" -Session $guest.Session
}

# 12. Stats reflect the pending reservation
Show-Step "12. GET /owner/stats reflects the pending reservation"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/owner/stats" -Session $owner.Session).stats
    if ($stats.reservations_count -eq 1 -and $stats.pending_reservations_count -eq 1) {
        Write-Host "Correct: reservations_count=1, pending_reservations_count=1." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED stats:" -ForegroundColor Red
        Write-Host ($stats | ConvertTo-Json)
    }
} catch {
    Show-Error $_
}

# 13. Owner confirms, guest pays (fake CMI callback, same as test-payments.ps1)
Show-Step "13. Owner confirms, guest pays"
try {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationId/confirm" -Session $owner.Session | Out-Null
    $payment = Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
    $paymentId = $payment.payment.id
    Invoke-Api -Method Post -Path "/api/v1/payments/$paymentId/callback" -Session $guest.Session -Body @{
        success = $true
    } | Out-Null
    Write-Host "Payment $paymentId marked paid."
} catch {
    Show-Error $_
    exit 1
}

# 14. Stats reflect the paid revenue
Show-Step "14. GET /owner/stats reflects the paid revenue"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/owner/stats" -Session $owner.Session).stats
    if ([decimal]$stats.total_revenue -eq [decimal]$totalPrice) {
        Write-Host "Correct: total_revenue=$($stats.total_revenue) matches the reservation's total_price." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: total_revenue=$($stats.total_revenue), expected $totalPrice" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 15. Test-only shortcut: move the reservation into the past and run the
#     real production command that flips it to completed (see
#     test-reviews.ps1 / test-notifications.ps1 for why this is done
#     this way).
Show-Step "15. Fast-forward the reservation into the past and run reservations:complete-past"
try {
    $tinkerCode = "App\Models\Reservation::find($reservationId)->update(['start_date' => now()->subDays(5)->toDateString(), 'end_date' => now()->subDays(3)->toDateString()]);"
    php artisan tinker --execute="$tinkerCode" | Out-Null
    php artisan reservations:complete-past
} catch {
    Show-Error $_
    exit 1
}

# 16. Guest reviews it
Show-Step "16. Guest reviews the completed stay"
try {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 4
        comment = "Testing the owner dashboard stats."
    } | Out-Null
    Write-Host "Review submitted (rating 4)."
} catch {
    Show-Error $_
    exit 1
}

# 17. Final stats: completed reservation, review counted, average rating
Show-Step "17. GET /owner/stats reflects the completed stay and the review"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/owner/stats" -Session $owner.Session).stats
    if ($stats.completed_reservations_count -eq 1 -and $stats.pending_reservations_count -eq 0 -and $stats.reviews_count -eq 1 -and [decimal]$stats.average_rating -eq 4) {
        Write-Host "Correct: completed_reservations_count=1, pending_reservations_count=0, reviews_count=1, average_rating=4." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED stats:" -ForegroundColor Red
        Write-Host ($stats | ConvertTo-Json)
    }
} catch {
    Show-Error $_
}

# 18. Cleanup - unpublish (see test-reservations.ps1 for why we don't delete)
Show-Step "18. Cleanup: unpublish the test property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished property $propId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
