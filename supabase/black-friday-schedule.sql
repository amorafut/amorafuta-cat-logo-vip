-- Amora Fut | Black Friday 2026 | agendamento de expiração
-- Executar SOMENTE no projeto Supabase de TESTE: fdkvghcxfjqtiwwfjkjz
-- Pré-requisito: habilitar a extensão pg_cron em Database > Extensions.
-- Este script agenda a liberação de reservas vencidas a cada minuto.
-- Pode ser executado novamente sem criar jobs duplicados.

create extension if not exists pg_cron;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'amora-bf-expire-reservations'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'amora-bf-expire-reservations',
    '* * * * *',
    'select public.amora_bf_expire_reservations();'
  );
end;
$$;

-- Conferência: deve aparecer um job chamado amora-bf-expire-reservations
-- com schedule * * * * * e command select public.amora_bf_expire_reservations();
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'amora-bf-expire-reservations';
