# Migração do Supabase amora-fut-teste para Cloudflare

## Escopo e segurança
- Origem autorizada: projeto Supabase `amora-fut-teste`, ref `fdkvghcxfjqtiwwfjkjz`.
- Fora do escopo: projeto principal `amora-fut`, ref `clvhacmmmnltnzlkfcwd`.
- Não excluir, desligar, alterar DNS ou substituir produção sem autorização expressa.
- Em 2026-11-17 o painel do Supabase mostrou “Services restricted” por cota da organização. Ainda não existe backup/exportação real verificada.

## Inventário do código versionado
- `js/supabase-config.js` aponta o catálogo para `https://fdkvghcxfjqtiwwfjkjz.supabase.co`.
- O painel usa `public.amora_products` e consulta `public.amora_admin_users` para autorizar administradores.
- `supabase-amora-schema.sql` descreve essas duas tabelas e políticas RLS, mas seu comentário aponta para o projeto de produção. Não executar no projeto de teste sem comparar o schema real.
- O painel guarda o controle de vendas em `localStorage` (`amora_fut_sales_v1`); não confundir com dados remotos do banco.
- Bucket de imagens configurado: `amora-product-images`; URLs ficam no campo `images` de `amora_products`.
- Worker de imagens R2 está em preparação separada na branch `feature/r2-image-storage` / PR #10. Não está concluído nem mesclado.

## Frete — preservar obrigatoriamente
- Worker existente: `amora-fut-frete`, código `cloudflare/amora-fut-frete.js`, config `wrangler.jsonc`.
- Endpoint utilizado em `js/cart.js`: `https://amora-fut-frete.amorafut.workers.dev/`.
- O segredo `SUPERFRETE_TOKEN` está configurado no ambiente Cloudflare; não está no repositório e nunca deve ir para o frontend.
- O Worker consulta `https://api.superfrete.com/api/v0/calculator`, origem CEP `60347540`, serviços `1,2,17`.
- Pacote: altura 4 cm por peça, largura 21 cm, comprimento 30 cm, peso (240 g por peça + 20 g de embalagem) por quantidade.
- Carrinho persiste CEP no navegador, calcula opções, permite selecionar serviço e inclui frete/subtotal/total no texto de WhatsApp.
- Não modificar nem desligar esse Worker durante a migração de banco/imagens. Testes finais obrigatórios: CEP, cotação, opções, escolha do frete, total e mensagem WhatsApp em celular e desktop.

## Arquitetura de destino proposta
- R2 para fotos.
- Workers para endpoints e lógica de backend.
- Manter PostgreSQL compatível inicialmente e conectar por Hyperdrive; não converter para D1 sem necessidade demonstrada.
- Definir provedor/fluxo de autenticação antes de substituir Supabase Auth. Nunca guardar senha em texto puro nem expor segredos no frontend.

## Etapas
1. Obter backup verificável do banco de teste (schema + dados) e inventário/exportação de Auth.
2. Inventariar bucket de Storage (contagem, tamanho, chaves e vínculo aos produtos).
3. Escolher PostgreSQL de destino e autenticação.
4. Restaurar em ambiente isolado e conferir contagens/amostras.
5. Copiar imagens ao R2 com mapa de URLs antigas para novas; manter originais.
6. Adaptar catálogo e painel em branch isolada.
7. Testar login, RLS/perfis, CRUD, estoque, preços, publicação, imagens, carrinho e integração SuperFrete.
8. Só fazer corte após aprovação. Manter Supabase de teste e arquivos originais até autorização expressa.

## Bloqueios e pontos ainda não comprovados
- A cota excedida restringe serviços Supabase; exportação não foi executada.
- O schema versionado não comprova que o projeto de teste tenha exatamente as mesmas tabelas, políticas e dados.
- O token SuperFrete e segredos de ambiente não podem ser lidos do repositório.
