> Nota da versão de portfólio: este guia registra o estado original recebido. As correções atuais, incluindo faturas e término de recorrências, estão em docs/PORTFOLIO.md e docs/VALIDACAO.md.

# Continuação do Reino Financeiro no Claude

Este pacote contém o código-fonte completo da última versão publicada, recursos visuais, arquivos de dependências, configurações, migrações, testes e documentação. Não contém dependências instaladas, caches, artefatos compilados nem credenciais. O repositório .git foi omitido; inicie um novo repositório se desejar.

## Estado da entrega

Commit de origem: 044faba01f709b6595316446420a8d0c9fdd6357
Última publicação: ambiente privado de origem (endereço omitido do portfólio)
Data: 30/09/2026. Fuso do usuário: America/Cuiaba.

## Como continuar

1. Extraia o ZIP e abra a pasta Reino-Financeiro no Claude Code.
2. Leia README.md, este guia e os arquivos de docs/. Os arquivos de atualizações descrevem o estado mais recente; a arquitetura contém também objetivos ainda não implementados.
3. Instale Node compatível com engines de package.json (>=22.13.0; desenvolvimento anterior usou Node 24.19.0) e execute npm ci.
4. Execute npm run typecheck, npm test e npm run build. Depois execute npm run test:integration e node tests/offline.test.mjs.
5. npm run dev inicia o desenvolvimento; a aplicação exige autenticação e D1. Sem o dispatcher do Sites e binding DB, abrir a página não configura automaticamente uma identidade ou banco.

## Estrutura

- app/: interface, autenticação e API /api/finance.
- domain/: cálculos de finanças, missões, importação e guia local.
- services/: validações de negócio e operações atômicas.
- repositories/: persistência em D1 e isolamento por proprietário.
- validations/: schemas Zod.
- db/ e drizzle/: schema, SQL e histórico de migrações.
- components/: componentes de interface.
- public/: imagens originais, PWA e caderno offline cifrado.
- tests/ e scripts/: verificações e execução.
- integrations/: contratos; provedores externos ainda não conectados.

## Hospedagem e portabilidade

React 19/TypeScript, convenções de Next.js com Vinext/Vite, Tailwind/shadcn, Recharts, Zod e Cloudflare D1. A identidade atual vem dos cabeçalhos confiáveis do dispatcher ChatGPT/Sites, em app/chatgpt-auth.ts. Fora desse ambiente, implementar autenticação própria validada pelo servidor; nunca aceitar cabeçalhos de identidade enviados livremente pelo navegador. Configurar DB e aplicar migrações em uma nova instalação. Não reaplicar ou alterar migrações já executadas em um banco existente.

Supabase/Postgres, Open Finance, cotações externas, LLM, notificações push e aplicativos nativos são objetivos futuros. O guia financeiro atual é local, baseado em regras.

## Dados pessoais

O ZIP não contém os dados financeiros que você cadastrou no aplicativo. Eles permanecem no banco hospedado. Exporte-os pela interface em JSON e mantenha uma cópia segura antes de migrar. O aplicativo não possui restauração automática desse JSON: implementar e validar um importador antes de trocar de banco. Preservar IDs e referências, centavos, pagamentos, parcelas, reservas, recompensas e regras. A exportação atual inclui items; o histórico técnico de operações/auditoria e as recompensas normalizadas não estão nesse export. Planejar uma exportação adicional dessas tabelas se desejar transportar todo o histórico.

## Correção prioritária pendente

O usuário informou uma fatura fechada em 29/09/2026; em 30/09/2026 ela não aparece como fechada. O sistema salva card_cycle.closingDate e deadline, mas a interface só exibe as datas. Não existe indicação automática de estado aberta/fechada. Esta correção NÃO foi implementada nem publicada.

Adicionar estado derivado da data local America/Cuiaba. Após o dia de fechamento, mostrar Fechada; definir o tratamento do próprio dia com clareza (por exemplo Fecha hoje). Atualizar a indicação ao reabrir a página e ao virar o dia. Fechamento não significa pagamento: não marcar como paga, não reduzir saldo, não mover compras e não criar lançamentos. Testar antes/no dia/depois do fechamento e limite de fuso. Preservar todos os registros existentes.

## Funcionalidades recentes

Cartões aceitam dias 1–31, regra opcional de 7º dia útil e feriados informados manualmente. Datas por fatura prevalecem; o mês da fatura é o mês de vencimento. A configuração não redistribui compras anteriores. Mover parcela é explícito e recalcula as despesas do mês. Pagamentos são alocados nas parcelas mais antigas, não vinculados diretamente a uma fatura específica.

Missões são contabilizadas no servidor, independentemente da tela. Recorrências concedem primeira conquista de 20 XP e hábito diário de 5 XP, quando ainda não concluído. Ao carregar, sync_journey recupera conquistas e hábitos ausentes de registros criados/atualizados hoje; não reconstitui hábitos de dias anteriores. Recompensas únicas impedem XP duplicado. Registros financeiros não são alterados nessa recuperação.

Recorrências ainda não têm data final; aluguel mensal é despesa recorrente, não o valor completo do contrato registrado novamente como dívida.

## Validação na última versão publicada

TypeScript e build passaram; 26 testes de domínio e 78 verificações de integração passaram. Testes offline anteriores: 6. Não houve QA de navegador na última atualização. Rode novamente após qualquer modificação. Não confundir testes locais com verificação dos dados reais do usuário.

## Prompt sugerido

Leia CONTINUAR-NO-CLAUDE.md e docs/. Continue este projeto preservando dados e comportamento existentes. Primeiro implemente o status visual automático de faturas pela data de fechamento no fuso America/Cuiaba. Não reordene compras, não altere pagamentos e não limpe o banco. Valide com testes e explique qualquer adaptação necessária de autenticação e hospedagem antes de migrar o ambiente.
