<#
Kridar - Phase 9 reviews & ratings smoke test.

Flow: register + verify an OWNER, a GUEST and a STRANGER -> owner creates
+ publishes a property -> guest books it (near-future dates, since the
booking API rejects past dates) -> review attempts are rejected while the
reservation is still pending/confirmed (not completed yet) -> we
fast-forward the reservation into the past directly in the DB (test-only
shortcut - there's no legitimate API path to book in the past) and run
the real `reservations:complete-past` command to flip it to completed,
same as production would after the stay actually happens -> stranger
cannot review someone else's reservation -> guest reviews it -> average
rating/reviews_count show up on the property -> guest cannot review twice
-> validation on rating/comment -> owner replies once -> owner cannot
reply twice -> guest cannot reply (not the owner).

HOW TO RUN:
  1. In one terminal (kept open):  php artisan serve
  2. In another terminal, from backend/:
       powershell -ExecutionPolicy Bypass -File .\test-reviews.ps1
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

function Test-Expect403 {
    param([string]$Label, [scriptblock]$Action)
    Show-Step $Label
    try {
        & $Action | Out-Null
        Write-Host "UNEXPECTED: request was accepted, expected a 403 forbidden." -ForegroundColor Red
    } catch {
        if ($_.Exception.Message -match "403") {
            Write-Host "Correct: rejected with 403." -ForegroundColor Green
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

# 1-3. Three independent users
Show-Step "1. Register + verify OWNER"
$owner = New-VerifiedUser -NamePrefix "owner"

Show-Step "2. Register + verify GUEST"
$guest = New-VerifiedUser -NamePrefix "guest"

Show-Step "3. Register + verify STRANGER (neither the owner nor the guest)"
$stranger = New-VerifiedUser -NamePrefix "stranger"

# 4. Owner creates + publishes a property
Show-Step "4. Owner creates + publishes a test property"
$propId = $null
try {
    $prop = Invoke-Api -Method Post -Path "/api/v1/properties" -Session $owner.Session -Body @{
        title = "Review Test Property"
        description = "Used only to exercise the Phase 9 review flow end to end."
        property_type = "apartment"
        rental_type = "short_term"
        address = "1 Review Street"
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

# 5. Guest books it (near-future dates - the booking API rejects past dates)
Show-Step "5. Guest books the property (near-future dates, pending)"
$reservationId = $null
try {
    $booking = Invoke-Api -Method Post -Path "/api/v1/reservations" -Session $guest.Session -Body @{
        property_id = $propId
        rental_type = "short_term"
        start_date = D 1
        end_date = D 2
        guests_count = 2
    }
    $reservationId = $booking.reservation.id
    Write-Host "Reservation $reservationId created, status=$($booking.reservation.status)"
} catch {
    Show-Error $_
    exit 1
}

# 6. Reviewing a pending reservation should fail (not completed yet)
Test-Expect409 -Label "6. Guest tries to review while reservation is still pending (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 5
        comment = "Too early, should be rejected."
    }
}

# 7. Owner confirms the reservation
Show-Step "7. Owner confirms reservation $reservationId"
try {
    Invoke-Api -Method Patch -Path "/api/v1/reservations/$reservationId/confirm" -Session $owner.Session | Out-Null
    Write-Host "Confirmed."
} catch {
    Show-Error $_
    exit 1
}

# 8. Reviewing a confirmed-but-not-yet-completed reservation should still fail
Test-Expect409 -Label "8. Guest tries to review while reservation is confirmed but not completed (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 5
        comment = "Still too early, should be rejected."
    }
}

# 9. Test-only shortcut: move the reservation into the past directly in the
#    DB (the booking API itself will never let you book past dates), then
#    run the real production command that flips past-confirmed stays to
#    completed - same command routes/console.php schedules daily.
Show-Step "9. Fast-forward: move reservation $reservationId into the past and run reservations:complete-past"
try {
    $tinkerCode = "App\Models\Reservation::find($reservationId)->update(['start_date' => now()->subDays(5)->toDateString(), 'end_date' => now()->subDays(3)->toDateString()]);"
    php artisan tinker --execute="$tinkerCode" | Out-Null
    php artisan reservations:complete-past
} catch {
    Show-Error $_
    exit 1
}

# 10. A stranger (not the guest) cannot review this reservation
Test-Expect403 -Label "10. STRANGER tries to review the guest's completed reservation (should fail: not their reservation)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $stranger.Session -Body @{
        rating = 1
        comment = "Not my reservation, should be rejected."
    }
}

