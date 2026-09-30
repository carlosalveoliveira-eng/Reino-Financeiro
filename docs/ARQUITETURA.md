# Reino Financeiro — arquitetura e plano de implementação

> Atualização vigente: leia também ATUALIZACOES_V2.md. As descrições abaixo registram a fundação inicial; a versão 2 adiciona jornada persistente, importação, operações de carteira, recorrências confirmáveis e PWA com rascunhos offline cifrados. Provedores externos continuam pendentes.

## 1. Produto
Gestão financeira pessoal para entender saldo, obrigações futuras, metas e patrimônio. A metáfora de reino acompanha organização real; não atribui valor moral a patrimônio ou renda. Os dois documentos de requisitos fornecidos são a especificação de longo prazo. Esta entrega implementa a fundação web, não todas as integrações ou o aplicativo nativo.

## 2. Arquitetura e tecnologias
Interface React + TypeScript, convenções Next.js, runtime Vinext compatível com Workers, Tailwind, shadcn, Recharts, Zod e Drizzle. UI → API → serviços → domínio/repositórios → armazenamento. O domínio não importa React nem banco. Para esta versão disponível online, autenticação é fornecida pela plataforma ChatGPT e os dados ficam no D1 por usuário. **Não foi configurado Supabase/PostgreSQL ou Vercel:** sem projeto e credenciais fornecidos, a primeira entrega usa os serviços de hospedagem disponíveis. A migração para a stack preferida é uma etapa explícita, não uma integração simulada.

## 3. Pastas
- app/: interface, página protegida, API.
- domain/: dinheiro, saldos, parcelas, patrimônio, metas, projeções e insights determinísticos.
- services/: comandos de aplicação e demonstração.
- repositories/: leitura por proprietário, commit atômico, idempotência e concorrência.
- validations/: contratos Zod e limites.
- db/ + drizzle/: definição e migrações versionadas.
- tests/: cálculos e integração do runtime.
- docs/: arquitetura, decisões, limites e roadmap.

## 4. Banco implementado
financial_records: id, user_id, type, data JSON validado, created_at. Índice user_id,type.
operations: id, user_id, key, digest, revision, created_at. Chave única user_id,key.
user_versions: user_id, revision. Controle otimista de concorrência por usuário.
audit_events: id, user_id, event, created_at. Sem valores financeiros, tokens ou conteúdos.

O armazenamento de entidades em JSON é uma escolha de fundação de uso pessoal com contrato de aplicação, não o modelo normalizado final pedido na especificação. Referências são validadas no serviço e exclusões de contas/cartões referenciados são bloqueadas. Limitação: sem FKs entre entidades JSON. Antes de lançamento comercial, substituir por tabelas normalizadas com constraints e relações compostas (owner_id,id).

## 5. Modelo normalizado alvo e relações
profiles 1:N financial_accounts, transactions, credit_cards, budgets, goals, debts, investment_accounts.
financial_accounts 1:N ledger_entries; transfers relacionam duas contas e duas pernas de um journal atomizado.
categories 1:N transactions, budget_categories; subcategories N:1 categories.
transactions 1:N transaction_categories (splits), tags via transaction_tags.
recurring_transactions 1:N recurring_occurrences, UNIQUE(rule_id,occurrence_date).
credit_cards 1:N credit_card_invoices 1:N credit_card_transactions/ installments.
budgets 1:N budget_categories, UNIQUE(owner_id,month,category_id).
goals 1:N goal_contributions, que reservam dinheiro sem duplicar patrimônio.
debts 1:N debt_payments; separar principal, juros e tarifas.
investment_accounts 1:N investment_transactions; investment_assets 1:N transactions e asset_prices; investment_positions materializadas/reconciliáveis.
investment_income vinculado a asset/account; preços com source, currency, timestamp.
net_worth_snapshots UNIQUE(owner_id,date), financial_events/outbox, notifications.
gamification_profiles 1:N gamification_events; achievements e user_achievements; streaks derivados de eventos deduplicados.
financial_insights com entradas, período, versão da regra, explicação. audit_logs sem secrets.
bank_connections 1:N imported_accounts, imported_transactions; tokens cifrados fora da interface.

