<?php

namespace App\Services;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PropertyImageService
{
    public function __construct(
        private readonly PropertyRepositoryInterface $properties,
    ) {}

    /**
     * Store the uploaded files on the 'public' disk and create their
     * property_images rows. The property's very first image ever becomes
     * the cover automatically; later uploads are appended after it.
     *
     * @param  array<int, UploadedFile>  $files
     * @return Collection<int, PropertyImage>
     */
    public function upload(Property $property, array $files): Collection
    {
        $existingCount = $property->images()->count();

        $rows = [];
        foreach (array_values($files) as $index => $file) {
            $rows[] = [
                'path' => $file->store('property-images', 'public'),
                'is_cover' => $existingCount === 0 && $index === 0,
                'sort_order' => $existingCount + $index,
            ];
        }

        return $this->properties->createImages($property, $rows);
    }

    /**
     * Delete the file from disk and its row. If it was the cover image,
     * promote the next remaining image (lowest sort_order) to cover so a
     * property with images always has exactly one cover.
     */
    public function delete(PropertyImage $image): void
    {
        $property = $image->property;
        $wasCover = $image->is_cover;

        Storage::disk('public')->delete($image->path);
        $this->properties->deleteImage($image);

        if ($wasCover) {
            $property->images()->orderBy('sort_order')->first()?->update(['is_cover' => true]);
        }
    }
}
