-- EXPORTAÇÃO DO PROJETO DE TESTE amora-fut-teste
-- Execute no SQL Editor do projeto fdkvghcxfjqtiwwfjkjz.
-- Estas consultas apenas LEEM dados; não alteram nem apagam nada.
-- Não execute no projeto de produção clvhacmmmnltnzlkfcwd.

-- 1) Exportar os 111 produtos completos (inclui estoque e URLs das imagens).
select *
from public.amora_products
order by sort_order asc, created_at desc;

-- 2) Exportar o vínculo do administrador (não contém senha).
select user_id, created_at
from public.amora_admin_users
order by created_at asc;

-- No resultado de cada consulta, use o botão Download/Export CSV do Supabase.
-- Guarde os dois arquivos sem editar. Não compartilhe senhas, tokens ou chaves secretas.
