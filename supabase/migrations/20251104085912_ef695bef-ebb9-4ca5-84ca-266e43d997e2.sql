-- Create public bucket for harvester builds
insert into storage.buckets (id, name, public)
values ('harvester', 'harvester', true)
on conflict (id) do nothing;

-- Allow public read access to harvester builds
create policy "Public read for harvester"
on storage.objects
for select
to public
using (bucket_id = 'harvester');

-- Allow admins to upload/update/delete builds
create policy "Admins insert harvester"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'harvester'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

create policy "Admins update harvester"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'harvester'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
)
with check (
  bucket_id = 'harvester'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

create policy "Admins delete harvester"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'harvester'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);