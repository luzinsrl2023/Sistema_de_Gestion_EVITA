-- =====================================================
-- Migration: Habilitar Supabase Storage
-- =====================================================

-- Crear bucket para logos
insert into storage.buckets (id, name, public)
values (
  'logos',
  'logos',
  true
) on conflict (id) do nothing;

-- Crear bucket para archivos de contabilidad
insert into storage.buckets (id, name, public)
values (
  'contabilidad',
  'contabilidad',
  true
) on conflict (id) do nothing;

-- Crear bucket para documentos generales
insert into storage.buckets (id, name, public)
values (
  'documentos',
  'documentos',
  true
) on conflict (id) do nothing;

-- Políticas de almacenamiento para logos (público)
create policy "Logos públicas para todos"
on storage.objects for select
using (bucket_id = 'logos');

create policy "Usuarios autenticados pueden subir logos"
on storage.objects for insert
with check (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden actualizar logos"
on storage.objects for update
using (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden eliminar logos"
on storage.objects for delete
using (bucket_id = 'logos' and auth.role() = 'authenticated');

-- Políticas de almacenamiento para contabilidad (privado)
create policy "Documentos de contabilidad visibles para autenticados"
on storage.objects for select
using (bucket_id = 'contabilidad' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden subir documentos de contabilidad"
on storage.objects for insert
with check (bucket_id = 'contabilidad' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden actualizar documentos de contabilidad"
on storage.objects for update
using (bucket_id = 'contabilidad' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden eliminar documentos de contabilidad"
on storage.objects for delete
using (bucket_id = 'contabilidad' and auth.role() = 'authenticated');

-- Políticas de almacenamiento para documentos generales (público)
create policy "Documentos públicos visibles para todos"
on storage.objects for select
using (bucket_id = 'documentos');

create policy "Usuarios autenticados pueden subir documentos"
on storage.objects for insert
with check (bucket_id = 'documentos' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden actualizar documentos"
on storage.objects for update
using (bucket_id = 'documentos' and auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden eliminar documentos"
on storage.objects for delete
using (bucket_id = 'documentos' and auth.role() = 'authenticated');

-- Comentarios
comment on table storage.buckets is 'Buckets de almacenamiento habilitados para el sistema';
