# Plano de checkout Mercado Pago — Amora Fut

**Status:** planejamento; nenhuma cobrança real habilitada.  
**Produção:** não publicar nem alterar o endereço oficial até aprovação expressa.  
**Ambiente observado no repositório:** `js/supabase-config.js` declara explicitamente que aponta para ambiente de TESTE. Confirmar o projeto correto antes de qualquer integração de produção.

## Fluxo pretendido
1. Cliente confere carrinho, tamanhos, quantidades, dados de contato e CEP/frete.
2. O site envia somente os dados necessários do pedido para uma função segura no servidor.
3. A função calcula/valida preços, descontos configurados no painel, frete e total a partir de dados confiáveis; não aceitar total calculado apenas no navegador.
4. A função cria uma preferência de pagamento do Mercado Pago para Pix e cartão de crédito e devolve apenas os dados públicos necessários ao checkout.
5. Webhook do Mercado Pago valida a notificação no servidor e consulta o pagamento à API antes de mudar o status do pedido.
6. Registrar pedido e referência do pagamento no Supabase com proteção contra duplicidade e reenvio de notificações.
7. Só marcar como pago após confirmação verificada; nunca confiar em captura de tela ou redirecionamento do navegador.
8. Atualizar estoque de modo idempotente, com regras para pagamento pendente, recusado, cancelado e expirado.
9. Exibir confirmação clara ao cliente e registrar no painel administrativo o status, método, valores e identificador do pagamento.

## Segurança e operação
- Nunca colocar access token/segredo do Mercado Pago em HTML, JavaScript público, GitHub ou mensagens de chat.
- Guardar segredo somente em variáveis de ambiente/segredos de função server-side.
- Usar credenciais de teste e compradores/cartões de teste primeiro; não fazer compras reais durante validação.
- Verificar assinatura/autenticidade das notificações conforme a documentação atual do Mercado Pago e consultar a API para confirmar o estado.
- Não registrar dados completos de cartão; deixar a captura de cartão nos componentes oficiais do Mercado Pago.
- Aplicar RLS e validação de permissões no Supabase; testar falhas e pedidos duplicados.
- Confirmar como será calculado o frete e quando o estoque será reservado/baixado.
- Confirmar o projeto Supabase de produção: a configuração pública atual diz que é ambiente de teste.

## Testes obrigatórios antes de liberar
- Pix criado, pendente, pago, expirado e cancelado.
- Cartão aprovado, recusado e em análise.
- Webhook duplicado, inválido ou atrasado.
- Alteração de preço/estoque entre carrinho e pagamento.
- Descontos configurados no painel sem desconto sobre o frete, se essa continuar sendo a regra.
- CEP/frete, múltiplos itens, quantidades, atualização do carrinho em celular e computador.
- Pedido aparece corretamente no painel; status de pagamento não pode ser alterado pelo cliente.
- Conferir que o site oficial e o domínio não mudaram.

## Decisões necessárias antes da implementação
- Confirmar o projeto Supabase de produção e se ele já possui tabela de pedidos e itens.
- Definir o comportamento do estoque enquanto o Pix está pendente e quando o pagamento falha.
- Confirmar se o checkout será hospedado pelo Mercado Pago ou integrado com componentes oficiais (Pix + cartão).
- Configurar endpoint seguro e URL de webhook.
- Revisar taxas, prazos e disponibilidade de Pix/cartão na conta Mercado Pago.
