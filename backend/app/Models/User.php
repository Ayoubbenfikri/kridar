<?php

namespace App\Models;

use App\Enums\Locale;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, MustVerifyEmail, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * ⚠️ `role` and `status` are deliberately NOT here (Phase 26).
     *
     * They used to be, and nothing was exploiting it — UpdateProfileRequest
     * only validates name/phone/consent, so no request body ever reached
     * them. But that safety lived entirely in one validation rule list. A
     * single careless `$user->update($request->all())` anywhere in the app
     * would have let a user promote themselves to admin, or lift their own
     * suspension, and nothing would have failed loudly.
     *
     * Now the only way to set either one is direct assignment, which means
     * a human wrote that line on purpose. Exactly three places do:
     *   - AuthController::register()   role=user, status=active
     *   - AdminService::suspendUser()  status=suspended
     *   - AdminService::activateUser() status=active
     *
     * Factories are unaffected: Eloquent factories build models inside
     * Model::unguarded(), so UserFactory's role/status defaults and its
     * admin() state keep working.
     *
     * `locale` IS fillable — it is the user's own preference, like
     * show_phone_on_listings, and UpdateProfileRequest validates it
     * against App\Enums\Locale so only a real language can land here.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        // Owner consent to publish `phone` on their long-term listings.
        // Only ever set by the user themselves (UpdateProfileRequest).
        'show_phone_on_listings',
        // Interface language (Phase 27). Stored on the account so it
        // follows the person across devices and so a queued notification
        // email knows which language to send.
        'locale',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'owner_verified_at' => 'datetime',
            'password' => 'hashed',
            'show_phone_on_listings' => 'boolean',
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'locale' => Locale::class,
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    /**
     * Properties this user owns. Being an "owner" is implicit — anyone
     * with at least one row here is one, no separate role needed.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'owner_id');
    }

    /**
     * Reservations this user made as a guest.
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'guest_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'guest_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }
}
