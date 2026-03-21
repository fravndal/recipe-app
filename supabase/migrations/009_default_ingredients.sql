-- 009_default_ingredients.sql
-- Create a function to seed default ingredients for a user

begin;

-- Function to add default ingredients for a user
create or replace function public.seed_default_ingredients(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Only insert if user doesn't already have ingredients (avoid duplicates)
  if exists (select 1 from public.ingredients where user_id = target_user_id limit 1) then
    raise notice 'User already has ingredients, skipping seed';
    return;
  end if;

  insert into public.ingredients (user_id, name, category, default_unit) values
    -- Grønnsaker
    (target_user_id, 'Gulrot', 'Grønnsaker', 'stk'),
    (target_user_id, 'Løk', 'Grønnsaker', 'stk'),
    (target_user_id, 'Rødløk', 'Grønnsaker', 'stk'),
    (target_user_id, 'Hvitløk', 'Grønnsaker', 'stk'),
    (target_user_id, 'Purreløk', 'Grønnsaker', 'stk'),
    (target_user_id, 'Vårløk', 'Grønnsaker', 'stk'),
    (target_user_id, 'Reddik', 'Grønnsaker', 'stk'),
    (target_user_id, 'Ingefær', 'Grønnsaker', 'bit'),
    (target_user_id, 'Brokkoli', 'Grønnsaker', 'stk'),
    (target_user_id, 'Blomkål', 'Grønnsaker', 'stk'),
    (target_user_id, 'Rosenkål', 'Grønnsaker', 'g'),
    (target_user_id, 'Hodekål', 'Grønnsaker', 'stk'),
    (target_user_id, 'Rødkål', 'Grønnsaker', 'stk'),
    (target_user_id, 'Grønnkål', 'Grønnsaker', 'bunt'),
    (target_user_id, 'Isbergsalat', 'Grønnsaker', 'stk'),
    (target_user_id, 'Hjertesalat', 'Grønnsaker', 'stk'),
    (target_user_id, 'Ruccola', 'Grønnsaker', 'pose'),
    (target_user_id, 'Spinat', 'Grønnsaker', 'pose'),
    (target_user_id, 'Squash', 'Grønnsaker', 'stk'),
    (target_user_id, 'Aubergine', 'Grønnsaker', 'stk'),
    (target_user_id, 'Paprika', 'Grønnsaker', 'stk'),
    (target_user_id, 'Chili', 'Grønnsaker', 'stk'),
    (target_user_id, 'Agurk', 'Grønnsaker', 'stk'),
    (target_user_id, 'Tomat', 'Grønnsaker', 'stk'),
    (target_user_id, 'Cherrytomat', 'Grønnsaker', 'pakke'),
    (target_user_id, 'Sopp', 'Grønnsaker', 'pakke'),
    (target_user_id, 'Sjampinjong', 'Grønnsaker', 'pakke'),
    (target_user_id, 'Sukkererter', 'Grønnsaker', 'pakke'),
    (target_user_id, 'Mais (korn)', 'Grønnsaker', 'boks'),
    (target_user_id, 'Erter', 'Grønnsaker', 'boks'),
    (target_user_id, 'Bønnespirer', 'Grønnsaker', 'pakke'),

    -- Poteter og rotfrukter
    (target_user_id, 'Potet', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Søtpotet', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Sellerirot', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Pastinakk', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Persillerot', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Kålrot', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Rødbete', 'Poteter og rotfrukter', 'stk'),
    (target_user_id, 'Nepe', 'Poteter og rotfrukter', 'stk'),

    -- Frukt
    (target_user_id, 'Avokado', 'Frukt', 'stk'),
    (target_user_id, 'Sitron', 'Frukt', 'stk'),
    (target_user_id, 'Lime', 'Frukt', 'stk'),
    (target_user_id, 'Eple', 'Frukt', 'stk'),
    (target_user_id, 'Banan', 'Frukt', 'stk'),
    (target_user_id, 'Appelsin', 'Frukt', 'stk'),
    (target_user_id, 'Pære', 'Frukt', 'stk'),
    (target_user_id, 'Druer', 'Frukt', 'pakke'),
    (target_user_id, 'Mango', 'Frukt', 'stk'),

    -- Kjøtt
    (target_user_id, 'Kyllingfilet', 'Kjøtt', 'filet'),
    (target_user_id, 'Kyllinglår', 'Kjøtt', 'stk'),
    (target_user_id, 'Kyllingvinger', 'Kjøtt', 'pakke'),
    (target_user_id, 'Kjøttdeig', 'Kjøtt', 'g'),
    (target_user_id, 'Karbonadedeig', 'Kjøtt', 'g'),
    (target_user_id, 'Svin indrefilet', 'Kjøtt', 'g'),
    (target_user_id, 'Svin ytrefilet', 'Kjøtt', 'g'),
    (target_user_id, 'Svinekotelett', 'Kjøtt', 'stk'),
    (target_user_id, 'Bacon', 'Kjøtt', 'pakke'),
    (target_user_id, 'Skinke', 'Kjøtt', 'pakke'),
    (target_user_id, 'Chorizo', 'Kjøtt', 'pakke'),
    (target_user_id, 'Pølser', 'Kjøtt', 'pakke'),
    (target_user_id, 'Lammekjøtt', 'Kjøtt', 'g'),
    (target_user_id, 'Lammeskank', 'Kjøtt', 'stk'),
    (target_user_id, 'Oksegrytekjøtt', 'Kjøtt', 'g'),
    (target_user_id, 'Biff', 'Kjøtt', 'stk'),

    -- Fisk og sjømat
    (target_user_id, 'Laks', 'Fisk og sjømat', 'g'),
    (target_user_id, 'Laksefilet', 'Fisk og sjømat', 'filet'),
    (target_user_id, 'Torsk', 'Fisk og sjømat', 'g'),
    (target_user_id, 'Torskefilet', 'Fisk og sjømat', 'filet'),
    (target_user_id, 'Sei', 'Fisk og sjømat', 'g'),
    (target_user_id, 'Ørret', 'Fisk og sjømat', 'g'),
    (target_user_id, 'Reker', 'Fisk og sjømat', 'g'),
    (target_user_id, 'Scampi', 'Fisk og sjømat', 'g'),
    (target_user_id, 'Blåskjell', 'Fisk og sjømat', 'kg'),
    (target_user_id, 'Tunfisk', 'Fisk og sjømat', 'boks'),
    (target_user_id, 'Makrell i tomat', 'Fisk og sjømat', 'boks'),
    (target_user_id, 'Sild', 'Fisk og sjømat', 'glass'),

    -- Meieriprodukter
    (target_user_id, 'Melk', 'Meieriprodukter', 'l'),
    (target_user_id, 'Lettmelk', 'Meieriprodukter', 'l'),
    (target_user_id, 'Helmelk', 'Meieriprodukter', 'l'),
    (target_user_id, 'Fløte', 'Meieriprodukter', 'dl'),
    (target_user_id, 'Matfløte', 'Meieriprodukter', 'dl'),
    (target_user_id, 'Kremfløte', 'Meieriprodukter', 'dl'),
    (target_user_id, 'Rømme', 'Meieriprodukter', 'beger'),
    (target_user_id, 'Crème fraîche', 'Meieriprodukter', 'beger'),
    (target_user_id, 'Yoghurt naturell', 'Meieriprodukter', 'beger'),
    (target_user_id, 'Gresk yoghurt', 'Meieriprodukter', 'beger'),
    (target_user_id, 'Smør', 'Meieriprodukter', 'g'),
    (target_user_id, 'Margarin', 'Meieriprodukter', 'g'),
    (target_user_id, 'Ost (gulost)', 'Meieriprodukter', 'g'),
    (target_user_id, 'Revet ost', 'Meieriprodukter', 'pakke'),
    (target_user_id, 'Parmesan', 'Meieriprodukter', 'g'),
    (target_user_id, 'Mozzarella', 'Meieriprodukter', 'pakke'),
    (target_user_id, 'Fetaost', 'Meieriprodukter', 'pakke'),
    (target_user_id, 'Kremost', 'Meieriprodukter', 'pakke'),

    -- Egg
    (target_user_id, 'Egg', 'Egg', 'stk'),

    -- Korn og kornprodukter
    (target_user_id, 'Hvetemel', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Siktet hvetemel', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Sammalt hvete', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Havregryn', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Ris', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Basmatiris', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Jasminris', 'Korn og kornprodukter', 'kg'),
    (target_user_id, 'Pasta', 'Korn og kornprodukter', 'g'),
    (target_user_id, 'Spaghetti', 'Korn og kornprodukter', 'g'),
    (target_user_id, 'Nudler', 'Korn og kornprodukter', 'pakke'),
    (target_user_id, 'Tortilla', 'Korn og kornprodukter', 'pakke'),
    (target_user_id, 'Pitabrød', 'Korn og kornprodukter', 'pakke'),
    (target_user_id, 'Brød', 'Korn og kornprodukter', 'skive'),
    (target_user_id, 'Brødsmuler', 'Korn og kornprodukter', 'pakke'),
    (target_user_id, 'Gjær', 'Korn og kornprodukter', 'pakke'),
    (target_user_id, 'Bakepulver', 'Korn og kornprodukter', 'pakke'),
    (target_user_id, 'Natron', 'Korn og kornprodukter', 'pakke'),

    -- Belgfrukter
    (target_user_id, 'Kikerter', 'Belgfrukter', 'boks'),
    (target_user_id, 'Røde linser', 'Belgfrukter', 'g'),
    (target_user_id, 'Grønne linser', 'Belgfrukter', 'g'),
    (target_user_id, 'Kidneybønner', 'Belgfrukter', 'boks'),
    (target_user_id, 'Svarte bønner', 'Belgfrukter', 'boks'),
    (target_user_id, 'Hvite bønner', 'Belgfrukter', 'boks'),

    -- Nøtter og frø
    (target_user_id, 'Mandler', 'Nøtter og frø', 'g'),
    (target_user_id, 'Valnøtter', 'Nøtter og frø', 'g'),
    (target_user_id, 'Cashewnøtter', 'Nøtter og frø', 'g'),
    (target_user_id, 'Peanøtter', 'Nøtter og frø', 'g'),
    (target_user_id, 'Solsikkefrø', 'Nøtter og frø', 'g'),
    (target_user_id, 'Gresskarkjerner', 'Nøtter og frø', 'g'),
    (target_user_id, 'Sesamfrø', 'Nøtter og frø', 'g'),
    (target_user_id, 'Chiafrø', 'Nøtter og frø', 'g'),
    (target_user_id, 'Linfrø', 'Nøtter og frø', 'g'),

    -- Krydder og urter
    (target_user_id, 'Salt', 'Krydder og urter', 'ts'),
    (target_user_id, 'Pepper', 'Krydder og urter', 'ts'),
    (target_user_id, 'Paprikapulver', 'Krydder og urter', 'ts'),
    (target_user_id, 'Chilipulver', 'Krydder og urter', 'ts'),
    (target_user_id, 'Spisskummen', 'Krydder og urter', 'ts'),
    (target_user_id, 'Koriander (tørket)', 'Krydder og urter', 'ts'),
    (target_user_id, 'Oregano', 'Krydder og urter', 'ts'),
    (target_user_id, 'Basilikum', 'Krydder og urter', 'ts'),
    (target_user_id, 'Timian', 'Krydder og urter', 'ts'),
    (target_user_id, 'Rosmarin', 'Krydder og urter', 'ts'),
    (target_user_id, 'Kanel', 'Krydder og urter', 'ts'),
    (target_user_id, 'Kardemomme', 'Krydder og urter', 'ts'),
    (target_user_id, 'Nellik', 'Krydder og urter', 'klype'),
    (target_user_id, 'Muskat', 'Krydder og urter', 'klype'),
    (target_user_id, 'Laurbærblad', 'Krydder og urter', 'stk'),
    (target_user_id, 'Dill', 'Krydder og urter', 'bunt'),
    (target_user_id, 'Persille', 'Krydder og urter', 'bunt'),
    (target_user_id, 'Koriander (fersk)', 'Krydder og urter', 'bunt'),
    (target_user_id, 'Gressløk', 'Krydder og urter', 'bunt'),

    -- Oljer og fett
    (target_user_id, 'Olivenolje', 'Oljer og fett', 'ss'),
    (target_user_id, 'Rapsolje', 'Oljer og fett', 'ss'),
    (target_user_id, 'Solsikkeolje', 'Oljer og fett', 'ss'),
    (target_user_id, 'Sesamolje', 'Oljer og fett', 'ts'),
    (target_user_id, 'Smør (til steking)', 'Oljer og fett', 'ss'),

    -- Søtning og sukker
    (target_user_id, 'Sukker', 'Søtning og sukker', 'g'),
    (target_user_id, 'Brunt sukker', 'Søtning og sukker', 'g'),
    (target_user_id, 'Honning', 'Søtning og sukker', 'ss'),
    (target_user_id, 'Lønnesirup', 'Søtning og sukker', 'ss'),
    (target_user_id, 'Vaniljesukker', 'Søtning og sukker', 'ts'),

    -- Sauser og dressinger
    (target_user_id, 'Soyasaus', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Teriyakisaus', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Fiskesaus', 'Sauser og dressinger', 'ts'),
    (target_user_id, 'Oystersaus', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Ketchup', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Sennep', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Dijonsennep', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Majones', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Aioli', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Tomatpuré', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Hakkede tomater', 'Sauser og dressinger', 'boks'),
    (target_user_id, 'Passata', 'Sauser og dressinger', 'kartong'),
    (target_user_id, 'Kokosmelk', 'Sauser og dressinger', 'boks'),
    (target_user_id, 'Buljongterning', 'Sauser og dressinger', 'stk'),
    (target_user_id, 'Buljong (fond)', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Worcestersaus', 'Sauser og dressinger', 'ts'),
    (target_user_id, 'Eddik', 'Sauser og dressinger', 'ss'),
    (target_user_id, 'Eplecidereddik', 'Sauser og dressinger', 'ss'),

    -- Plantebaserte alternativer
    (target_user_id, 'Tofu', 'Plantebaserte alternativer', 'pakke'),
    (target_user_id, 'Oatly (havredrikk)', 'Plantebaserte alternativer', 'kartong'),
    (target_user_id, 'Soyadrikk', 'Plantebaserte alternativer', 'kartong'),
    (target_user_id, 'Plantebasert matfløte', 'Plantebaserte alternativer', 'kartong'),
    (target_user_id, 'Vegansk "kjøttdeig"', 'Plantebaserte alternativer', 'pakke');

end;
$$;

-- Grant execute permission to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;
grant execute on function public.seed_default_ingredients(uuid) to authenticated;

-- Trigger function to auto-seed ingredients for new users
create or replace function public.handle_new_user_ingredients()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.seed_default_ingredients(new.id);
  return new;
end;
$$;

-- Trigger that fires after a new user is created
drop trigger if exists on_auth_user_created_seed_ingredients on auth.users;
create trigger on_auth_user_created_seed_ingredients
  after insert on auth.users
  for each row
  execute function public.handle_new_user_ingredients();

commit;
