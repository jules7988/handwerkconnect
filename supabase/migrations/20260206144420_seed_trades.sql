insert into public.trades (name) values
('Anlagenmechaniker SHK'),
('Bäcker'),
('Dachdecker'),
('Elektroniker'),
('Fahrzeuglackierer'),
('Fliesenleger'),
('Friseur'),
('Gärtner'),
('Gebäudereiniger'),
('Kfz-Mechatroniker'),
('Maler und Lackierer'),
('Metallbauer'),
('Schreiner'),
('Tischler'),
('Zimmerer')
on conflict (name) do nothing;
