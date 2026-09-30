# Faturas variáveis e missões

Atualização aditiva: nenhum registro financeiro de produção é reescrito na publicação. Não há migrações novas nem alterações nas migrações aplicadas. Cartões antigos mantêm vencimento fixo e compras mantêm seu mês original.

Cartões aceitam dias 1–31, com ajuste ao último dia do mês. A regra opcional de vencimento no sétimo dia útil exclui sábado, domingo e feriados informados pelo usuário. Não existe calendário de feriados externo conectado. Datas reais por fatura prevalecem sobre a previsão. O mês da fatura corresponde ao mês do vencimento.

Datas de fechamento e vencimento são novos registros card_cycle por cartão/mês. Alterá-las não redistribui parcelas existentes. Novas compras podem informar o mês da primeira fatura. Mover parcela exige ação explícita e mantém valor, ID, demais parcelas e pagamentos; despesas mensais e alocação dos pagamentos por ordem cronológica acompanham o mês escolhido. O banco continua sendo a referência para processamento de compras no fechamento.

Missões são concedidas pelo serviço, independentemente da tela: compras e movimentações confirmadas criadas/atualizadas, confirmação de recorrência, importação, pagamento de dívida, criação/edição do orçamento atual, reserva inicial/aporte em meta e cadastro/avaliação de carteira. Operar investimentos não concede XP por volume. Chaves únicas por missão/dia evitam duplicação. Revisões explícitas continuam disponíveis. Abrir a carteira por si só não completa revisão.

Ao carregar, sync_journey recupera pontuação de ações registradas no dia local atual, usando created_at de registros existentes. Essa recuperação acrescenta somente recompensas; não altera registros financeiros. Não recria a história de atividade em dias anteriores. Demonstrações não ganham hábitos na recuperação.

Validação: TypeScript, build Worker, 25 testes de domínio e 75 verificações de integração passaram. Integração verifica todos os registros preexistentes iguais após configuração da fatura e mudança da regra do cartão, isolamento por usuário, movimento explícito de parcela, missões pelos formulários e recuperação sem alterações financeiras. QA no navegador não foi executada porque o skill control-browser não está disponível nesta sessão.

## Recorrências e XP
Cadastro/edição de recorrência também completa a missão diária de organização (5 XP, uma vez no dia). A primeira recorrência libera Rotina organizada (20 XP, uma vez). sync_journey reconhece essa conquista nos registros anteriores e recupera o hábito de recorrências criadas/atualizadas hoje, preservando os dados. Recorrência não é convertida automaticamente em movimentação confirmada. 26 testes de domínio e 78 verificações de integração passaram, incluindo recuperação sem modificar os registros.
