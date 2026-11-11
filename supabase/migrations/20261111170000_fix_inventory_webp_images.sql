-- Restore original inventory .webp asset paths (replacing legacy .jpg seeds that 404 on disk)
UPDATE public.inventory_items
SET image_url = regexp_replace(image_url, '\.jpe?g$', '.webp', 'i')
WHERE image_url ~* '^/assets/inventory/.*\.jpe?g$';

-- Clear any unintended non-original image overrides on giveaways so default artwork renders
UPDATE public.giveaways
SET image_url = NULL
WHERE image_url LIKE '%unsplash.com/photo-1706699778556-a9f9da002139%'
   OR image_url ~* '^/assets/giveaways/.*\.jpe?g$';
