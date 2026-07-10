# Deploy na Vercel — bibbia.com.br

## 0. Antes de tudo
- Crie a propriedade no **Google Analytics 4** e copie o **ID de medição** (`G-XXXXXXXXXX`).
- Tenha o código num repositório Git (GitHub). Se ainda não tem:
  ```bash
  git init
  git add .
  git commit -m "Bíblia — site de leitura"
  # crie um repositório vazio no GitHub e:
  git remote add origin git@github.com:SEU_USUARIO/site-biblia.git
  git push -u origin main
  ```

## 1. Importar na Vercel
1. Acesse https://vercel.com e faça login (com o GitHub).
2. **Add New → Project** → selecione o repositório.
3. Framework: **Vite** (detectado automaticamente).
   - Build Command e Output já vêm do `vercel.json` (`npm run build:seo` → `dist`).
4. **Environment Variables** → adicione:
   - `VITE_GA_ID` = `G-XXXXXXXXXX` (seu ID do GA4)
5. **Deploy**. Em ~1 min o site sobe num endereço `*.vercel.app`.

## 2. Ligar o domínio bibbia.com.br
1. No projeto: **Settings → Domains** → adicione `www.bibbia.com.br` e `bibbia.com.br`.
2. Defina **www.bibbia.com.br como principal** (o site usa www no canonical) e redirecione o apex para o www.
3. A Vercel mostrará os registros DNS a criar.

## 3. Configurar o DNS no registro.br
No painel do registro.br (Zona DNS do domínio), crie:
- **CNAME** — nome `www` → valor `cname.vercel-dns.com`
- **A** — nome `@` (apex) → valor `76.76.21.21`

Salve. A propagação leva de minutos a algumas horas. O **HTTPS (SSL)** é emitido automaticamente pela Vercel.

## 4. Depois no ar
- **Google Search Console** (https://search.google.com/search-console): adicione a propriedade `https://www.bibbia.com.br`, verifique e envie o sitemap: `https://www.bibbia.com.br/sitemap.xml`.
- Teste o preview social no depurador do Facebook/WhatsApp.
- Confira os cabeçalhos de segurança em https://securityheaders.com.

## Atualizações futuras
Cada `git push` na branch principal dispara um novo deploy automático na Vercel.

## Alternativa sem GitHub (Vercel CLI)
```bash
npm i -g vercel
vercel            # primeiro deploy (responda às perguntas)
vercel --prod     # publica em produção
```
Defina o `VITE_GA_ID` em **Settings → Environment Variables** e refaça o deploy.
