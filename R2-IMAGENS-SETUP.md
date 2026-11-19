# Imagens da Amora Fut no Cloudflare R2

Esta implementação fica isolada na branch `feature/r2-image-storage`. Não altera o Worker de frete nem a branch principal da loja.

## O que foi preparado

- Worker `cloudflare/amora-fut-imagens.js` para receber imagens e armazená-las no R2.
- Leitura por URL do Worker, com cache de um ano.
- Upload protegido: o Worker valida a sessão Supabase e confirma o usuário em `amora_admin_users`.
- Limite de 15 MB por imagem e formatos JPG, PNG, WebP e AVIF.
- O painel administrativo de teste passa a usar o Worker quando `r2WorkerUrl` estiver configurado. Não faz fallback silencioso para o Storage antigo.

## Configuração necessária na Cloudflare

1. O bucket R2 `amora-fut-imagens` já foi criado.
2. Criar um Worker separado chamado `amora-fut-imagens`, usando o código de `cloudflare/amora-fut-imagens.js`.
3. Adicionar o binding R2 com variável `AMORA_IMAGES`, apontando para o bucket `amora-fut-imagens`.
4. Definir as variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY) conforme `wrangler-r2.jsonc`. A chave indicada é publishable, nunca usar service-role ou secret key.
5. Publicar o Worker e copiar sua URL, por exemplo `https://amora-fut-imagens.<subdominio>.workers.dev`.
6. Informar essa URL em `js/supabase-config.js`, na propriedade `r2WorkerUrl`, somente na branch de teste.

## Teste

- Entrar no painel de teste com um usuário que exista em `amora_admin_users` no projeto Supabase de teste.
- Enviar uma imagem pequena em um produto de teste.
- Confirmar resposta HTTP 201, abertura da imagem em `/images/<key>` e objeto presente no bucket R2.
- Se o upload retornar não autorizado, conferir a existência e as permissões de leitura da tabela `amora_admin_users` no projeto de teste.

## Migração das imagens antigas

Ainda NÃO migra nem apaga imagens do Supabase. Primeiro é necessário testar o upload novo, conferir as URLs públicas e planejar uma migração em lotes. As referências antigas nos produtos devem permanecer funcionando até a verificação final.
