# HOOKO Frontend

Next.js App Router (**JavaScript**). Estética dark + ouro HOOKO, glassmorphism e split 50/50 em autenticação.

## Scripts

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — redireciona para `/login`.

## Variáveis

Crie `.env.local` opcional:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Quando integrar ao back-end real, nos formulários altere **`USE_MOCK`** para `false` em:

- `components/LoginForm/LoginForm.js`
- `components/RegisterForm/RegisterForm.js`

## Estrutura (MVP inicial)

```
app/
  layout.js + globals.css
  page.js                 → redirect /login
  login/page.js           + page.module.css   (marca | login)
  register/page.js       + page.module.css   (mesmo layout que login: marca | formulário)
components/
  BrandShowcase/
  OctopusLoopVideo/
  LoginForm/
  RegisterForm/
  Skeleton/
```

Próximas rotas previstas: `/dashboard`, `/dashboard/sync`, `/dashboard/insights/[id]`, `/dashboard/billing`.

## Vídeo na marca (login / register)

- `public/videos/login/octopus.mp4` — vídeo completo (~8 s), loop nativo `<video loop>`, enquadrado com **conteúdo à esquerda** (`object-position: left`). Painel marca fica **sempre à esquerda** no desktop e **no topo** no mobile (`brand` antes de `form` nas duas rotas).
