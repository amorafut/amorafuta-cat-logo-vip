# Validação final — Amora Fut

Esta versão está na branch `site-amora-novo-pronto`. Não publique nem mescle na branch principal antes de concluir os testes.

## 1. Banco Supabase
Projeto esperado: `clvhacmmmnltnzlkfcwd`.

No painel Supabase, abra **SQL Editor** e execute o arquivo `supabase-amora-schema.sql` somente depois de confirmar que este é o projeto correto. O script usa `create table if not exists`, recria políticas com nomes específicos e inclui uma migração idempotente para `wholesale_price`. Ainda assim, confira o resultado e os logs do SQL Editor antes de prosseguir.

**Não cole nem compartilhe a service_role/secret key.** A publishable key é a única chave prevista para o navegador.

## 2. Confirmar o usuário administrador
O usuário administrador precisa existir em Authentication e seu UUID precisa estar em `public.amora_admin_users`. Não adicione usuários por e-mail sem conferir o UUID exato no painel.

Consulta somente de leitura para conferir os administradores autorizados:
```sql
select a.user_id, u.email, a.created_at
from public.amora_admin_users a
left join auth.users u on u.id = a.user_id;
```

## 3. Testes reais obrigatórios
1. Abra o painel de administração e faça login.
2. Cadastre um produto de teste com preço de varejo e preço de atacado, estoque em pelo menos dois tamanhos e uma imagem.
3. Salve, atualize a página e confirme que os dados persistem.
4. Abra o catálogo em uma janela anônima: o produto publicado e sua imagem devem aparecer; produtos não publicados não devem aparecer.
5. Faça um pedido de teste com 4 peças: deve usar varejo. Adicione a 5ª peça, inclusive de outro modelo/tamanho: o preço de atacado deve valer para todas as peças que tenham preço de atacado configurado.
6. Remova itens e confirme que o total volta ao varejo quando a quantidade cair abaixo de 5.
7. Teste CEP e cálculo do frete, depois confira a mensagem gerada para WhatsApp. Não finalize pedido real durante o teste.
8. Repita no celular e no computador.

## 4. Limites desta validação
A sintaxe JavaScript e a lógica de preços foram verificadas por testes estáticos/simulações. A execução real de SQL, login, upload, frete e interface ainda precisa ser confirmada no ambiente conectado. O serviço Cloudflare Worker de frete existente não deve ser alterado nesta etapa.
