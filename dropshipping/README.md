# Ambiente independente — Dropshipping Yupoo

Este diretório é um módulo isolado da AmoraFut, desenvolvido na branch `dropshipping-yupoo-lab`.

## Regras de isolamento
- Não importar scripts, estilos, carrinho, autenticação ou configuração Supabase da loja principal.
- Não reutilizar tabelas, buckets, credenciais ou pedidos da AmoraFut.
- Usar projeto Supabase separado para o catálogo de teste, quando criado.
- Não implementar preço, margem, lucro, checkout ou pagamento online.
- O fluxo futuro é: categoria → álbum/produto → galeria de fotos → tamanho → quantidade → carrinho próprio → nome/e-mail → WhatsApp.
- A sincronização deve identificar cada álbum por seu identificador/URL de origem e atualizar apenas os registros deste módulo.

## Etapa atual
Estrutura inicial de teste. A importação real depende de validar a leitura dos álbuns Yupoo e configurar um backend/Worker e um projeto Supabase exclusivos. Nenhuma configuração de produção foi alterada.
