# Publicação e operação

## Portfólio público

1. Use checkout limpo, Node 24 e `npm ci`.
2. Execute `npm run check`. Nenhum teste precisa de dados ou credenciais reais.
3. Revise README, capturas e `dist-portfolio/`.
4. Hospede somente `dist-portfolio/` na raiz de um domínio estático, com HTTPS. O build inclui `index.html`, `demo/index.html`, `apresentacao/index.html` e `_redirects`.
5. Confira as três rotas, navegação móvel e ausência de chamadas financeiras na aba de rede.

Nenhuma publicação foi executada nesta sessão. Destino, domínio e repositório remoto não foram escolhidos. O workflow compila e testa, mas não faz deploy. Uma licença geral para código e arte ainda precisa ser definida pelo titular. GitHub Pages em subdiretório exige adaptar caminho-base e links; o build atual espera a raiz do domínio.

## Aplicação pessoal existente

Não a torne pública para mostrar o portfólio. Mantenha a restrição de acesso existente; publique a demo estática em outro destino. As rotas públicas dentro do runtime completo podem continuar limitadas pelo controle de acesso do host.

Para atualizar o ambiente pessoal, use o processo autenticado do host com o binding D1 existente. Esta versão não exige migração SQL. Não recrie banco, não reaplique migrações nem carregue exemplos nos registros existentes. Confirme backup integral privado no provedor; o JSON da interface não exporta todas as tabelas nem possui restauração automática.

`hosting.example.json` contém somente bindings locais. `.openai/` permanece local e ignorado. Artefatos privados podem incorporar configuração de implantação: não os publique no GitHub. `MANIFESTO-SHA256.json` descreve o pacote original, não os arquivos modificados nesta entrega.

## Dependências externas pendentes

| Recurso | Necessário |
| --- | --- |
| Atualização pessoal em produção | Acesso autenticado ao destino, backup e validação após deploy |
| Demo em URL pública | Host/domínio e publicação do artefato estático |
| GitHub remoto | Repositório de destino e decisão de licença |
| Open Finance | Provedor, contrato, consentimento e credenciais |
| Cotações, push/e-mail e LLM | Provedor, acesso, limites e testes reais |
| Supabase/novo host privado | Projeto e adaptação segura de identidade/persistência |
| Aplicativos nativos | Cliente, armazenamento seguro, sessões e distribuição |

Login Google e expansão multiusuário foram excluídos desta etapa.
