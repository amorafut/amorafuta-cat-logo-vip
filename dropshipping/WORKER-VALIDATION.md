# Validação segura do importador Yupoo

Este documento define os critérios obrigatórios antes de transformar o diagnóstico HTML em importador de catálogo.

## Estado atual

- O Worker de diagnóstico é experimental e somente leitura.
- Ele não grava produtos, imagens ou pedidos.
- Nenhuma sincronização de estoque foi comprovada.
- O catálogo principal da AmoraFut não participa deste fluxo.

## Regras de segurança de rede

1. Aceitar somente URLs HTTPS cujo host seja exatamente `yupoo.store` ou um subdomínio terminado em `.yupoo.store`.
2. Não confiar apenas na URL inicial: validar novamente cada destino de redirecionamento antes de fazer outra requisição.
3. Não seguir redirecionamentos automaticamente. Processar cada resposta 3xx manualmente, com limite máximo de quatro saltos.
4. Rejeitar destinos com usuário/senha embutidos, portas não padrão, protocolos diferentes de HTTPS ou hosts fora da allowlist.
5. Não permitir que o usuário envie URLs arbitrárias para o Worker.
6. Limitar tamanho do HTML recebido, tempo de execução, quantidade de links e quantidade de imagens analisadas.
7. Aceitar somente respostas HTML para a etapa de leitura de páginas. Não baixar arquivos arbitrários.
8. Não registrar tokens, cookies, cabeçalhos de autenticação ou dados pessoais nos logs.

## Regras de extração

- Ler título, identificador do álbum, URL canônica, imagens e opções de tamanho quando estiverem explicitamente presentes.
- Considerar atributos comuns de carregamento tardio: `src`, `data-src`, `data-original`, `data-lazy-src`, `data-zoom-image` e `srcset`.
- Normalizar tamanhos apenas para exibição. Preservar também o texto original encontrado.
- Não interpretar texto promocional, contagem de fotos ou presença de imagens como confirmação de estoque.
- Marcar campos ausentes como pendentes; nunca inventar preço, tamanho, disponibilidade ou quantidade.

## Revisão humana antes de importar

Cada álbum deve passar por uma prévia com:
- título original e título em português;
- categoria, clube e coleção sugeridos;
- imagens e tamanhos encontrados;
- campos não confirmados claramente sinalizados.

Só depois da aprovação deve ser criado um registro no banco exclusivo do Dropshipping.

## Persistência e isolamento

- Usar projeto Supabase próprio para o Dropshipping.
- Não reutilizar tabelas, chaves, buckets, credenciais ou políticas RLS da AmoraFut.
- Não conectar o Worker ao banco até que a leitura e a prévia estejam validadas.
- Manter o fluxo de pedidos e o carrinho independentes da loja principal.

## Critérios mínimos de teste

- URL Yupoo válida sem redirecionamento.
- Redirecionamento para outro host deve ser bloqueado.
- Cadeia com mais de quatro redirecionamentos deve ser bloqueada.
- HTML acima do limite deve ser rejeitado.
- Página sem imagens deve retornar prévia sem imagens, sem falhar.
- Tamanho não encontrado deve permanecer como não confirmado.
- Nenhum teste pode criar ou alterar dados da loja AmoraFut.

## Critério para avançar

O importador só poderá ser considerado pronto após passar nos testes acima, validar as URLs reais das imagens de um álbum piloto e demonstrar que a gravação ocorre exclusivamente no banco separado do Dropshipping.
