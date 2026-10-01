WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY (name LIKE '%All-Wheel%')
    ORDER BY replace(replace(price,'$',''),',','')::numeric
  ) rn
  FROM public.inventory_items WHERE name LIKE '2026 Model Y Premium%'
)
UPDATE public.inventory_items i SET is_active = (r.rn = 1)
FROM ranked r WHERE i.id = r.id;

UPDATE public.inventory_items SET name = '2026 Model Y Premium Rear-Wheel Drive'
WHERE name LIKE '2026 Model Y Premium Rear-Wheel%' AND is_active;
UPDATE public.inventory_items SET name = '2026 Model Y Premium All-Wheel Drive'
WHERE name LIKE '2026 Model Y Premium All-Wheel%' AND is_active;

UPDATE public.inventory_items SET is_active = true
WHERE id IN ('ab062606-f7b5-483a-afe0-362b3c668700','f570b8f4-1a12-40f8-a13d-f731cc0a3c0c','c639fc11-d2be-4f28-a7f6-2ae200184a33','eee4d09f-954b-40f0-852d-2fc2121aeb8e','5651120f-5432-4be5-bc12-79c5a10b20b5');
UPDATE public.inventory_items SET image_url = '/assets/inventory/cybercab.webp' WHERE id = '5651120f-5432-4be5-bc12-79c5a10b20b5';