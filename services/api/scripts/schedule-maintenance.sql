-- Run in the new Supabase project's SQL Editor after the API is healthy.
-- First store akar_api_url (the production origin) and akar_job_secret in Supabase Vault.
-- Never paste secrets into this tracked file. See https://supabase.com/docs/guides/functions/schedule-functions
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'akar_api_url' and decrypted_secret like 'https://%')
     or not exists (select 1 from vault.decrypted_secrets where name = 'akar_job_secret' and length(decrypted_secret) >= 32) then
    raise exception 'Set akar_api_url and akar_job_secret in Vault before scheduling';
  end if;
end $$;

-- The stable name updates an existing schedule instead of creating duplicate calls.
select cron.schedule(
  'akar-maintenance',
  '* * * * *',
  $job$
    select net.http_post(
      url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'akar_api_url'), '/') || '/internal/jobs/run',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-akar-job-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'akar_job_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 290000
    );
  $job$
);
-- Inspect HTTP results (cron success alone only means the HTTP request was enqueued):
-- select id, status_code, error_msg, created from net._http_response order by created desc limit 10;
-- To stop calls: select cron.unschedule('akar-maintenance');
