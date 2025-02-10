-- Update Reports bucket policies
update storage.buckets
set public = false
where id = 'Reports';

-- Update upload policy for Reports bucket
create policy "Upload policy for Reports bucket"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'Reports'
  and (storage.extension(name) = 'jpg' 
    or storage.extension(name) = 'jpeg'
    or storage.extension(name) = 'png'
    or storage.extension(name) = 'gif'
    or storage.extension(name) = 'pdf'
  )
  and length(name) < 255
);

-- Update read policy for Reports bucket
create policy "Read policy for Reports bucket"
on storage.objects for select
to authenticated
using (bucket_id = 'Reports');

-- Update update policy for Reports bucket
create policy "Update policy for Reports bucket"
on storage.objects for update
to authenticated
with check (bucket_id = 'Reports');

-- Update delete policy for Reports bucket
create policy "Delete policy for Reports bucket"
on storage.objects for delete
to authenticated
using (bucket_id = 'Reports'); 