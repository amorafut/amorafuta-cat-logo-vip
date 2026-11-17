# Imagens da Amora Fut no Cloudflare R2

Esta implementação fica isolada na branch `feature/r2-image-storage`. Não altera o Worker de frete.

## O que foi preparado

- Worker `cloudflare/amora-fut-imagens.js` para receber imagens e armazená-las no R2.
- Leitura pública por URL do Worker, com cache de um ano.
- Upload protegido: o Worker valida a sessão Supabase e confirma o usuário em `amora_admin_users`.
- Limite de 15 MB por imagem e formatos JPG, PNG, WebP e AVIF.
- O painel administrativo passa a usar o Worker quando `r2WorkerUrl` estiver configurado. Não faz fallback silencioso para o Storage antigo.

## Configuração necessária na Cloudflare

1. Criar um bucket R2 chamado exatamente `amora-fut-imagens`.
2. Criar o Worker a partir deste repositório usando `wrangler.jsonc`.
3. Confirmar a vinculação R2 com nome `AMORA_IMAGES`.
4. No Worker, definir a variável `SUPABASE_PUBLISHABLE_KEY` com a chave pública (publishable) do projeto de teste indicado no arquivo. Não usar service-role nem secret key.
5. Publicar o Worker e copiar sua URL, por exemplo `https://amora-fut-imagens.<subdominio>.workers.dev`.
6. A URL deverá ser informada em `js/supabase-config.js`, na propriedade `r2WorkerUrl`.

## Teste

- Entrar no painel de teste com um usuário que exista em `amora_admin_users`.
- Enviar uma imagem pequena em um produto de teste.
- Confirmar que a resposta é HTTP 201 e que a imagem abre em `/images/<key>`.
- Confirmar no painel R2 que o objeto apareceu.

## Migração das imagens antigas

Ainda NÃO migra nem apaga imagens do Supabase. Primeiro é necessário testar o upload novo, conferir as URLs públicas e planejar uma migração em lotes. As referências antigas nos produtos devem permanecer funcionando até a verificação final.
