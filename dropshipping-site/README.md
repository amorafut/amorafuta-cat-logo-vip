# Prévia estática isolada — Dropshipping AmoraFut

Esta pasta contém apenas a página de apresentação do Dropshipping.

## Publicação de prévia

Criar um projeto Cloudflare Pages separado, conectado ao repositório `amorafut/amorafuta-cat-logo-vip`, selecionando a branch `dropshipping-entry-page`.

Configuração:
- Framework preset: None
- Build command: deixar vazio
- Build output directory: `dropshipping-site`
- Root directory: `/` (repositório)

Não reutilizar o projeto Worker `amorafuta-cat-logo-vip`, não alterar `wrangler.jsonc` da raiz e não configurar domínio da loja principal. O projeto Pages deve ter nome próprio para a prévia Dropshipping.

Esta pasta não contém carrinho, banco de dados, autenticação ou integração com o Worker de frete da loja principal.
