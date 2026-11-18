# Migração controlada — Amora Fut TESTE

## Escopo e proteção
- Migrar somente o projeto Supabase `amora-fut-teste` (URL observada no código: `https://fdkvghcxfjqtiwwfjkjz.supabase.co`).
- O projeto principal `amora-fut` está fora do escopo.
- Não excluir, limpar, substituir nem alterar dados no Supabase de origem.
- Não trocar o site público nem mesclar esta branch antes de backup, migração e testes completos.
- Esta documentação é inventário inicial do código versionado; ainda NÃO é backup do banco ou dos objetos.

## Inventário confirmado no repositório

### Banco / dados
O painel e o catálogo usam a tabela `public.amora_products`.
Campos encontrados no código/SQL:
- `id` (texto, chave primária), `name`, `team`, `category`, `version`
- `price`, `wholesale_price`, `old_price`
- `badge`, `description`, `published`, `sold_out`
- `stock` (JSON), `images` (JSON), `sort_order`
- `created_at`, `updated_at`

O painel também consulta `public.amora_admin_users`, com `user_id` UUID ligado a `auth.users(id)`. O login atual usa Supabase Auth (e-mail/senha) e só libera o painel após conferir o usuário nessa tabela.

### Divergência que precisa ser resolvida antes do dump
- `js/supabase-config.js` na branch `main` aponta para `fdkvghcxfjqtiwwfjkjz.supabase.co` (projeto de teste).
- `supabase-amora-schema.sql` contém comentário orientando executar o SQL em `clvhacmmmnltnzlkfcwd` (outro projeto, o principal).
- Portanto, NÃO assumir que esse SQL descreve exatamente o banco atual de `amora-fut-teste`. Confirmar o schema real no backup/dump do projeto de teste antes de recriar tabelas ou políticas.

### Imagens
- Bucket de origem configurado no código: `amora-product-images`.
- As URLs das imagens são armazenadas no array JSON `images` em `amora_products`.
- O catálogo lê essas URLs diretamente.
- O projeto de teste foi reportado anteriormente com aproximadamente 843 objetos e cerca de 2.45 GiB; isso é referência histórica, precisa ser recontado no momento da migração.
- O Worker R2 `amora-fut-imagens` e bucket `amora-fut-imagens` já foram criados e a rota de leitura foi testada. Upload/autorização ainda não foram comprovados.
- O PR #10 é uma preparação de upload de imagens; permanece draft e não deve ser mesclado como parte desta migração sem testes.

### Frete — item obrigatório a preservar
A integração de frete atual é independente do Supabase:
- Worker existente: `amora-fut-frete`, código `cloudflare/amora-fut-frete.js`.
- O token é um secret do Worker chamado `SUPERFRETE_TOKEN`; nunca copiar para código público, GitHub ou banco.
- Endpoint atualmente usado pelo carrinho: `https://amora-fut-frete.amorafut.workers.dev/`.
- O carrinho envia `POST` JSON com `cep` e `quantidade`.
- O Worker consulta a API da SuperFrete e calcula pacote usando 240 g por camisa + 20 g de embalagem; dimensões 30 x 21 cm e altura 4 cm por camisa.
- CEP de origem no código: `60347540`; serviços consultados: `1,2,17`.
- O carrinho guarda CEP localmente, apresenta opções de frete, soma o frete ao total e inclui serviço, CEP, subtotal e total na mensagem de WhatsApp.
- **Não alterar, renomear ou substituir o Worker de frete, o endpoint, o secret, a fórmula de embalagem ou o fluxo de checkout nesta migração.**
- Após qualquer mudança de banco/imagens, testar novamente cotação no desktop e celular, seleção de serviço, persistência do CEP, total e mensagem de WhatsApp.

## Arquitetura de destino proposta
1. R2 para objetos de imagem.
2. Cloudflare Workers para API do catálogo/admin e lógica de aplicação.
3. PostgreSQL compatível mantido como PostgreSQL, acessado por Worker via Hyperdrive (evitar conversão para D1 na primeira migração, para reduzir alterações no schema/JSON e consultas).
4. Autenticação: decidir e implementar antes de migrar usuários. Não presumir que exportar tabelas replica hashes/sessões do Supabase Auth. Planejar migração ou redefinição segura de senha, mantendo a lista de administradores autorizados.
5. Worker de frete permanece como serviço separado e continua recebendo cotação do carrinho; a API nova não deve interceptar nem alterar esse fluxo.

## Sequência segura
1. Confirmar acesso/exportação do projeto de teste, mesmo com o aviso de quota excedida.
2. Fazer backup lógico PostgreSQL do projeto TESTE e inventário de usuários/roles/policies; validar tamanho e integridade do arquivo.
3. Inventariar e copiar separadamente todos os objetos do bucket `amora-product-images`; gerar relatório de contagem, bytes, chaves e falhas.
4. Criar banco de destino e restaurar schema/dados; comparar contagens e amostras.
5. Migrar objetos para R2 e atualizar somente as URLs no banco de destino, sem apagar origem.
6. Implementar API/admin e estratégia de autenticação no ambiente de teste.
7. Testar catálogo, login, CRUD de produto, estoque, vendas, imagens e frete.
8. Só depois de aprovação explícita considerar troca de ambiente; manter Supabase TESTE intacto por período de segurança.

## Bloqueios atuais
- A organização Supabase mostrou “Services restricted” por quota excedida. Ainda não foi possível confirmar acesso ao Table Editor nem realizar exportação do banco.
- Sem um dump verificável, não iniciar restauração nem afirmar que existe backup.
- Sem inventário dos objetos e cópia validada, não alterar URLs nem remover arquivos.
- Não foi encontrada conexão direta ao painel Cloudflare/Supabase nesta sessão; alterações de código podem ser preparadas no GitHub, mas configuração de conta e exportação exigem acesso autorizado do usuário.

## Estado
- Inventário inicial do código concluído.
- Worker R2 responde em leitura; upload/autorização pendentes.
- Worker de frete identificado e explicitamente protegido contra alterações.
- Nenhuma alteração de produção, banco ou imagem foi feita por este documento.
