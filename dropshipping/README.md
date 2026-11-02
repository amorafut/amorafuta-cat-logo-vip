# Ambiente independente — Dropshipping Yupoo

Este diretório é um módulo isolado da AmoraFut, desenvolvido na branch `dropshipping-yupoo-lab`.

## Regras de isolamento
- Não importar scripts, estilos, carrinho, autenticação ou configuração Supabase da loja principal.
- Não reutilizar tabelas, buckets, credenciais ou pedidos da AmoraFut.
- Usar projeto Supabase separado para o catálogo de teste, quando criado.
- Não implementar preço, margem, lucro, checkout ou pagamento online.
- O fluxo futuro é: categoria principal (campeonato) → subcategoria (clube) → álbum/produto → galeria de fotos → tamanho → quantidade → carrinho próprio → nome/e-mail → WhatsApp.
- A sincronização deve identificar cada álbum por seu identificador/URL de origem e atualizar apenas os registros deste módulo.

## Organização do catálogo
- As categorias principais serão os campeonatos: Premier League, Brasileirão, Bundesliga, La Liga, Serie A, Ligue 1 e Primeira Liga.
- Seleções terá uma categoria própria.
- Cada clube encontrado será uma subcategoria dentro do campeonato correspondente.
- Álbuns sem classificação confiável irão para **Outros Clubes**.
- A lista inicial está em `categories.json` e poderá crescer conforme os campeonatos e clubes forem encontrados no fornecedor.
- Exemplo: Flamengo → Brasileirão → Flamengo.
- Não duplicar álbuns durante a importação; usar o identificador ou URL original do álbum.

## Etapa atual
Estrutura inicial de teste. A importação real depende de validar a leitura dos álbuns Yupoo e configurar um backend/Worker e um projeto Supabase exclusivos. Nenhuma configuração de produção foi alterada.
