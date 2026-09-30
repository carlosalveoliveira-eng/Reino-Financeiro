# Contribuindo

Use Node 24 e `npm ci`. Para explorar sem serviços, execute `npm run dev:portfolio`; para verificar alterações, `npm run check`. Os testes de integração criam D1 efêmero e usam identidades fictícias, sem credenciais de produção.

Antes de alterar regras, descreva o comportamento e acrescente regressão relevante. Preserve IDs, vínculos, centavos, recompensas e idempotência. Não edite migrações publicadas. Não use dados pessoais em fixtures, screenshots, issues ou commits.

Organização: `domain/` para cálculos puros; `validations/` para contratos; `services/` para comandos; `repositories/` para persistência; `components/` para interface; `app/workspace.tsx` para coordenação. Funções de formulário fazem a conversão textual antes da validação. Valores são centavos BRL; quantidades usam escala inteira.

Use `npx prettier --write <arquivos alterados>`. Inclua na descrição da alteração: problema concreto, comportamento resultante, testes e limites. Não declare integrações externas funcionando sem validá-las com o provedor.
