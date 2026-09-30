# Decisões da versão de portfólio

## Preservação

Não houve conexão com produção, migração, limpeza ou substituição de banco. O status da fatura é uma função pura, sem gravação. O campo JSON opcional de recorrência dispensa migração. IDs e referências existentes permanecem intactos; testes com snapshots verificam compras, pagamentos, registros e recompensas após alterações.

## Calendário de faturas

`domain/invoices.ts` separa fechamento de pagamento. Antes da data: Aberta; no próprio dia: Fecha hoje; depois: Fechada. Saldo pendente é apresentado separadamente nas parcelas.

Datas reais de `card_cycle` têm prioridade. Sem data real, estima-se fechamento antes do vencimento, ajustando ao último dia do mês. A estimativa aparece identificada. O mês selecionado é o de vencimento. O hook atualiza à meia-noite de Cuiabá, ao retomar foco e ao mudar visibilidade. Não precisa de cron ou gravação no banco.

## Recorrências

`endDate?: string` em ISO YYYY-MM-DD. Ausência mantém o comportamento legado sem prazo. A data é inclusiva e não pode anteceder a primeira ocorrência. Projeção, lista para conferir e servidor respeitam o término; confirmação futura continua proibida. Âncora de fim de mês é preservada, inclusive em fevereiro bissexto.

Editar ou remover o término mantém o ID da regra. Encurtar o prazo não apaga transações confirmadas. Regras com confirmações não podem ser excluídas, evitando referências órfãs; encerre-as pela data final. A lista de conferência mantém a janela existente dos últimos dois meses. O término não cria pagamentos automáticos.

## Jornada e cálculos

Primeiro pagamento de dívida exige despesa confirmada ligada a uma dívida, e não qualquer `parentId`. Recompensas antigas, inclusive concedidas pela regra anterior, não são revogadas. Missões continuam no serviço, deduplicadas por chave. Compra/venda de investimento não concede XP pelo volume.

Os sinais de entradas na tabela incluem venda, rendimento e ajuste positivo, acompanhando o saldo. Isso não transforma venda de investimento em receita do mês. Reservas não duplicam patrimônio; pagamentos de cartão não são uma segunda despesa.

## Interface e organização

Extraídos painéis de cartões e recorrências, calendário de faturas, estado vazio, gráfico e carregamento sob demanda. Conversão de formulário em `domain/form-command.ts`, validada antes de enviar. Núcleo, serviços e telas formatados para manutenção. Workspace ainda coordena outras seções; futuras extrações podem ocorrer por funcionalidade.

Rótulos de progresso, busca e navegação, foco visível, contraste de conquistas e layouts móveis revisados. A aparência original e as artes fornecidas permanecem. Testes automatizados não equivalem a certificação integral WCAG.

## Demonstração

`/apresentacao` é a página pública; `/demo` usa o mesmo workspace com fixtures em memória. Não lê identidade, API ou banco, não importa extratos nem salva edições. Filtros, navegação e simulação de metas funcionam. Formulários podem ser inspecionados com salvar desativado. O convite de demonstração agora abre `/demo` em vez de inserir registros. O comando legado `demo` permanece na API por compatibilidade, sem novos pontos de acesso na interface.

`build:portfolio` gera distribuição estática separada. Nenhum registro privado é injetado no bundle. Capturas usam apenas fixtures e relógio controlado. O artefato privado nunca deve ser publicado como se fosse a demo.
