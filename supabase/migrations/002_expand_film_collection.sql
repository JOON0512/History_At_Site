-- New archive titles remain commentable when community services are connected.
insert into public.films(id) values
  ('in-the-mood-for-love'), ('chungking-express'), ('perfect-days'),
  ('cinema-paradiso'), ('amelie'), ('before-sunrise'), ('roma'),
  ('city-of-god'), ('motorcycle-diaries'), ('out-of-africa'),
  ('a-separation'), ('slumdog-millionaire'), ('rabbit-proof-fence'),
  ('the-piano'), ('gladiator'), ('timbuktu'), ('the-last-emperor')
on conflict(id) do nothing;
