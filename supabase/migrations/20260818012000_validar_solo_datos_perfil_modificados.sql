alter table public.perfil
  drop constraint if exists perfil_nombre_valido,
  drop constraint if exists perfil_apellido_valido,
  drop constraint if exists perfil_rut_chileno_valido,
  drop constraint if exists perfil_correo_valido,
  drop constraint if exists perfil_telefono_valido;

create or replace function public.normalizar_datos_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.nombre is distinct from old.nombre then
    new.nombre := regexp_replace(btrim(new.nombre), '[[:space:]]+', ' ', 'g');
  end if;
  if tg_op = 'INSERT' or new.apellido is distinct from old.apellido then
    new.apellido := regexp_replace(btrim(new.apellido), '[[:space:]]+', ' ', 'g');
  end if;
  if tg_op = 'INSERT' or new.rut is distinct from old.rut then
    new.rut := public.normalizar_rut_perfil(new.rut);
  end if;
  if tg_op = 'INSERT' or new.correo is distinct from old.correo then
    new.correo := lower(btrim(new.correo));
  end if;
  if tg_op = 'INSERT' or new.telefono is distinct from old.telefono then
    new.telefono := public.normalizar_telefono_perfil(new.telefono);
  end if;
  return new;
end;
$$;

create or replace function public.validar_datos_perfil_modificados()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.nombre is distinct from old.nombre) and not (
    char_length(new.nombre) between 2 and 100
    and new.nombre ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$'
  ) then raise exception 'NOMBRE_INVALIDO' using errcode = 'check_violation'; end if;

  if (tg_op = 'INSERT' or new.apellido is distinct from old.apellido) and not (
    char_length(new.apellido) between 2 and 100
    and new.apellido ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$'
  ) then raise exception 'APELLIDO_INVALIDO' using errcode = 'check_violation'; end if;

  if (tg_op = 'INSERT' or new.rut is distinct from old.rut) and not public.rut_perfil_valido(new.rut)
  then raise exception 'RUT_INVALIDO' using errcode = 'check_violation'; end if;

  if (tg_op = 'INSERT' or new.correo is distinct from old.correo) and not (
    char_length(new.correo) between 3 and 150
    and new.correo !~ '[[:space:]]'
    and new.correo ~ '^[^@]+@[^@]+\.[^@]+$'
  ) then raise exception 'CORREO_INVALIDO' using errcode = 'check_violation'; end if;

  if (tg_op = 'INSERT' or new.telefono is distinct from old.telefono)
    and new.telefono is not null and new.telefono !~ '^\+569\d{8}$'
  then raise exception 'TELEFONO_INVALIDO' using errcode = 'check_violation'; end if;

  return new;
end;
$$;

revoke all on function public.validar_datos_perfil_modificados() from public, anon, authenticated;

drop trigger if exists trg_validar_datos_perfil_modificados on public.perfil;
create trigger trg_validar_datos_perfil_modificados
before insert or update of nombre, apellido, rut, correo, telefono on public.perfil
for each row execute function public.validar_datos_perfil_modificados();

comment on function public.validar_datos_perfil_modificados() is
  'Valida todos los datos en altas y únicamente los campos modificados en perfiles históricos.';
