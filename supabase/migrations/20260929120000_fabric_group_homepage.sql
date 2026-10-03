-- Lets a fabric group (e.g. "Most Selling Fabrics") be shown on the homepage, with specific member
-- fabrics marked as its featured/cover photos.
alter table fabric_groups add column show_on_homepage boolean not null default false;
alter table fabric_group_members add column is_featured boolean not null default false;

-- Homepage catalog summary reads only the enabled groups and their featured members.
create index idx_fabric_groups_homepage on fabric_groups (sort_order) where show_on_homepage;
create index idx_fgm_featured on fabric_group_members (group_id) where is_featured;
