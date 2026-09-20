# Portal de Viagens | Ecovias Araguaia

Projeto Firebase: `ecovias-araguaia-viagens`.

## Estado atual

**Código enviado ao GitHub. Publicação de produção ainda bloqueada.** O portal existente é um protótipo local com `localStorage` e login de demonstração; não use dados pessoais reais nele.

- `prototype/portal_viagens.html`: versão visual e funcional do protótipo para avaliação local, corrigida a renderização de campos.
- `public/index.html`: página neutra de preparação. O protótipo não é publicado automaticamente.
- `firebase.json` e `.firebaserc`: configurações do projeto Firebase informado.
- `firestore.rules`: acesso negado por padrão até implementar regras por perfil.
- `.github/workflows/validate.yml`: teste automático a cada atualização de `main`.
- `.github/workflows/firebase-hosting.yml`: publicação automática preparada, mas só será executada quando `ENABLE_PRODUCTION_DEPLOY=true` e o projeto estiver pronto.

## Antes de habilitar o Hosting

1. Ativar Firebase Authentication e Cloud Firestore no Console, conforme aprovação do responsável pelo projeto.
2. Substituir as credenciais demonstrativas pelo Firebase Authentication.
3. Substituir `localStorage` pelo Firestore para que colaboradores e ADM vejam os mesmos pedidos, com validações e regras de acesso robustas.
4. Proteger os cadastros, as regras administrativas e os dados pessoais; testar criar/editar/consultar em navegadores diferentes.
5. Substituir `public/index.html` pela aplicação segura e revisar `firestore.rules`.
6. Configurar no GitHub Actions a variável `FIREBASE_PROJECT_ID=ecovias-araguaia-viagens` e o secret `FIREBASE_SERVICE_ACCOUNT` (nunca inserir no código). Use uma conta de serviço de privilégio mínimo ou o fluxo oficial de integração Firebase Hosting + GitHub.
7. **Só depois** definir `ENABLE_PRODUCTION_DEPLOY=true` nas variáveis do repositório para ativar deploy automático no `main`.

**Segurança:** este repositório está público no momento da preparação. Considere torná-lo privado antes de trabalhar com informações internas. Não compartilhe senhas/chaves em chats ou commits.
