-- Create storage bucket for template images
insert into storage.buckets (id, name, public)
values ('template-images', 'template-images', true);

-- RLS Policy: Users can view all images in the bucket (needed for email display)
create policy "Anyone can view template images"
on storage.objects for select
using (bucket_id = 'template-images');

-- RLS Policy: Users can upload their own images
create policy "Users can upload their own template images"
on storage.objects for insert
with check (
  bucket_id = 'template-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can update their own images
create policy "Users can update their own template images"
on storage.objects for update
using (
  bucket_id = 'template-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own images
create policy "Users can delete their own template images"
on storage.objects for delete
using (
  bucket_id = 'template-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);