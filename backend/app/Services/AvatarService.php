<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Profile photo upload/removal. Same shape as PropertyImageService, scaled
 * down to one file instead of a collection — a user has at most one photo,
 * so there is no sort_order/is_cover to manage here.
 */
class AvatarService
{
    /**
     * Stores the new file and replaces the old one, if there was one.
     * The old file is deleted only AFTER the new one is safely stored and
     * saved — so a failed upload never leaves the account with no photo
     * at all.
     */
    public function upload(User $user, UploadedFile $file): User
    {
        $previousPath = $user->avatar_path;

        $user->avatar_path = $file->store('avatars', 'public');
        $user->save();

        if ($previousPath !== null) {
            Storage::disk('public')->delete($previousPath);
        }

        return $user;
    }

    public function delete(User $user): User
    {
        if ($user->avatar_path !== null) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->avatar_path = null;
            $user->save();
        }

        return $user;
    }
}
