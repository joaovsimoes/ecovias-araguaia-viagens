# Portal de Viagens | Ecovias Araguaia

Firebase Project ID: `ecovias-araguaia-viagens`.

## Situação

A integração com Firebase **está no GitHub para homologação**, mas **o site para dados reais ainda não está publicado**. Nenhuma credencial administrativa ou conta de serviço foi incluída no repositório.

| Diretório | Uso |
| --- | --- |
| `prototype/portal_viagens.html` | Protótipo visual anterior, para referência. Contém login de teste: NÃO PUBLICAR. |
| `staging/index.html` + `staging/firebase-client.js` | Interface migrada para Auth + Firestore, sem login demonstrativo e sem localStorage. Ainda exige configuração e testes online. |
| `staging/firestore.rules` | Regras propostas para avaliação e testes de homologação. |
| `firestore.rules` | Regras de produção negando acesso até aprovar a migração. |
| `public/index.html` | Página neutra de preparação, única pasta configurada como Hosting. |

O GitHub Actions verifica a sintaxe automaticamente. O deploy do Hosting está bloqueado pela variável `ENABLE_PRODUCTION_DEPLOY` até liberação expressa, configuração de credenciais no GitHub, revisão de segurança e substituição da página de preparação.

## Configurar Firebase no Console

1. Em **Authentication → Sign-in method** habilite **E-mail/senha** para administradores e **Anônimo** para colaboradores que enviarão solicitações sem login. O formulário administrativo continuará pedindo apenas **usuário e senha**.
2. Em **Firestore Database**, confirme a criação do banco.
3. **Primeiro administrador, sem enviar a senha a ninguém:** Authentication → Users → Add user. Para o nome de usuário `july.dezani`, use o alias interno `july.dezani@ecovias-araguaia-viagens.invalid` e uma senha forte escolhida no próprio Console. O alias é apenas um identificador interno do Firebase Auth, não um endereço para recuperação por e-mail.
4. Copie o **UID** dessa conta no Console. Em Firestore, crie a coleção `admins`, documento com ID igual ao UID e campos: `username` (string) = `july.dezani`, `role` (string) = `admin`, `active` (boolean) = `true`. **Nunca permita autoconcessão de administrador via cliente.**
5. Revise e publique as regras de `staging/firestore.rules` **no ambiente de homologação**. As regras existentes `firestore.rules` permanecem com acesso negado até validação. Teste primeiro com dados fictícios e contas sem acesso.
6. Confirme os testes: anônimo envia sem poder listar/ver pedidos de outros usuários; administrador com perfil ativo lista/edita; usuário sem perfil não acessa ADM; campos salvos são compartilhados entre dispositivos; logout bloqueia acesso; confirmação e status funcionam conforme limites descritos abaixo.

**Limite da consulta por código:** sem criar uma autenticação do colaborador ou um serviço de consulta mediada, o código somente pode recuperar pedidos associados à sessão anônima autenticada que os enviou. Não exponha todos os pedidos publicamente apenas para permitir consulta por código; encaminhe solicitações de outra sessão ao administrador.

**Recuperação de senha:** aliases `.invalid` não recebem e-mails. Recuperação/provisionamento de contas desse tipo deve ocorrer pelo responsável no Firebase Console ou por fluxo de backend confiável, nunca exibindo ou armazenando senhas no site.

## Publicação automática posterior

Configure no GitHub Actions:
- Variable `FIREBASE_PROJECT_ID=ecovias-araguaia-viagens`;
- Secret `FIREBASE_SERVICE_ACCOUNT` exclusivamente nas configurações do GitHub, sem compartilhá-lo em chats/commits.

Antes de ativar `ENABLE_PRODUCTION_DEPLOY=true`, substitua `public/index.html` por aplicativo revisado e ajuste `firestore.rules` com testes de autorização. O fluxo só publica a pasta `public/`, **não publica o protótipo nem os arquivos de homologação**.

**O repositório está público.** Torne-o privado antes de acrescentar processos ou informações corporativas confidenciais.
