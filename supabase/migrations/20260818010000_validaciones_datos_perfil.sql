create or replace function public.normalizar_rut_perfil(valor text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  limpio text := upper(regexp_replace(coalesce(valor, ''), '[.[:space:]-]', '', 'g'));
  cuerpo text;
  verificador text;
begin
  if limpio !~ '^\d{1,8}[0-9K]$' then return upper(btrim(coalesce(valor, ''))); end if;
  cuerpo := left(limpio, -1);
  verificador := right(limpio, 1);
  return regexp_replace(cuerpo, '(\d)(?=(\d{3})+(?!\d))', '\1.', 'g') || '-' || verificador;
end;
$$;

create or replace function public.rut_perfil_valido(valor text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  limpio text := upper(regexp_replace(coalesce(valor, ''), '[.[:space:]-]', '', 'g'));
  cuerpo text;
  suma integer := 0;
  multiplicador integer := 2;
  resultado integer;
  esperado text;
  indice integer;
begin
  if limpio !~ '^\d{7,8}[0-9K]$' then return false; end if;
  cuerpo := left(limpio, -1);
  for indice in reverse length(cuerpo)..1 loop
    suma := suma + substr(cuerpo, indice, 1)::integer * multiplicador;
    multiplicador := case when multiplicador = 7 then 2 else multiplicador + 1 end;
  end loop;
  resultado := 11 - (suma % 11);
  esperado := case when resultado = 11 then '0' when resultado = 10 then 'K' else resultado::text end;
  return right(limpio, 1) = esperado;
end;
$$;

create or replace function public.normalizar_telefono_perfil(valor text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare limpio text := regexp_replace(btrim(coalesce(valor, '')), '[[:space:]()-]', '', 'g');
begin
  if limpio = '' then return null; end if;
  if limpio ~ '^9\d{8}$' then return '+56' || limpio; end if;
  if limpio ~ '^569\d{8}$' then return '+' || limpio; end if;
  return limpio;
end;
$$;

create or replace function public.normalizar_datos_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.nombre := regexp_replace(btrim(new.nombre), '[[:space:]]+', ' ', 'g');
  new.apellido := regexp_replace(btrim(new.apellido), '[[:space:]]+', ' ', 'g');
  new.rut := public.normalizar_rut_perfil(new.rut);
  new.correo := lower(btrim(new.correo));
  new.telefono := public.normalizar_telefono_perfil(new.telefono);
  return new;
end;
$$;

revoke all on function public.normalizar_rut_perfil(text), public.rut_perfil_valido(text),
  public.normalizar_telefono_perfil(text), public.normalizar_datos_perfil() from public, anon, authenticated;

drop trigger if exists trg_normalizar_datos_perfil on public.perfil;
create trigger trg_normalizar_datos_perfil
before insert or update of nombre, apellido, rut, correo, telefono on public.perfil
for each row execute function public.normalizar_datos_perfil();

alter table public.perfil
  add constraint perfil_nombre_valido check (
    char_length(nombre) between 2 and 100
    and nombre ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$'
  ) not valid,
  add constraint perfil_apellido_valido check (
    char_length(apellido) between 2 and 100
    and apellido ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$'
  ) not valid,
  add constraint perfil_rut_chileno_valido check (public.rut_perfil_valido(rut)) not valid,
  add constraint perfil_correo_valido check (
    char_length(correo) between 3 and 150
    and correo !~ '[[:space:]]'
    and correo ~ '^[^@]+@[^@]+\.[^@]+$'
  ) not valid,
  add constraint perfil_telefono_valido check (telefono is null or telefono ~ '^\+569\d{8}$') not valid;

comment on function public.rut_perfil_valido(text) is
  'Valida el dígito verificador de un RUT chileno mediante módulo 11.';
comment on constraint perfil_rut_chileno_valido on public.perfil is
  'Protege escrituras nuevas sin invalidar los RUT históricos preexistentes hasta su corrección.';
