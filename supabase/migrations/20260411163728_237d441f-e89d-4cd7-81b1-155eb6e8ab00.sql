
-- Create storage bucket for item files
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-files', 'item-files', true);

-- Allow public read access
CREATE POLICY "Public read item-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-files');

-- Allow public upload
CREATE POLICY "Public upload item-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-files');

-- Allow public update
CREATE POLICY "Public update item-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'item-files');

-- Allow public delete
CREATE POLICY "Public delete item-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'item-files');
