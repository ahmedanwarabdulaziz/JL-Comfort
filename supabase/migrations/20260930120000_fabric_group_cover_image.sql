-- An optional uploaded cover photo for a fabric group, used as its homepage tile image instead of
-- (or in front of) its member fabrics' own photos.
alter table fabric_groups add column cover_image_url text;
