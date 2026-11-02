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
- Seleções terá uma categoria própria.
- Subcategorias representam os clubes. Os nomes exibidos serão em português quando houver uma forma usual em português; o título original do álbum será preservado internamente.
- Álbuns sem classificação segura ficam em **Outros Clubes**.
- Coleções como **Camisas retrô**, **Camisas atuais**, **Treino** e **Jaquetas e agasalhos** serão etiquetas secundárias, não campeonatos.
- Exemplo: um álbum retrô do Flamengo fica em **Brasileirão → Flamengo**, com a etiqueta **Camisas retrô**. Assim ele não é confundido com uma camisa atual nem duplicado em outra categoria.
- A lista inicial de campeonatos, clubes, aliases e coleções está em `categories.json`. Ela poderá crescer conforme o fornecedor for analisado.

## Etapa atual
Estrutura de classificação preparada. A importação real ainda depende de validar a leitura de álbuns individuais e configurar backend/Worker e Supabase exclusivos. Nenhuma configuração da loja principal foi alterada.
