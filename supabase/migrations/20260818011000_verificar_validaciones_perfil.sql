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

do $$
begin
  if not public.rut_perfil_valido('21.349.954-8') then raise exception 'PRUEBA_RUT_VALIDO_FALLO'; end if;
  if not public.rut_perfil_valido('6.000.000-K') then raise exception 'PRUEBA_RUT_K_FALLO'; end if;
  if public.rut_perfil_valido('11.111.111-2') then raise exception 'PRUEBA_RUT_INVALIDO_FALLO'; end if;
  if public.normalizar_rut_perfil('12345678-5') <> '12.345.678-5' then raise exception 'PRUEBA_FORMATO_RUT_FALLO'; end if;
  if public.normalizar_telefono_perfil('+56 9 1234 5678') <> '+56912345678' then raise exception 'PRUEBA_TELEFONO_FALLO'; end if;
end;
$$;
