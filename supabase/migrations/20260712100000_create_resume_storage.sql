-- ─────────────────────────────────────────────────────────────
-- Resume file storage bucket and policies
-- ─────────────────────────────────────────────────────────────

-- Create storage bucket for resume files (private)
insert into storage.buckets (id, name, public)
values ('resume-files', 'resume-files', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload resume files to their own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resume-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
create policy "Users can read their own resume files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resume-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
create policy "Users can delete their own resume files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resume-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Add file_path column to resumes table
alter table resumes add column file_path text;

create index idx_resumes_file_path on resumes (file_path) where file_path is not null;
