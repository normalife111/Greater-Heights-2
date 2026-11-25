-- SAVORA · 0900 · Group menu categories into Food and Drinks (matches the printed menu boards)
alter table public.menu_categories
  add column menu_group text not null default 'Food' check (menu_group in ('Food', 'Drinks'));
create index menu_categories_group_idx on public.menu_categories (menu_group, sort_order);
