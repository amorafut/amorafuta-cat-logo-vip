# Painel Amora Fut

O site agora possui um painel administrativo em `/admin/`.

## O que o painel faz

- cadastrar, editar e excluir produtos;
- cadastrar time, categoria e versão;
- controlar preço e preço anterior;
- controlar estoque por P/M/G/GG;
- marcar produto como publicado ou rascunho;
- marcar esgotado;
- adicionar várias fotos;
- publicar alterações no catálogo;
- enviar as fotos para `assets/images/catalog/`;
- atualizar `data/products.json`.

## Primeiro acesso

1. Abra `https://amorafut.github.io/amorafuta-cat-logo-vip/admin/`.
2. Crie um Fine-grained personal access token no GitHub.
3. Restrinja o token ao repositório `amorafut/amorafuta-cat-logo-vip`.
4. Dê apenas a permissão **Contents: Read and write**.
5. Cole o token no painel e clique em **Conectar**.

O painel usa o token somente no navegador. Por padrão ele fica apenas na sessão; só fica salvo no dispositivo se você marcar a opção correspondente.

Nunca envie seu token por WhatsApp, e-mail ou conversa.

## Fluxo de cadastro

**Novo produto → preencher dados → adicionar fotos → Salvar produto → Publicar alterações.**

O site público lê automaticamente o arquivo `data/products.json`, então novos produtos passam a aparecer no catálogo depois da publicação e da atualização do GitHub Pages.

## Importante

GitHub Pages é hospedagem estática. Por isso, para permitir que o próprio painel publique no GitHub, o painel usa a API do GitHub com um token fornecido pelo proprietário. Para uma versão futura ainda mais segura, podemos trocar isso por GitHub App/OAuth com backend dedicado.
