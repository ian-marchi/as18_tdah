# TDAH Feminino Quiz

Aplicação full stack para triagem psicoeducativa com foco em sinais compatíveis com TDAH feminino, com experiência pública em React e painel administrativo protegido servido pela mesma aplicação Flask.

## Visão geral

O projeto combina um fluxo de quiz acolhedor com uma API Flask responsável por:

- servir o frontend compilado
- disponibilizar o conteúdo do quiz
- calcular o resultado final no servidor
- registrar submissões completas com contato + snapshot do resultado
- proteger um dashboard administrativo em `/dashboard`

## Stack

- React 18 + Vite
- Flask + Flask-CORS
- SQLite para persistência principal
- Gunicorn em produção
- JSON como fonte de conteúdo
- Railway com Dockerfile para deploy

## Estrutura

```text
backend/          API Flask, autenticação admin e regras de negócio
conteudo/         perguntas, copies e configuração do quiz
frontend/         aplicação React/Vite e dashboard administrativa
dados/            dados locais e banco SQLite em desenvolvimento
gunicorn.conf.py  configuração de runtime do Gunicorn
run.py            entrypoint raiz de produção
railway.json      configuração do deploy no Railway
```

## Funcionalidades

- landing page pública com estética premium
- fluxo: home -> antes de começar -> perguntas -> resultado parcial -> coleta -> resultado completo
- quiz com 20 perguntas e leitura por eixo
- gravação de submissões completas em SQLite
- importação do legado em CSV/JSONL para o banco
- dashboard administrativa com login por sessão
- métricas por dia, semana e mês
- busca de usuárias por nome, e-mail ou telefone
- visualização detalhada dos resultados por usuária

## Rodando localmente

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend em desenvolvimento

```bash
cd frontend
npm install
npm run dev
```

### Frontend servido pelo Flask

```bash
cd frontend
npm run build
cd ..
python run.py
```

## Testes

```bash
python -m unittest backend.tests.test_scoring backend.tests.test_leads backend.tests.test_submissions backend.tests.test_admin_routes -v
```

## Dashboard administrativa

- URL: `/dashboard`
- Login padrão:
  - `admin@admin.com`
  - `admin#22018@`

Em produção, o ideal é sobrescrever essas credenciais via variáveis de ambiente.

## Variáveis de ambiente

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FLASK_SECRET_KEY`
- `DATABASE_PATH`
- `APP_TIMEZONE`
- `SESSION_COOKIE_SECURE`

Se houver volume no Railway, a aplicação também reconhece `RAILWAY_VOLUME_MOUNT_PATH` e pode usar esse diretório como base do SQLite.

## Deploy no Railway

O repositório está preparado para deploy pela raiz com Dockerfile.

Arquivos principais do deploy:

- `Dockerfile`
- `railway.json`
- `gunicorn.conf.py`
- `requirements.txt`
- `run.py`

Configuração recomendada:

1. Criar um volume no Railway e montar, por exemplo, em `/data`
2. Definir:
   - `FLASK_SECRET_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `SESSION_COOKIE_SECURE=1`
3. Opcionalmente definir `DATABASE_PATH=/data/submissions.sqlite3`
4. Fazer o deploy pela raiz do repositório

## Observações

- Os endpoints administrativos ficam em `/api/admin/*` e exigem sessão autenticada
- Os dados sensíveis não são expostos na home pública
- O histórico legado é preservado no banco como registro migrado, com sinalização de que o resultado completo não estava disponível
