-- =====================================================================
-- 0006 — Add the nav.signout UI string
--
-- 0004 is already applied remotely, and the CLI records migrations by
-- version — editing it would never re-run. New content therefore needs a
-- forward migration, even for a single string.
--
-- Inserted with draft == published so it is live immediately, matching how
-- the rest of the nav strings were seeded.
-- =====================================================================

insert into public.ui_strings (key, section, draft_value, published_value, sort)
values (
  'nav.signout',
  'Navigation',
  '{"en":"Sign out","pt":"Sair","fr":"Déconnexion","es":"Cerrar sesión","kr":"Sai"}'::jsonb,
  '{"en":"Sign out","pt":"Sair","fr":"Déconnexion","es":"Cerrar sesión","kr":"Sai"}'::jsonb,
  6
)
on conflict (key) do nothing;