## 6. Regras financeiras implementadas
- BRL em centavos inteiros seguros. Parsing decimal textual, sem float para somar dinheiro. Conversão para números decimais apenas na apresentação.
- Saldo = saldo inicial + receitas confirmadas − saídas confirmadas + transferências recebidas. Transferência não entra como receita/despesa.
- Transações futuras são previstas. Confirmação é explícita; registro previsto não altera saldo.
- Compra de cartão gera parcelas cujo total preserva o valor exato. Centavos restantes nas primeiras parcelas. Compra na data de fechamento entra no ciclo seguinte; vencimento anterior/igual ao fechamento passa para mês seguinte. Regras simplificadas, dias 1–28, sem calendário bancário.
- Pagamento de cartão reduz conta e obrigação; não conta novamente como despesa. Pagamentos alocados às parcelas mais antigas. Não permite pagar mais que o saldo devedor.
- Orçamento e despesa por mês usam despesas confirmadas e parcelas do mês. Caixa e competência são distintos e identificados.
- Dívida reduzida e débito da conta são gravados atomicamente. Nesta versão todo pagamento de dívida entra como despesa de caixa, sem decomposição de juros/principal.
- Metas são reservas declaradas de dinheiro já existente, não ativos adicionais. Aportes não movem saldos e não são investimentos.
- Investimentos são posições e avaliações manuais. Não há ordens, preços automáticos, dividendos, TWR/XIRR ou tributação.
- Patrimônio = contas + avaliações de investimentos − dívidas − saldo total de cartão, incluindo parcelas futuras.
- Forecast usa saldo confirmado, previstos, recorrências mensais e faturas em aberto. Transferências internas não mudam saldo consolidado. Faturas vencidas em aberto entram hoje. Não há promessa de rendimento.
- Recorrências são compromissos de projeção; não geram automaticamente transações reais. Deduplicação simples por nome, conta, valor, tipo e data evita duplicar um registro correspondente. Limite conhecido: sem vinculação por occurrence_id nesta fase.
- Domínio de 1 moeda. Multi-moeda exige Money(currency), snapshots cambiais e rejeição de operações incompatíveis.

## 7. API e contratos
GET /api/finance: snapshot do usuário autenticado.
POST /api/finance: create/delete/contribute/pay_debt/settle/demo/clear, todos com key UUID. Serviço valida relações, ownership, valores, datas e condições. Idempotência por owner+key com hash do comando e replay antes de aplicar regras. Batch D1 atômico; revisão otimista aborta snapshots concorrentes. Não há endpoints que recebam owner_id do cliente.
API futura versionada /api/v1/accounts, transactions, transfers, invoices, goals, investments, forecasting, import, exports e connections, compartilhada com mobile.

## 8. Integrações
Open Finance via provedor oficial com consentimento; sem capturar senhas bancárias. MarketDataProvider, FXProvider, NotificationProvider e AIAssistantTools planejados, sem implementações falsas ou botões simulando conexão. Necessitam escolhas de serviço, contratos, credenciais e testes reais.

## 9. Segurança
Aplicação privada, login ChatGPT obrigatório, identidade apenas dos headers confiáveis fornecidos pelo dispatcher. APIs rejeitam ausência de identidade e escrita de origem divergente. Queries preparadas, filtro por owner em todas as leituras/escritas, parsing Zod, limites de tamanho/valor, exclusões confirmadas na interface. Logs de aplicação não exibem dados financeiros ou secrets. Exportação é gerada a pedido do usuário. Apagar registros mantém histórico técnico de idempotência e auditoria, claramente informado; não equivale a exclusão da conta ChatGPT.
Antes do uso comercial: autorização multiusuário formal, limites distribuídos de requisições, backup e recuperação exercitados, revisão independente, retenção/eliminação integral, suporte a incidentes, política de privacidade e validação jurídica apropriada. RLS será obrigatória no adaptador Supabase e nunca substituída pela interface.

## 10. Testes
Cálculos com centavos, parsing, transferência, confirmação, parcelas não divisíveis, metas, forecast, pagamento sem dupla despesa, datas em fim de mês. Integração com banco emulado: identidade obrigatória, isolamento A/B, comandos validados, replay idempotente, orçamento único, pagamento de dívida, rollback e conflito de revisão. TypeScript e build Worker. Browser E2E/Playwright ficam pendentes se não há infraestrutura compatível neste ambiente; não declarar que passaram.

## 11. Gamificação
5 XP por registro confirmado, 20 por meta criada, 100 por meta concluída. Nível a cada 100 XP. É organização, não avaliação de crédito. Progresso derivado dos dados atuais (exclusão remove progresso), sem punições, comparações entre usuários, ranking ou incentivo a tomar risco. Reino ilustrado é arte estática original; sprites animados e evolução visual por construções não foram implementados. Nenhum prêmio aparece como se existisse sem evento.

