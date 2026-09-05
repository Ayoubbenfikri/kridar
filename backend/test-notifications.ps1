<#
Kridar - Phase 11 notifications smoke test.

Flow: register + verify an OWNER, a GUEST and a STRANGER -> owner creates
+ publishes a property -> unauthenticated access to /notifications is
rejected (401) -> guest books it (pending) -> owner gets a
"reservation_requested" notification -> a stranger/the guest cannot mark
someone else's notification as read (404) -> owner marks it read
(idempotent on a second call) -> owner confirms -> guest gets a
"reservation_confirmed" notification -> fast-forward that reservation
into the past + run reservations:complete-past (same test-only shortcut
as test-reviews.ps1) -> guest reviews it -> owner gets
"review_submitted" -> owner replies -> guest gets "review_replied" ->
owner marks ALL notifications read -> a second booking gets cancelled by
the guest -> owner gets "reservation_cancelled" -> a third booking gets
rejected by the owner -> guest gets "reservation_rejected".

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-notifications.ps1
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

function Find-Notification {
    param($List, [string]$Type)
    return $List.data | Where-Object { $_.data.type -eq $Type } | Select-Object -First 1
}

function D {
    param([int]$Days)
    return (Get-Date).AddDays($Days).ToString("yyyy-MM-dd")
}

# 1-3. Three independent users
Show-Step "1. Register + verify OWNER"
$owner = New-VerifiedUser -NamePrefix "owner"

Show-Step "2. Register + verify GUEST"
$guest = New-VerifiedUser -NamePrefix "guest"

Show-Step "3. Register + verify STRANGER"
$stranger = New-VerifiedUser -NamePrefix "stranger"

# 4. Owner creates + publishes a property
Show-Step "4. Owner creates + publishes a test property"
$propId = $null
try {
    $prop = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Notification Test Property"
        description = "Used only to exercise the Phase 11 notifications flow end to end."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Notification Street"
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

# 5. Unauthenticated access is rejected
$anonSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Test-Expect401 -Label "5. GET /notifications while logged out (should fail)" -Action {
    Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $anonSession
}

# 6. Owner's notifications start empty
Show-Step "6. Owner's notifications list is empty at baseline"
try {
    $ownerList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $owner.Session
    if ($ownerList.data.Count -eq 0) {
        Write-Host "Correct: no notifications yet." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: owner already has $($ownerList.data.Count) notification(s)." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 7. Guest books reservation A (near future) -> owner should be notified
Show-Step "7. Guest books reservation A (pending)"
$reservationA = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propId
        rental_type = "short_term"
        start_date = D 1
        end_date = D 2
        guests_count = 2
    }
    $reservationA = $booking.reservation.id
    Write-Host "Reservation A id=$reservationA"
} catch {
    Show-Error $_
    exit 1
}

# 8. Owner should now have a reservation_requested notification
Show-Step "8. Owner has a reservation_requested notification, unread"
$requestedNotifId = $null
try {
    $ownerList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $owner.Session
    $notif = Find-Notification -List $ownerList -Type "reservation_requested"
    if ($notif -and $null -eq $notif.read_at) {
        $requestedNotifId = $notif.id
        Write-Host "Correct: found unread reservation_requested notification id=$requestedNotifId." -ForegroundColor Green
        Write-Host "Message: $($notif.data.message)"
    } else {
        Write-Host "UNEXPECTED: no unread reservation_requested notification found." -ForegroundColor Red
        Write-Host ($ownerList | ConvertTo-Json -Depth 6)
    }
} catch {
    Show-Error $_
    exit 1
}

# 9-10. Only the owner can mark their own notification as read
Test-Expect404 -Label "9. STRANGER tries to mark the owner's notification as read (should fail)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/notifications/$requestedNotifId/read" -Session $stranger.Session
}
Test-Expect404 -Label "10. GUEST tries to mark the owner's notification as read (should fail)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/notifications/$requestedNotifId/read" -Session $guest.Session
}

