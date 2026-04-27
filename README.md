# TDAH Feminino Quiz

Aplicação full stack para triagem psicoeducativa com foco em sinais compatíveis com TDAH feminino.

## Visão geral

O projeto combina um fluxo de quiz acolhedor em React com uma API Flask responsável por:

- servir o frontend compilado
- disponibilizar o conteúdo do quiz
- calcular o resultado final
- registrar leads capturados antes do teste

## Stack

- React 18 + Vite
- Flask + Flask-CORS
- Gunicorn em produção
- JSON como fonte de conteúdo
- CSV/JSONL para persistência simples de leads
- Railway com Dockerfile para deploy

## Estrutura

```text
backend/          API Flask e regras de negócio
conteudo/         perguntas, copies e configuração do quiz
frontend/         aplicação React/Vite
gunicorn.conf.py  configuração de runtime do Gunicorn
run.py            entrypoint raiz de produção
railway.json      configuração do deploy no Railway
```

## Funcionalidades

- landing page inicial com estética premium
- captura de nome, telefone e e-mail antes do teste
- quiz com 20 perguntas e navegação de volta
- cálculo de resultado por faixa e por área
- CTA final para o MAPA
- persistência simples de leads para demonstração

## Rodando localmente

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testes

```bash
python -m unittest backend.tests.test_scoring backend.tests.test_leads -v
```

## Deploy no Railway

O repositório está preparado para deploy pela raiz com Dockerfile.

Arquivos principais do deploy:

- `Dockerfile`
- `railway.json`
- `gunicorn.conf.py`
- `requirements.txt`
- `run.py`

Configuração de produção:

- build com Docker multi-stage
- frontend compilado no estágio Node
- backend servido por Gunicorn
- bind em `0.0.0.0:$PORT`
- healthcheck em `/api/health/`

Fluxo recomendado:

1. Criar um novo projeto no Railway
2. Conectar este repositório GitHub
3. Deixar o deploy usar a raiz do projeto
4. Gerar um domínio público no serviço
5. Confirmar que o domínio aponta para a porta padrão do deploy

## Observações

- O diretório `dados/` é ignorado no Git e serve apenas para persistência local simples
- Para produção real, o ideal é substituir a persistência em arquivo por banco de dados ou storage externo
