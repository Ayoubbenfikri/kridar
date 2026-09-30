<?php

namespace App\Services;

use App\Models\RoommateListing;
use App\Models\RoommateListingImage;
use App\Repositories\Contracts\RoommateListingRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Same shape as PropertyImageService — same "first image ever becomes the
 * cover, deleting the cover promotes the next one" rules.
 */
class RoommateListingImageService
{
    public function __construct(
        private readonly RoommateListingRepositoryInterface $listings,
    ) {}

    /**
     * @param  array<int, UploadedFile>  $files
     * @return Collection<int, RoommateListingImage>
     */
    public function upload(RoommateListing $roommateListing, array $files): Collection
    {
        $existingCount = $roommateListing->images()->count();

        $rows = [];
        foreach (array_values($files) as $index => $file) {
            $rows[] = [
                'path' => $file->store('roommate-listing-images', 'public'),
                'is_cover' => $existingCount === 0 && $index === 0,
                'sort_order' => $existingCount + $index,
            ];
        }

        return $this->listings->createImages($roommateListing, $rows);
    }

    public function delete(RoommateListingImage $image): void
    {
        $roommateListing = $image->roommateListing;
        $wasCover = $image->is_cover;

        Storage::disk('public')->delete($image->path);
        $this->listings->deleteImage($image);

        if ($wasCover) {
            $roommateListing->images()->orderBy('sort_order')->first()?->update(['is_cover' => true]);
        }
    }
}
