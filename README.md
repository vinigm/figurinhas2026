# ⚽ Figurinhas Copa 2026

App pra controlar o álbum Panini da Copa do Mundo 2026 (980 figurinhas).
Site estático (sem build), dados no **Firebase/Firestore**, login com **Google**,
instalável como **PWA** e com **exportação em PDF**.

## Como funciona
- **Toque** numa bolinha → marca que você tem.
- **Toque de novo** → conta repetidas (mostra 1, 2, … até 5).
- **Segure 1,5s** → tira uma repetida; segurando quando só tem 1, desmarca.
- Abas: **Todas · Me faltam · Repetidas · Estatísticas · Exportar**.

## Estrutura
```
index.html            casca da página
css/style.css         estilos (tema roxo/dourado)
js/
  firebase-config.js  configuração do Firebase
  auth.js             login Google + whitelist de e-mails
  album-data.js       catálogo das 980 figurinhas  ← edite aqui pra ajustar países
  state.js            estado (count 0–6 por figurinha)
  storage.js          Firestore (albums/{uid}) + cache local
  render.js           desenha tópicos, bolinhas, índice e progresso
  interactions.js     toque (+1) e segurar 3s (−1)
  tabs.js / views.js / export.js / app.js
firestore.rules       regras de segurança
manifest.webmanifest, sw.js, icons/  → PWA
```

## Configuração no Firebase (uma vez)
No console do projeto **figurinhas2026-30596**:
1. **Authentication → Sign-in method** → ativar **Google**.
2. **Authentication → Settings → Authorized domains** → adicionar `vinigm.github.io`
   (e `localhost` pra testar). Sem isso o login falha no site publicado.
3. **Firestore Database → Create database** (modo produção).
4. **Firestore → Rules** → colar o conteúdo de `firestore.rules` e publicar.

## Publicar no GitHub Pages
```bash
git add -A && git commit -m "App de figurinhas"
git remote add origin https://github.com/vinigm/figurinhas2026.git
git push -u origin main
```
No GitHub: **Settings → Pages → Source: `main` / root**.
O app fica em `https://vinigm.github.io/figurinhas2026/`.

## Ajustar a lista de figurinhas
Toda a estrutura do álbum está em [`js/album-data.js`](js/album-data.js).
Pra corrigir um país (código, nome, bandeira) ou a ordem, edite a lista `COUNTRIES`.
O total precisa fechar em **980** (o app avisa no console se não fechar).

## Liberar acesso pra amigos
1. Em `js/auth.js`, adicione o e-mail em `AUTHORIZED_EMAILS`.
2. Em `firestore.rules`, adicione o mesmo e-mail na lista e publique.
Cada pessoa tem sua própria coleção (documento `albums/{uid}`).