# 11. Owner marks it as read
Show-Step "11. Owner marks their notification as read"
try {
    Invoke-Api -Method Patch -Path "/api/v1/notifications/$requestedNotifId/read" -Session $owner.Session | Out-Null
    $ownerList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $owner.Session
    $notif = $ownerList.data | Where-Object { $_.id -eq $requestedNotifId }
    if ($notif.read_at) {
        Write-Host "Correct: read_at is now set." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: read_at is still null." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 12. Marking it read again is idempotent
Show-Step "12. Owner marks the SAME notification as read again (should be idempotent, no error)"
try {
    Invoke-Api -Method Patch -Path "/api/v1/notifications/$requestedNotifId/read" -Session $owner.Session | Out-Null
    Write-Host "Correct: no error." -ForegroundColor Green
} catch {
    Show-Error $_
}

# 13. Owner confirms reservation A -> guest should be notified
Show-Step "13. Owner confirms reservation A"
try {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationA/confirm" -Session $owner.Session | Out-Null
    $guestList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $guest.Session
    $notif = Find-Notification -List $guestList -Type "reservation_confirmed"
    if ($notif -and $null -eq $notif.read_at) {
        Write-Host "Correct: guest has an unread reservation_confirmed notification." -ForegroundColor Green
        Write-Host "Message: $($notif.data.message)"
    } else {
        Write-Host "UNEXPECTED: no unread reservation_confirmed notification found for guest." -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 14. Test-only shortcut: move reservation A into the past, then run the
#     real production command that flips it to completed (see
#     test-reviews.ps1 for why this is done this way).
Show-Step "14. Fast-forward reservation A into the past and run reservations:complete-past"
try {
    $tinkerCode = "App\Models\Reservation::find($reservationA)->update(['start_date' => now()->subDays(5)->toDateString(), 'end_date' => now()->subDays(3)->toDateString()]);"
    php artisan tinker --execute="$tinkerCode" | Out-Null
    php artisan reservations:complete-past
} catch {
    Show-Error $_
    exit 1
}

# 15. Guest reviews reservation A -> owner should be notified
Show-Step "15. Guest reviews reservation A"
try {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationA/review" -Session $guest.Session -Body @{
        rating = 5
        comment = "Great stay, testing notifications."
    } | Out-Null
    $ownerList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $owner.Session
    $notif = Find-Notification -List $ownerList -Type "review_submitted"
    if ($notif -and $null -eq $notif.read_at) {
        Write-Host "Correct: owner has an unread review_submitted notification." -ForegroundColor Green
        Write-Host "Message: $($notif.data.message)"
    } else {
        Write-Host "UNEXPECTED: no unread review_submitted notification found for owner." -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 16. Owner replies to the review -> guest should be notified
Show-Step "16. Owner replies to the review"
try {
    $ownerReviews = Invoke-Api -Method Get -Path "/api/v1/properties/$propId/reviews" -Session $owner.Session
    $reviewId = $ownerReviews.data[0].id
    Invoke-Api -Method Patch -Path "/api/v1/reviews/$reviewId" -Session $owner.Session -Body @{
        owner_reply = "Thanks for staying with us!"
    } | Out-Null
    $guestList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $guest.Session
    $notif = Find-Notification -List $guestList -Type "review_replied"
    if ($notif -and $null -eq $notif.read_at) {
        Write-Host "Correct: guest has an unread review_replied notification." -ForegroundColor Green
        Write-Host "Message: $($notif.data.message)"
    } else {
        Write-Host "UNEXPECTED: no unread review_replied notification found for guest." -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 17. Owner marks ALL notifications read
Show-Step "17. Owner marks ALL notifications as read"
try {
    Invoke-Api -Method Patch -Path "/api/v1/notifications/read-all" -Session $owner.Session | Out-Null
    $ownerList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $owner.Session
    $unread = @($ownerList.data | Where-Object { $null -eq $_.read_at })
    if ($unread.Count -eq 0) {
        Write-Host "Correct: no unread notifications remain for owner." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($unread.Count) notification(s) still unread." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 18-19. A cancelled booking notifies the OTHER party (here: the owner,
# since the guest is the one cancelling)
Show-Step "18. Guest books reservation B (pending)"
$reservationB = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propId
        rental_type = "short_term"
        start_date = D 10
        end_date = D 11
        guests_count = 2
    }
    $reservationB = $booking.reservation.id
    Write-Host "Reservation B id=$reservationB"
} catch {
    Show-Error $_
    exit 1
}

Show-Step "19. Guest cancels reservation B -> owner should be notified"
try {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationB/cancel" -Session $guest.Session | Out-Null
    $ownerList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $owner.Session
    $notif = Find-Notification -List $ownerList -Type "reservation_cancelled"
    if ($notif -and $notif.data.message -match "voyageur") {
        Write-Host "Correct: owner notified, message mentions the guest cancelled it." -ForegroundColor Green
        Write-Host "Message: $($notif.data.message)"
    } else {
        Write-Host "UNEXPECTED: no matching reservation_cancelled notification found for owner." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 20-21. A rejected booking notifies the guest
Show-Step "20. Guest books reservation C (pending)"
$reservationC = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propId
        rental_type = "short_term"
        start_date = D 20
        end_date = D 21
        guests_count = 2
    }
    $reservationC = $booking.reservation.id
    Write-Host "Reservation C id=$reservationC"
} catch {
    Show-Error $_
    exit 1
}

Show-Step "21. Owner rejects reservation C -> guest should be notified"
try {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationC/reject" -Session $owner.Session | Out-Null
    $guestList = Invoke-Api -Method Get -Path "/api/v1/notifications" -Session $guest.Session
    $notif = Find-Notification -List $guestList -Type "reservation_rejected"
    if ($notif -and $null -eq $notif.read_at) {
        Write-Host "Correct: guest has an unread reservation_rejected notification." -ForegroundColor Green
        Write-Host "Message: $($notif.data.message)"
    } else {
        Write-Host "UNEXPECTED: no unread reservation_rejected notification found for guest." -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 22. Cleanup - unpublish (see test-reservations.ps1 for why we don't delete)
Show-Step "22. Cleanup: unpublish the test property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished property $propId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
