-- Drop existing policies if they exist
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated updates" on storage.objects;
drop policy if exists "Allow public read access" on storage.objects;
drop policy if exists "Allow authenticated deletes" on storage.objects;

-- Create the chat-attachments bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do update set public = true;

-- Allow authenticated users to upload files
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
create policy "Allow authenticated updates"
on storage.objects for update
to authenticated
using (
    bucket_id = 'chat-attachments'
    and auth.uid() = owner
)
with check (
    bucket_id = 'chat-attachments'
    and auth.uid() = owner
);

-- Allow public read access to files
create policy "Allow public read access"
on storage.objects for select
to public
using (bucket_id = 'chat-attachments');

-- Allow authenticated users to delete their own files
create policy "Allow authenticated deletes"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'chat-attachments'
    and auth.uid() = owner
); 