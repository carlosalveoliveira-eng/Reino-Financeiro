# Atualização 2 — progresso, energia e ferramentas financeiras

## Implementado
- Tema mais vivo com esmeralda, ciano e ouro, leitura maior, microinterações e controles de energia/sons. Sons desligados por padrão; prefers-reduced-motion tem prioridade.
- Cinco personagens originais com poses contextuais e movimentos curtos. Atlas de 5 personagens x 4 poses, com enquadramento ajustado às dimensões reais da arte. Não são ciclos completos de caminhada: não declarar animações que não existem.
- Três estágios do reino, definidos por marcos de organização e dias de cuidado, sem pontuar renda ou tamanho de investimentos.
- Missões diárias e conquistas persistentes em tabela journey_rewards com chave única por usuário e evento. XP de hábitos no máximo uma vez/dia; conquistas uma vez cada. Eventos são gravados no mesmo batch da ação financeira, não pelo cliente.
- Histórico de conquistas preservado em edições/exclusões pontuais, pois registra a ação histórica. Apagar todos os registros também remove a jornada.
- Revisão de orçamento e carteira mediante confirmação explícita do usuário; navegar para uma página não ganha XP. Comprar mais ativos não ganha mais pontos.
- Dias de organização, sequência flexível, plano semanal de reserva e histórico de aportes/retiradas de metas. Reservas são alocações de dinheiro existente, não novos ativos.
- Importação CSV/OFX com preview, seleção, alertas de possíveis duplicatas e hash de deduplicação por conta e identificador externo ou conteúdo. Rascunhos offline exportados têm ID estável para evitar reimportação.
- Recorrências mensais confirmáveis com ID da regra e data; duplas confirmações bloqueadas mesmo usando chaves de comando diferentes.
- Compras/vendas/rendimentos de investimentos vinculados ao saldo da conta e à posição. Quantidades decimais em bigint com escala 10^8, dinheiro em centavos. Custo remanescente pelo custo médio proporcional, sem apuração fiscal. Taxas explícitas. Posições com operações só alteram quantidade/custo pelas operações; a avaliação continua manual.
- Conferência/reconciliação do saldo com ajuste explícito, excluído da receita/despesa do período.
- Simulação de meta por contribuição mensal, agenda financeira por compromissos próximos e guia por regras locais, com explicação da origem dos números.
- PWA com manifest e ícones. Service Worker armazena apenas recursos estáticos; não armazena API, sessão, token, página autenticada ou snapshot financeiro.
- Caderno offline de rascunhos cifrados localmente com AES-GCM e chave derivada por PBKDF2 (SHA-256, 210.000 iterações). Senha e chave não persistem. Não usa credenciais bancárias. Sem a senha, os rascunhos são irrecuperáveis. CSV exportado é texto legível, informado na interface. Conferir e importar online antes de considerar os registros oficiais.
- Paginação das movimentações, chaves de idempotência preservadas em tentativas de formulário e fingerprints de importação preservados em edição.

## Pendências reais
A infraestrutura existente continua D1 + autenticação ChatGPT + Sites. Supabase/PostgreSQL e Vercel não foram conectados: faltam projeto, credenciais e destino definidos. Os registros financeiros continuam no contrato versionado em financial_records; não declarar normalização completa do produto.

Open Finance, preços automáticos, e-mail/push e IA generativa não estão configurados. Há portas de integração tipadas sem mocks. Dependem de provedor, acesso e credenciais; nenhuma tela simula um banco conectado ou dados de mercado ao vivo.

PWA não equivale a app publicado em Play Store/App Store. O caderno offline preserva rascunhos, não replica a base financeira nem sincroniza saldos automaticamente. A autenticação nativa, secure storage, biometria e sincronização com conflitos ainda são trabalho específico dos clientes móveis.

Sprites têm quatro poses e microanimações, sem caminhada ou interação física com construções. O reino avança em três estágios baseados em eventos reais. Não há recompensas financeiras, promessas de retorno ou alegações de alterações neuroquímicas.

## Preservação dos dados
As migrações 0000 e 0001 publicadas não foram modificadas. A atualização adiciona 0002 para journey_rewards. O primeiro acesso com registros legados sincroniza marcos existentes, uma única vez por chave de conquista; não cria movimentações financeiras.

## Validação
23 testes de domínio (10 financeiros e 13 de importação/jornada), 60 verificações de integração e 6 verificações do ciclo de criptografia offline passaram. TypeScript e build Worker também passaram. QA visual em navegador não foi executado: a habilidade exigida para o navegador de teste não está disponível neste ambiente. Não foi feito teste com bancos, cotações reais, IA externa ou lojas mobile, pois esses serviços não estão conectados.
