-- SAVORA · 0800 · Storage buckets and policies
-- Public-read buckets for website images; uploads limited to staff with the matching permission.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('menu',    'menu',    true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('gallery', 'gallery', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('content', 'content', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "public reads website images" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('menu', 'gallery', 'content'));

create policy "menu managers upload menu images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu' and public.has_permission('menu.manage'));
create policy "menu managers change menu images" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu' and public.has_permission('menu.manage'))
  with check (bucket_id = 'menu' and public.has_permission('menu.manage'));
create policy "menu managers delete menu images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu' and public.has_permission('menu.manage'));

create policy "gallery managers upload gallery images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery' and public.has_permission('gallery.manage'));
create policy "gallery managers change gallery images" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery' and public.has_permission('gallery.manage'))
  with check (bucket_id = 'gallery' and public.has_permission('gallery.manage'));
create policy "gallery managers delete gallery images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery' and public.has_permission('gallery.manage'));

create policy "content managers upload content images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'content' and public.has_permission('content.manage'));
create policy "content managers change content images" on storage.objects
  for update to authenticated
  using (bucket_id = 'content' and public.has_permission('content.manage'))
  with check (bucket_id = 'content' and public.has_permission('content.manage'));
create policy "content managers delete content images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'content' and public.has_permission('content.manage'));
