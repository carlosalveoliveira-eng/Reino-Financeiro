# Auditoria e tarefas — 30/09/2026

Inspeção realizada antes das alterações em domínio, serviço, validação, jornada, formulários e documentação. Base recebida sem `.git`; sem acesso ou alteração ao banco hospedado.

| Tarefa | Evidência original | Correção planejada |
| --- | --- | --- |
| A1 · Fatura fechada | `workspace.tsx` exibe apenas closingDate/deadline | Estado derivado, fuso Cuiabá, atualização ao retomar e virar o dia; nenhum pagamento implícito |
| A2 · Fim de recorrência | Entity/schema/forecast/confirm_recurring não têm término | endDate opcional inclusiva; validar, editar e limitar projeção e confirmação |
| A3 · Missão incorreta | first_debt_payment aceita qualquer transaction.parentId, incluindo investimento | Exigir pagamento de dívida; preservar recompensas históricas |
| A4 · Duplicata inconsistente | confirmação recorrente ignora kind, projeção considera kind | Alinhar critério de ocorrência correspondente |
| A5 · Demonstração mistura armazenamento | comando demo grava exemplos na base autenticada vazia | Rota pública sem API, banco ou identidade; substituir convite de carga por link |
| A6 · Manutenção da interface | workspace concentra gráfico, cartões, tabelas e formulários | Extrair componentes e conversão de formulário com contratos explícitos |
| A7 · Publicação | README mínimo, sem CI ou capturas | Documentar execução, regras, limitações, privacidade e gerar capturas da demo |
| A8 · Datas do demonstrativo | demoRecords marca datas futuras como posted | Classificar datas futuras como previstas |

Revisão dos cálculos: saldo confirmado, parcelas em centavos, pagamentos sem despesa duplicada, reservas sem aumento patrimonial e alocação cronológica já têm testes; ampliar regressões nos pontos alterados. Não reescrever migrações nem registros. Autenticação Google e ampliação multiusuário fora do escopo.

Resultados e tarefas concluídas serão registrados em `VALIDACAO.md`.

## Achados durante as verificações

| Tarefa | Evidência | Correção |
| --- | --- | --- |
| A9 · Acessibilidade | axe identificou barras sem nome e contraste 4,44:1 nas conquistas bloqueadas | Rótulos contextualizados, contraste maior, foco e verificação das seções |
| A10 · Sinal das movimentações | tabela testava apenas kind=income, exibindo vendas/rendimentos/ajustes positivos com sinal negativo | Mesmo critério de entrada de caixa usado pelo saldo; regressão de domínio |
| A11 · Referência órfã | exclusão de recurring não verificava transações com recurringId | Bloquear exclusão da regra confirmada; encerrar por data final sem remover histórico |
| A12 · Execução reproduzível | lint examinava build estático; integração dependia do dia real | Ignorar artefatos gerados, corrigir erros de tipos/lint e fixar relógio somente no worker de teste |
| A13 · Rotas estáticas | hosts de diretórios podem redirecionar `/demo` para `/demo/` | Reconhecer barra final e index.html; teste das seis rotas compiladas |

## Tarefas executadas

- [x] A1: estado derivado e atualização à meia-noite/foco, sem operações financeiras.
- [x] A2: término opcional no contrato, serviço, projeção, formulário e lista.
- [x] A3: regra correta de dívida, sem revogar recompensas anteriores.
- [x] A4: nome/conta/valor/tipo/data coerentes na conferência e confirmação.
- [x] A5: demo pública isolada, convite sem inserir exemplos no banco pessoal.
- [x] A6: componentes de cartões, recorrências, calendário, gráfico e estado vazio; conversão de formulário separada.
- [x] A7: README, segurança, contribuição, decisões, publicação, CI e capturas reais.
- [x] A8: exemplos futuros permanecem previstos, sem antecipar saldo.
- [x] A9: barras e contraste corrigidos, verificações axe e responsivas.
- [x] A10: sinais visuais de entradas alinhados ao cálculo.
- [x] A11: histórico de recorrências protegido contra exclusão da regra.
- [x] A12: verificações reproduzíveis e sem dados reais.
- [x] A13: demonstração funciona com rotas de diretório em hospedagem estática.

Integrações externas e publicação estão descritas separadamente em `PUBLICACAO.md`; não foram simuladas como concluídas.