# 11. Validation: rating out of range, missing comment
Test-Expect422 -Label "11a. Guest submits rating=6 (out of 1-5 range, should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 6
        comment = "Rating too high."
    }
}
Test-Expect422 -Label "11b. Guest submits no comment (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 4
    }
}

# 12. Guest reviews the now-completed reservation
Show-Step "12. Guest reviews the completed reservation"
$reviewId = $null
try {
    $review = Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 5
        comment = "Lovely stay, would book again."
    }
    $reviewId = $review.review.id
    if ($review.review.rating -eq 5 -and $review.review.guest.id -eq $guest.UserId) {
        Write-Host "Correct: review $reviewId created, rating=5, guest matches." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($review.review | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 13. GET /properties/{id}/reviews - public, no session needed
Show-Step "13. GET /properties/$propId/reviews (public)"
try {
    $anonSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $list = Invoke-Api -Method Get -Path "/api/v1/properties/$propId/reviews" -Session $anonSession
    if ($list.data.Count -eq 1 -and $list.data[0].rating -eq 5) {
        Write-Host "Correct: 1 public review found, rating=5." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($list.data | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 14. GET /properties/{id} - average_rating and reviews_count should reflect it
Show-Step "14. GET /properties/$propId (show) - check average_rating/reviews_count"
try {
    $anonSession2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $show = Invoke-Api -Method Get -Path "/api/v1/properties/$propId" -Session $anonSession2
    if ([decimal]$show.property.average_rating -eq 5 -and $show.property.reviews_count -eq 1) {
        Write-Host "Correct: average_rating=5, reviews_count=1." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: average_rating=$($show.property.average_rating), reviews_count=$($show.property.reviews_count)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
}

# 15. Guest cannot review the same reservation twice
Test-Expect409 -Label "15. Guest tries to review the same reservation again (should fail)" -Action {
    Invoke-Api -Method Post -Path "/api/v1/reservations/$reservationId/review" -Session $guest.Session -Body @{
        rating = 3
        comment = "Trying to review twice."
    }
}

# 16. Owner replies to the review
Show-Step "16. Owner replies to review $reviewId"
try {
    $reply = Invoke-Api -Method Patch -Path "/api/v1/reviews/$reviewId" -Session $owner.Session -Body @{
        owner_reply = "Thanks for staying with us!"
    }
    if ($reply.review.owner_reply -eq "Thanks for staying with us!") {
        Write-Host "Correct: owner_reply saved." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $($reply.review | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Show-Error $_
    exit 1
}

# 17. Owner cannot reply twice
Test-Expect409 -Label "17. Owner tries to reply again (should fail: already replied)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/reviews/$reviewId" -Session $owner.Session -Body @{
        owner_reply = "Second reply attempt."
    }
}

# 18. Guest cannot reply (not the property owner)
Test-Expect403 -Label "18. GUEST tries to reply to their own review (should fail: not the owner)" -Action {
    Invoke-Api -Method Patch -Path "/api/v1/reviews/$reviewId" -Session $guest.Session -Body @{
        owner_reply = "I am not the owner."
    }
}

# 19. Cleanup - unpublish (see test-reservations.ps1 for why we don't delete)
Show-Step "19. Cleanup: unpublish the test property"
try {
    Invoke-Api -Method Patch -Path "/api/v1/properties/$propId/unpublish" -Session $owner.Session | Out-Null
    Write-Host "Unpublished property $propId."
} catch {
    Show-Error $_
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
