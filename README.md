# Portal de Viagens | Ecovias Araguaia

**Endereço oficial:** https://ecovias-araguaia-viagens.web.app/

**Projeto Firebase:** `ecovias-araguaia-viagens`.

## Estrutura

- `staging/index.html` e `staging/firebase-client.js`: código-fonte do portal, conectado a Authentication e Firestore.
- `firestore.rules` e `staging/firestore.rules`: regras de acesso, iguais no repositório. **Alterações nas regras devem ser revisadas e publicadas manualmente no Firebase Console**. O workflow não as publica.
- `public/`: pasta de publicação no Firebase Hosting. O workflow copia para ela os arquivos da aplicação antes de cada deploy. A página de preparação armazenada nessa pasta no repositório não é o site publicado.
- `prototype/portal_viagens.html`: protótipo anterior, com login de demonstração. **Nunca publicar**.

## Publicação

- `.github/workflows/firebase-preview.yml`: publicação manual no canal temporário de homologação, com dados fictícios.
- `.github/workflows/firebase-hosting.yml`: publica o portal oficial no canal `live` ao alterar arquivos da aplicação na branch `main`, após verificações automáticas de código e privacidade. Pode também ser acionado manualmente.
- O secret `FIREBASE_SERVICE_ACCOUNT` pertence exclusivamente às configurações de secrets do GitHub Actions. Nunca adicionar contas de serviço nem senhas ao repositório.

## Acesso e privacidade

- Administradora inicial: usuário `july.dezani`, com senha cadastrada diretamente no Firebase Authentication.
- Colaboradores enviam pedidos sem criar login. A consulta pelo código em qualquer dispositivo mostra o andamento, as atualizações e somente campos de viagem explicitamente permitidos. Dados pessoais e internos permanecem na coleção privada de solicitações.
- A pessoa que conhece o código pode consultar esses campos permitidos, conforme a decisão para este portal. Não colocar informações pessoais no campo de retorno visível ao colaborador.
- Os testes funcionais confirmados no ambiente de homologação não substituem testes automatizados de autorização. Novas funcionalidades e mudanças nas regras devem ser testadas antes de serem oferecidas para uso real.
- O alias de administrador `.invalid` não recebe e-mail de recuperação: redefinição de senha precisa ser feita por responsável autorizado no Firebase Console ou backend confiável.

**Atenção:** o repositório foi identificado como público. Considere torná-lo privado antes de acrescentar documentos corporativos, dados internos ou informações operacionais confidenciais.