## 12. UX
Workspace abre na visão financeira. Sidebar responsiva, estados vazio/carregando/erro, cadastro via dialog, exclusão via confirmação acessível, status previsto explícito, formulários preservados quando salvar falha, exportação e apagamento. Tema escuro de floresta com ouro discreto, tipografia serifada nos títulos, componentes financeiros legíveis. Redução de movimento suportada. Demonstrativo fictício opcional, nunca dados pessoais inventados.

## 13. Ciência de dados
Taxa de poupança calculada com receita de período; orçamento por categoria; patrimônio e projeção determinística. Sem ML ou evidência pseudocientífica. Próximo passo: séries temporais com cobertura/qualidade de entrada, comparação de meses completos e detecção explicável de anomalias. Registrar método e dados de cada insight.

## 14. IA
Nesta entrega, insights são regras determinísticas; não há LLM conectado. Assistente futuro consulta tools de serviços autenticados, nunca SQL livre ou acesso direto ao banco. Permissões mínimas, evidência dos números, confirmação de operações financeiras, proteção contra instruções em descrições importadas. Nenhuma recomendação de investimentos ou promessa de lucro.

## 15. Forecast
Projeção baseada nos dados atuais, horizonte 7/30/90/180/365 dias. Não prevê despesas variáveis não registradas. Calendário de recorrência mantém dia âncora e ajusta último dia do mês. Próxima fase: cenários, intervalos, contas individuais, contribuições de metas programadas e taxas. Pagamentos previstos de cartão são substituídos pela projeção de faturas para não descontar duas vezes; limite explícito da versão.

## 16. Android/iPhone
Domínio extraído para pacote comum TypeScript; repositórios trocáveis; HTTP API autenticada. Futuro cliente React Native ou Capacitor conforme necessidades, com armazenamento seguro Keychain/Keystore, biometria como proteção do token local e sessões revogáveis. Não reutilizar headers do ambiente web como protocolo de login mobile. Não há app nativo, sincronização offline ou PWA instalável nesta fase.

## 17. Roadmap
Fase 1 (esta entrega): núcleo de uso pessoal, contas, transações, transferências, cartão e parcelas, orçamentos, metas, dívidas/pagamentos, posições manuais, recorrência de planejamento, projeções, relatórios, insights, XP, exportação e apagamento.
Fase 2: Supabase/PostgreSQL normalizado, Auth, RLS e teste de isolamento; ledger auditável, histórico de alterações, edição completa com histórico, import CSV/OFX com preview e deduplicação, recorrências vinculadas e materializadas, ledger de investimentos e retorno real.
Fase 3: PWA/offline com conflitos/idempotência, notificações, sprites e eventos visuais, acessibilidade e E2E completos.
Fase 4: Open Finance/cotações com consentimento, assinatura de webhooks, filas, retry, revogação, criptografia e observabilidade.
Fase 5: assistente IA por tools, mobile, planos comerciais após validação com usuários.

## 18. Riscos técnicos
JSON não normalizado, limites de snapshot e ausência de paginação acima de 100 registros exibidos; todas as linhas ainda carregadas e exportadas. Calendário simplificado de cartões, reconciliação bancária ausente, registros de investimento manuais, dias específicos de banco não modelados. Concorrência otimista deve ser mantida ao migrar backend. Não chamar esta versão de contabilidade bancária ou de plataforma pronta para operação financeira.

## 19. Riscos de produto
Entrada manual depende de adesão; fantasia pode distrair alguns usuários; métricas dependem da completude dos registros; XP por criação pode ser explorado e não deve conceder benefícios econômicos. Começar com usuários de teste e medir tempo para primeiro registro, frequência de revisão e compreensão de saldos, antes de expandir.

## 20. Decisões e próximos requisitos
A entrega estabelece um produto usável e uma fundação revisável, com limites visíveis. Não foram necessários segredos de usuário para o primeiro deploy privado. Para continuar no stack preferido, fornecer projeto Supabase por canal seguro e definir o destino Vercel. Integrações e lançamento comercial devem ser aceitos por evidência e testes, não por existência de telas.

## Validação executada
TypeScript e build Worker passaram. Testes de domínio e integração exercitados no runtime local Miniflare com migrações reais. QA visual em navegador e validação WebMCP não estão disponíveis neste ambiente; WebMCP é opcional e não é necessário para usar o app. Arte do reino estática, gerada e inspecionada.

Resultado final: 10 testes de domínio e 28 verificações de integração passaram, além do TypeScript e build. Testes incluem replays de aportes e pagamentos, edição preservando ID, referências de pagamentos protegidas, datas futuras e rollback por revisão obsoleta.
