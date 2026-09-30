# Verificação da entrega — 30/09/2026

Executada localmente no Windows, Node 24.14.0, Chromium do Playwright. Todos os dados usados nos testes e nas capturas são fictícios. O banco pessoal hospedado não foi acessado.

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | Passou, sem avisos na execução final |
| `npm run typecheck` | Passou |
| `npm test` | 31 testes de domínio + 3 testes de formulários passaram |
| `npm run test:offline` | 6 verificações de criptografia/ciclo de vida passaram |
| `npm run build` | Build privado Vinext/Worker passou |
| `npm run test:integration` | 90 verificações em D1 efêmero passaram |
| `npm run build:portfolio` | Build público estático passou |
| `npm run test:public-build` | 6 rotas do build compilado passaram, incluindo `/demo/` e `/demo/index.html`, sem API privada ou recursos com falha |
| `npm run test:browser` | 4 cenários passaram; navegação por 15 seções, acessibilidade, responsividade e calendário |
| `npm run check:public` | 24 arquivos do artefato público verificados; nenhuma exportação ou padrão conhecido de segredo encontrado |
| `npm run format:check` | Passou |
| Comparação SHA-256 com manifesto original | 11 arquivos de banco, migrações, repositório e autenticação idênticos |

`npm run check` executou a cadeia original completa com código de saída zero. A verificação adicional das seis rotas compiladas passou separadamente e foi incluída nesse comando. O teste de meia-noite foi refinado para conferir especificamente a fatura cadastrada e avançar o relógio simulado, evitando confusão com a fatura estimada do mês anterior.

## Cobertura relevante

- Faturas antes/no dia/depois do fechamento, limite UTC/Cuiabá, datas explícitas e estimadas, fevereiro e preservação dos registros/saldos. No navegador, a fatura cadastrada muda de Fecha hoje para Fechada à meia-noite sem alterar o limite disponível.
- Recorrência com data final inclusiva, legada sem término, âncora de fim de mês/bissexto, validação de data impossível e fim anterior ao início, confirmação dentro/fora do intervalo, edição/remoção do término, preservação do ID e do histórico. Exclusão de regra confirmada bloqueada.
- Centavos exatos, parcelas, transferências, pagamentos, patrimônio, deduplicação, proteção de registros vinculados, concorrência e rollback já existentes continuam passando.
- Conquista de pagamento de dívida não é concedida por compra de investimento. Recompensas históricas não são removidas. XP diário e replays permanecem deduplicados.
- Formulários convertem centavos e reconciliação negativa, validam referências e calendário; datas futuras ficam previstas. Término opcional persiste na edição da recorrência.
- Demonstração não chama `/api/finance`; rotas públicas não alteram snapshots privados. Edições, exportação e importação de extratos estão desativadas no passeio.
- axe WCAG 2 A/AA e 2.1 AA sem violações detectadas na apresentação, painel e 15 seções da demo em desktop. Largura sem transbordamento a 390 px, menu móvel e Escape, filtros/simulador e formulário de recorrência conferidos. Isso não substitui avaliação humana completa com leitores de tela.

## Capturas reais

Arquivos em `docs/screenshots/`, gerados por `tests/browser/portfolio.spec.ts`:

- `apresentacao-desktop.png` — 1440 px de largura.
- `apresentacao-mobile.png` — 390 px.
- `dashboard-desktop.png` — painel e reino com fixtures.
- `faturas-desktop.png` — fatura fechada em 29/09/2026 observada em 30/09/2026.
- `metas-mobile.png` — metas e simulação de reserva mensal.

O Browser integrado não tinha navegador conectado. As capturas e verificações foram executadas com Chromium local instalado pelo Playwright; não são mockups nem imagens geradas.

## Limites e pendências externas

Nenhum deploy, publicação no GitHub ou teste no banco real foi executado. CI foi preparada, mas só poderá rodar remotamente após existir um repositório de destino. Destino público, domínio e licença geral ainda precisam ser definidos. Atualização privada exige acesso ao host e backup integral no provedor.

Vinext informa que a classificação estática de `/demo` e `/apresentacao` é desconhecida; ambas renderizaram sem identidade no teste HTTP. O build estático independente não depende dessa classificação. O aviso de ambiente FORCE_COLOR/NO_COLOR emitido pelo Playwright não afetou os testes.

Não foram testados bancos, cotações, push/e-mail, LLM ou apps nativos, pois não estão conectados. Não foi implementado login Google nem expansão multiusuário. Consulte `PUBLICACAO.md` para implantação sem expor a aplicação pessoal.
