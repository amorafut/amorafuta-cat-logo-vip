# Ambiente independente — Dropshipping Yupoo

Este diretório é um módulo isolado da AmoraFut, desenvolvido na branch `dropshipping-yupoo-lab`.

## Regras de isolamento
- Não importar scripts, estilos, carrinho, autenticação ou configuração Supabase da loja principal.
- Não reutilizar tabelas, buckets, credenciais ou pedidos da AmoraFut.
- Usar projeto Supabase separado para o catálogo de teste, quando criado.
- Não implementar preço, margem, lucro, checkout ou pagamento online.
- Fluxo futuro: categoria principal → clube → álbum/produto → galeria → tamanho → quantidade → carrinho próprio → nome/e-mail → WhatsApp.
- Identificar cada álbum pela URL/ID original para sincronizar sem duplicar.

## Organização do catálogo
- Categorias principais por campeonato: Premier League, Brasileirão, Bundesliga, La Liga, Serie A, Ligue 1 e Primeira Liga.
- Seleções terá categoria própria; outras ligas e modalidades poderão ser adicionadas à medida que forem necessárias.
- Subcategorias representam os clubes. Os nomes exibidos serão em português quando houver forma usual em português; o título original será preservado internamente.
- Álbuns sem classificação segura ficam em **Outros Clubes**.
- Coleções como **Camisas atuais**, **Camisas retrô**, **Treino** e **Jaquetas e agasalhos** serão etiquetas secundárias, não campeonatos.
- Exemplo: um álbum retrô do Flamengo fica em **Brasileirão → Flamengo**, com etiqueta **Camisas retrô**. Não será duplicado em outra categoria.
- A lista de campeonatos, clubes, aliases e coleções está em `categories.json`.

## Validação inicial de álbum
Foi inspecionado o álbum público `https://www.yupoo.store/albums/1131805`:
- ID de origem: `1131805`.
- Título original: `2025/26 Player Version Flamengo Home Jersey`.
- Categoria informada pelo fornecedor: `Flamengo`.
- Tamanhos de origem: S, M, L, XL, XXL; apresentação planejada: P, M, G, GG, XGG.
- Galeria: 11 imagens identificadas pelos códigos `1131805-0` a `1131805-10`.
- Classificação: **Brasileirão → Flamengo → Camisas atuais**.
- Exemplo estruturado em `fixtures/flamengo-album-1131805.json`.

Esta validação confirma que a página pública expõe título, categoria, tamanhos e referências de imagens. Ainda não confirma que os endereços diretos das imagens possam ser baixados pelo Worker, nem estoque ou disponibilidade comercial. Não tratar o álbum de exemplo como produto publicado/disponível até a próxima etapa de teste técnico.

## Etapa atual
A estrutura de classificação e um exemplo real de metadados foram preparados. A importação automática em massa ainda depende de testar o Worker com o HTML efetivamente recebido, validar URLs de imagem e configurar backend/Worker e Supabase exclusivos. Nenhuma configuração da loja principal foi alterada.
