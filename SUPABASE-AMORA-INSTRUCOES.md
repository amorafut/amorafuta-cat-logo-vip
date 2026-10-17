# Ativar o cadastro rápido da Amora Fut

Esta alteração está numa branch separada e ainda não muda o site principal.

## 1. Preparar o Supabase

1. Abra o projeto Supabase usado pela Amora Fut.
2. Entre em **SQL Editor** e execute todo o conteúdo de `supabase-amora-schema.sql`.
3. Em **Storage**, confirme que existe o bucket público `amora-product-images`. Se não existir, crie-o com esse nome e marque-o como público.
4. Em **Authentication → Users**, crie o usuário que será usado para entrar no painel. Guarde o UUID desse usuário.

## 2. Autorizar o administrador

No SQL Editor, execute o comando abaixo substituindo `COLE-AQUI-O-UUID-DO-USUARIO` pelo UUID copiado no passo anterior:

```sql
insert into public.amora_admin_users (user_id)
values ('COLE-AQUI-O-UUID-DO-USUARIO')
on conflict (user_id) do nothing;
```

A tabela de administradores não permite que qualquer usuário se autorize sozinho. Essa inserção deve ser feita pelo dono do projeto no SQL Editor.

## 3. Publicar e importar o catálogo atual

Depois que a alteração for revisada e publicada:

1. Abra o painel administrativo da Amora Fut.
2. Entre com o e-mail e a senha criados no Supabase.
3. Clique em **Importar catálogo atual** uma única vez. O painel copia produtos, estoque e fotos existentes para o Supabase.
4. Confira o catálogo público e algumas páginas de produto antes de começar novos cadastros.

A importação pode ser executada novamente se for interrompida: ela atualiza os produtos pelo ID. Não exclua o catálogo antigo do GitHub; ele fica como cópia de segurança.

## Como fica depois

- O site continua hospedado no GitHub Pages.
- O cadastro, a edição, as fotos, os preços e o estoque passam a ser salvos no Supabase.
- Novos produtos não exigem novo commit/publicação do GitHub.
- A tabela e o bucket são exclusivos da Amora Fut e não misturam os produtos do Cade Praia.

**Importante:** não cole uma chave `service_role` ou `secret` no site. A configuração usa somente a chave publicável e as permissões são controladas por RLS.
