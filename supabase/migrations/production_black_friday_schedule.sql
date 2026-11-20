-- Amora Fut | Black Friday 2026 | agendamento de expiração | PRODUÇÃO
-- Projeto de destino: clvhacmmmnltnzlkfcwd
-- Pré-requisito: habilitar pg_cron em Database > Extensions.
-- Agenda a liberação de reservas vencidas a cada minuto.
-- Execute depois de production_black_friday_launch.sql.

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

select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'amora-bf-expire-reservations';
