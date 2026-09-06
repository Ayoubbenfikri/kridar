<#
Kridar - Phase 13 admin dashboard smoke test.

Flow: register + verify an ADMIN candidate, an OWNER, a GUEST and a
VICTIM (a second owner) -> promote the admin candidate to role=admin
directly in the DB (there's no self-service way to become an admin, by
design - same test-only DB shortcut as the tinker date fast-forwards in
earlier test scripts) -> unauthenticated and non-admin access to
/admin/* is rejected (401/403) -> a full reservation lifecycle
(book -> confirm -> pay -> complete -> review) is run for the OWNER's
property so /admin/stats has real numbers to reflect, checked as DELTAS
against a baseline (the DB already has data from earlier test runs, so
exact totals would be meaningless) -> admin suspends the property ->
the owner's own publish button is now blocked (409) -> admin approves
it back -> admin cannot suspend themselves (409) -> admin suspends the
VICTIM user -> the victim's published property gets suspended too
(cascade) and the victim can no longer log in (403).

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-admin.ps1
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

function Test-Expect409 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 409 conflict." -ForegroundColor Red
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 409) {
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

# 1-4. Four independent users
Show-Step "1. Register + verify ADMIN candidate"
$admin = New-VerifiedUser -NamePrefix "admin"

Show-Step "2. Register + verify OWNER"
$owner = New-VerifiedUser -NamePrefix "owner"

Show-Step "3. Register + verify GUEST"
$guest = New-VerifiedUser -NamePrefix "guest"

Show-Step "4. Register + verify VICTIM (a second owner, for the cascade-suspend test)"
$victim = New-VerifiedUser -NamePrefix "victim"

# 5. There's no self-service way to become an admin - promote directly
#    in the DB, same test-only shortcut as the date fast-forwards used
#    in test-reviews.ps1 / test-notifications.ps1 / test-owner.ps1.
Show-Step "5. Promote the admin candidate to role=admin directly in the DB"
try {
    $tinkerCode = "App\Models\User::find($($admin.UserId))->update(['role' => 'admin']);"
    php artisan tinker --execute="$tinkerCode" | Out-Null
    Write-Host "Promoted user $($admin.UserId) to admin."
} catch {
    Show-Error $_
    exit 1
}

$anonSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 6-7. Only an admin can reach /admin/*
Test-Expect401 -Label "6. GET /admin/stats while logged out (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/admin/stats" -Session $anonSession
}
Test-Expect403 -Label "7. GET /admin/stats as OWNER, not an admin (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/admin/stats" -Session $owner.Session
}

# 8. Baseline stats - captured now, before this run creates any
# property/reservation/review data, so later checks compare DELTAS
# instead of exact totals (the DB already has data from earlier test
# runs).
Show-Step "8. Capture baseline /admin/stats"
$baseline = (Invoke-Api -Method Get -Path "/api/v1/admin/stats" -Session $admin.Session).stats
Write-Host ($baseline | ConvertTo-Json)

# 9. Owner creates + publishes a property
Show-Step "9. Owner creates + publishes a test property"
$propId = $null
try {
    $prop = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Admin Dashboard Test Property"
        description = "Used only to exercise the Phase 13 admin dashboard flow end to end."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Admin Street"
        city = "Rabat"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 300
    }
    $propId = $prop.property.id
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/publish" -Session $owner.Session | Out-Null
    Write-Host "Property id=$propId, published."
} catch {
    Show-Error $_
    exit 1
}

# 10-11. Admin can see everything
Show-Step "10. GET /admin/properties shows the new property, with owner name"
try {
    $adminProps = Invoke-Api -Method Get -Path "/api/v1/admin/properties" -Session $admin.Session
    $found = $adminProps.data | Where-Object { $_.id -eq $propId }
    if ($found -and $found.owner.name -match "owner") {
        Write-Host "Correct: property visible, owner name = $($found.owner.name)." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: property not found (or owner name missing) in /admin/properties." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

Show-Step "11. GET /admin/users shows the guest and victim accounts"
try {
    $adminUsers = Invoke-Api -Method Get -Path "/api/v1/admin/users" -Session $admin.Session
    $guestFound = $adminUsers.data | Where-Object { $_.id -eq $guest.UserId }
    $victimFound = $adminUsers.data | Where-Object { $_.id -eq $victim.UserId }
    if ($guestFound -and $victimFound) {
        Write-Host "Correct: both accounts visible in /admin/users." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: one or both accounts missing from /admin/users (may be on another page)." -ForegroundColor Yellow
    }
} catch {
    Show-Error $_
}

# 12. Stats after publishing: +1 property, +1 published, +1 owner
Show-Step "12. Stats reflect the new published property (+1 properties_count, +1 published, +1 owners_count)"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/admin/stats" -Session $admin.Session).stats
    if ($stats.properties_count -eq ($baseline.properties_count + 1) -and
        $stats.published_properties_count -eq ($baseline.published_properties_count + 1) -and
        $stats.owners_count -eq ($baseline.owners_count + 1)) {
        Write-Host "Correct." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED stats:" -ForegroundColor Red
        Write-Host ($stats | ConvertTo-Json)
    }
} catch {
    Show-Error $_
}

# 13. Full reservation lifecycle: book -> confirm -> pay
Show-Step "13. Guest books, owner confirms, guest pays"
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

    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationId/confirm" -Session $owner.Session | Out-Null

    $payment = Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/payments" -Session $guest.Session
    Invoke-Api -Method Post -Path "/api/v1/payments/$($payment.payment.id)/callback" -Session $guest.Session -Body @{
        success = $true
    } | Out-Null

    Write-Host "Reservation $reservationId booked, confirmed and paid (total_price=$totalPrice)."
} catch {
    Show-Error $_
    exit 1
}

# 14. Stats reflect the new reservation and the paid revenue
Show-Step "14. Stats reflect +1 reservations_count and +total_price revenue"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/admin/stats" -Session $admin.Session).stats
    $expectedRevenue = [decimal]$baseline.total_revenue + [decimal]$totalPrice
    if ($stats.reservations_count -eq ($baseline.reservations_count + 1) -and [decimal]$stats.total_revenue -eq $expectedRevenue) {
        Write-Host "Correct." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED stats:" -ForegroundColor Red
        Write-Host ($stats | ConvertTo-Json)
    }
} catch {
    Show-Error $_
}

# 15. Fast-forward + complete-past (same test-only shortcut as the
#     other test scripts)
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
        rating = 5
        comment = "Testing the admin dashboard stats."
    } | Out-Null
    Write-Host "Review submitted."
} catch {
    Show-Error $_
    exit 1
}

# 17. Stats reflect the completed stay and the review
Show-Step "17. Stats reflect +1 completed_reservations_count and +1 reviews_count"
try {
    $stats = (Invoke-Api -Method Get -Path "/api/v1/admin/stats" -Session $admin.Session).stats
    if ($stats.completed_reservations_count -eq ($baseline.completed_reservations_count + 1) -and
        $stats.reviews_count -eq ($baseline.reviews_count + 1)) {
        Write-Host "Correct." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED stats:" -ForegroundColor Red
        Write-Host ($stats | ConvertTo-Json)
    }
} catch {
    Show-Error $_
}

# 18. Admin suspends the property
Show-Step "18. Admin suspends the property"
try {
    $result = Invoke-Api -Method Patch -Path "/api/v1/admin/properties/$propId/suspend" -Session $admin.Session
    if ($result.property.status -eq "suspended") {
        Write-Host "Correct: property status is now suspended." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status is $($result.property.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 19. Owner can no longer republish it themselves
Test-Expect409 -Label "19. Owner tries to republish the suspended property themselves (should fail)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/publish" -Session $owner.Session
}

# 20. Admin approves it back
Show-Step "20. Admin approves the property back"
try {
    $result = Invoke-Api -Method Patch -Path "/api/v1/admin/properties/$propId/approve" -Session $admin.Session
    if ($result.property.status -eq "published") {
        Write-Host "Correct: property status is published again." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: status is $($result.property.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 21. An admin cannot suspend another admin (or themselves)
Test-Expect409 -Label "21. Admin tries to suspend THEIR OWN admin account (should fail)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/admin/users/$($admin.UserId)/suspend" -Session $admin.Session
}

# 22. Victim creates + publishes their own property
Show-Step "22. Victim creates + publishes their own property"
$victimPropId = $null
try {
    $victimProp = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $victim.Session -Body @{
        title = "Victim Test Property"
        description = "Used only to test that suspending a user cascades to their properties."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Victim Street"
        city = "Rabat"
        bedrooms = 1
        bathrooms = 1
        max_guests = 2
        price_per_night = 150
    }
    $victimPropId = $victimProp.property.id
    Invoke-Api -Method Patch -Path "/api/v1/properties/$victimPropId/publish" -Session $victim.Session | Out-Null
    Write-Host "Victim property id=$victimPropId, published."
} catch {
    Show-Error $_
    exit 1
}

# 23. Admin suspends the VICTIM user - should cascade to their property
Show-Step "23. Admin suspends the victim user (cascade to their published property)"
try {
    Invoke-Api -Method Patch -Path "/api/v1/admin/users/$($victim.UserId)/suspend" -Session $admin.Session | Out-Null

    $adminUsers = Invoke-Api -Method Get -Path "/api/v1/admin/users" -Session $admin.Session
    $victimUser = $adminUsers.data | Where-Object { $_.id -eq $victim.UserId }

    $adminProps = Invoke-Api -Method Get -Path "/api/v1/admin/properties" -Session $admin.Session
    $victimProperty = $adminProps.data | Where-Object { $_.id -eq $victimPropId }

    if ($victimUser.status -eq "suspended" -and $victimProperty.status -eq "suspended") {
        Write-Host "Correct: victim's account AND their property are both suspended." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: user status=$($victimUser.status), property status=$($victimProperty.status)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 24. The victim can no longer log in
Show-Step "24. Victim tries to log in again (should be rejected: account suspended)"
try {
    $freshSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-WebRequest -Uri "$base/sanctum/csrf-cookie" -Headers $commonHeaders -WebSession $freshSession -UseBasicParsing | Out-Null
    Invoke-Api -Method Post -Path "/api/v1/auth/login" -Session $freshSession -Body @{
        email = $victim.Email
        password = $password
    } | Out-Null
    Write-Host "UNEXPECTED: login was accepted." -ForegroundColor Red
} catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "Correct: login rejected with 403 (account suspended)." -ForegroundColor Green
    } else {
        Show-Error $_
    }
}

# 25. Cleanup - unpublish the main test property (see test-reservations.ps1
#     for why we don't delete). The victim's property is already
#     suspended (hidden from the public listing), so no further cleanup
#     is needed there.
Show-Step "25. Cleanup: unpublish the main test property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished property $propId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
