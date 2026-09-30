# Segurança e dados pessoais

Não abra issues com extratos, exportações JSON/CSV/OFX, identificadores pessoais, credenciais ou capturas do ambiente real. Descreva falhas com dados fictícios e passos mínimos. Não há canal privado de suporte configurado neste pacote; para vulnerabilidades sensíveis, use o canal privado que o mantenedor definir antes da publicação.

O portfólio estático (`dist-portfolio/`) não contém servidor, banco nem credenciais. A demonstração não chama `/api/finance`, não importa dados do usuário e não grava alterações. Os testes monitoram requisições para garantir esse isolamento.

A aplicação privada continua dependendo da identidade confiável do dispatcher Sites e do binding D1. Fora desse ambiente, não exponha a API confiando em cabeçalhos fornecidos pelo navegador. Não foi adicionado login Google nem ampliado o suporte multiusuário.

`.gitignore` exclui exportações, bancos locais, segredos e configurações privadas. `npm run check:public` verifica o artefato público contra extensões proibidas e padrões de segredos; essa verificação não substitui a revisão humana antes de publicar. O artefato deve ser gerado de um checkout limpo.

As migrações existentes são imutáveis. Faça backup privado por procedimento do provedor antes de qualquer migração. O JSON exportado pela interface não é um backup integral: não inclui todas as tabelas de recompensas e auditoria e não possui importador de restauração. Esta entrega não migra nem acessa o banco de produção.
