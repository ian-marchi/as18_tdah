# TDAH Feminino Quiz

Aplicação full stack para triagem psicoeducativa com foco em sinais compatíveis com TDAH feminino.

## Visão geral

O projeto combina um fluxo de quiz acolhedor em React com uma API Flask responsável por:

- servir o frontend já compilado
- disponibilizar o conteúdo do quiz
- calcular o resultado final
- registrar leads capturados antes do teste

## Stack

- React 18 + Vite
- Flask + Flask-CORS
- Gunicorn para execução em produção
- JSON como fonte de conteúdo
- CSV/JSONL para persistência simples de leads
- Railway com Dockerfile para deploy

## Estrutura

```text
backend/   API Flask e regras de negócio
conteudo/  perguntas, copies e configuração do quiz
frontend/  aplicação React/Vite
run.py     entrypoint raiz para produção no Railway
```

## Principais funcionalidades

- landing page inicial com proposta premium
- captura de nome, telefone e e-mail antes do início do teste
- quiz com 20 perguntas e opção de voltar
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

Arquivos importantes para o Railway:

- `Dockerfile`
- `railway.json`
- `requirements.txt`
- `run.py`

Configuração de produção usada:

- build: multi-stage no `Dockerfile` com Node + Python
- start: `gunicorn --bind 0.0.0.0:$PORT run:app`

Fluxo recomendado:

1. Criar um novo projeto no Railway
2. Conectar este repositório GitHub
3. Deixar o Railway deployar pela raiz do projeto
4. Gerar um domínio público no serviço

## Observações

- O diretório `dados/` é ignorado no Git e serve apenas para persistência local simples
- Para uso real em produção, o ideal é substituir a persistência em arquivo por banco de dados ou storage externo
