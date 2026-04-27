# Planejamento atualizado da aplicacao web

## 1. Fonte de verdade atual

Com o arquivo `PERGUNTAS PARA TESTE DE TDAH FEMININO.docx`, o escopo do quiz ficou bem mais claro.

Agora temos definidos:

- as 20 perguntas finais
- as 4 areas do teste
- a escala de respostas
- a logica de pontuacao total
- as faixas de interpretacao
- o tom da tela de resultado
- o disclaimer etico
- a ponte de conversao para o MAPA

Tambem deixei esse conteudo salvo em formato estruturado em `conteudo/quiz-config.json` para reaproveitarmos na implementacao.

## 2. Objetivo do produto

Construir uma aplicacao web mobile-first, simples, rapida e emocionalmente forte, que:

- apresente um teste de 20 perguntas
- mostre 1 pergunta por tela
- avance automaticamente ao clicar na resposta
- calcule pontuacao total e pontuacao por area
- entregue uma tela final com interpretacao emocionalmente forte
- conduza a utilizadora para um proximo passo pago

O app deve gerar identificacao, nao parecer frio e nao soar como diagnostico clinico.

## 3. Estrutura final do quiz

### Areas

- atencao
- execucao
- emocional
- sobrecarga

### Distribuicao

- 5 perguntas por area
- 20 perguntas no total

### Escala de resposta

- Nunca = 0
- Raramente = 1
- As vezes = 2
- Frequentemente = 3
- Quase sempre = 4

## 4. Regra de negocio

### Pontuacao total

Com 20 perguntas e nota maxima 4 por pergunta:

```text
pontuacao_maxima = 80
percentual_total = (pontuacao_total / 80) * 100
```

### Pontuacao por area

Cada area tem 5 perguntas, entao:

```text
pontuacao_maxima_area = 20
percentual_area = (pontuacao_area / 20) * 100
```

Mesmo assim, a implementacao deve usar formula generica para nao depender de numero fixo:

```text
percentual_area = (pontuacao_area / (quantidade_perguntas_area * 4)) * 100
```

### Faixas de resultado

```text
0 a 39%   -> baixa compatibilidade
40 a 59%  -> sinais que merecem atencao
60 a 100% -> altamente compativel com TDAH feminino camuflado/compensado
```

## 5. Resultado final esperado

### Faixa 1 - 0 a 39%

Mensagem-base:

"Seu resultado indica poucos sinais compativeis com TDAH feminino."

Orientacao emocional:

- validar o que a pessoa sente
- dizer que isso nao invalida o desconforto dela
- sugerir que pode haver sobrecarga emocional, ansiedade ou outro padrao ainda nao nomeado

### Faixa 2 - 40 a 59%

Mensagem-base:

"Seu resultado mostra sinais que merecem atencao."

Orientacao emocional:

- mostrar que talvez ela funcione, mas com esforco alto
- reforcar instabilidade, sobrecarga e inconsistencias percebidas
- posicionar esse resultado como algo que merece ser compreendido com mais profundidade

### Faixa 3 - 60 a 100%

Mensagem-base:

"Seu resultado mostra um padrao altamente compativel com TDAH feminino, especialmente em perfis mascarados ou compensados."

Orientacao emocional:

- reforcar o custo invisivel do funcionamento
- validar cansaco, dificuldade de iniciar, manter constancia e sobrecarga mental
- evitar frasear isso como diagnostico fechado

### Blocos fixos da tela final

- bloco por area:
  - Atencao: XX%
  - Execucao: XX%
  - Emocional: XX%
  - Sobrecarga: XX%
- frase de transicao:
  - "Esse teste nao mede so distracao. Ele revela o esforco invisivel de quem aprendeu a funcionar, mesmo se sentindo sobrecarregada por dentro."
- disclaimer:
  - "Este teste e psicoeducativo e nao substitui avaliacao clinica ou neuropsicologica. Mas pode ser um primeiro passo importante para voce entender como sua mente funciona."
- ponte de conversao:
  - "Se voce se reconheceu nesse resultado, o proximo passo nao e tentar se esforcar mais. E entender o seu padrao."
- CTA principal:
  - "Quero meu MAPA completo"

## 6. Fluxo da interface

### Tela 1 - abertura

- headline emocional
- ambiente visual acolhedor
- botao "Comecar"

### Tela 2 - instrucao

- texto curto
- botao "Continuar"

### Tela 3 em diante - perguntas

- contador visual, ex.: `7/20`
- barra de progresso
- pergunta centralizada
- 5 opcoes de resposta
- auto-avanco ao responder

### Tela final - resultado

- percentual total
- faixa interpretativa
- copy emocional correspondente
- bloco com percentuais por area
- disclaimer etico
- ponte de conversao
- CTA final

## 7. Recomendacao tecnica

### Caminho ideal para o MVP

O briefing continua favorecendo um MVP frontend-first:

- React
- Vite
- React Router ou fluxo por estado
- CSS modular ou Tailwind
- calculo local
- persistencia opcional em `localStorage`

### Papel do Flask

Voce quer usar Flask com React, entao a melhor leitura hoje e:

- React cuida da experiencia inteira do quiz no MVP
- Flask entra como fase 2 ou camada opcional

O Flask sera util para:

- leads
- analytics
- clique no CTA
- configuracao remota
- integracao com CRM, checkout ou admin

## 8. Estrutura sugerida

### MVP enxuto

```text
as18/
  PLANEJAMENTO.md
  conteudo/
    quiz-config.json
  frontend/
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      styles/
        globals.css
        theme.css
      data/
        quizContent.js
      lib/
        scoring.js
        storage.js
      components/
        ScreenFrame.jsx
        ProgressBar.jsx
        AnswerButton.jsx
        ResultSection.jsx
        AreaScoreList.jsx
        CTASection.jsx
      pages/
        WelcomePage.jsx
        IntroPage.jsx
        QuizPage.jsx
        ResultPage.jsx
```

### Fase 2 com Flask

```text
as18/
  backend/
    app/
      __init__.py
      routes/
        health.py
        leads.py
        events.py
      services/
        lead_capture.py
    requirements.txt
    run.py
```

## 9. Contrato de dados recomendado

### Pergunta

```json
{
  "id": "atencao_01",
  "area": "atencao",
  "text": "Eu me distraio com facilidade... mesmo quando eu realmente queria conseguir focar.",
  "order": 1
}
```

### Resposta da utilizadora

```json
{
  "questionId": "atencao_01",
  "value": 3
}
```

### Resultado calculado

```json
{
  "scoreTotal": 58,
  "percentageTotal": 73,
  "resultBand": "high",
  "areas": {
    "atencao": 80,
    "execucao": 95,
    "emocional": 90,
    "sobrecarga": 100
  }
}
```

## 10. Logica de frontend

### Estado minimo necessario

- `currentScreen`
- `currentQuestionIndex`
- `answers`
- `scoreTotal`
- `percentageTotal`
- `areaScores`
- `resultBand`

### Funcoes principais

- `startQuiz()`
- `goToIntro()`
- `answerQuestion(questionId, value)`
- `calculateTotals(answers)`
- `calculateAreaScores(answers, questions)`
- `getResultBand(percentageTotal)`
- `resetQuiz()`

### Persistencia local opcional

Salvar em `localStorage`:

- indice da pergunta atual
- respostas dadas
- resultado final

## 11. Direcao visual

O DOCX reforca um tom feminino, leve, elegante e emocionalmente acolhedor.

### Direcao recomendada

- fundo bege ou off-white
- muito espaco em branco
- tipografia limpa e sofisticada
- destaque suave em tons quentes
- sem cara de dashboard ou formulario tecnico
- transicoes suaves

### Linguagem de interface

- frases curtas
- pouco ruido
- foco na leitura confortavel
- resultado final com respiracao e impacto

## 12. Fases de implementacao

### Fase 1 - consolidacao de conteudo

- salvar as 20 perguntas em formato estruturado
- definir as copies finais por faixa
- fechar disclaimer e CTA

### Fase 2 - scaffold do frontend

- criar projeto React com Vite
- montar tema visual
- preparar fluxo das paginas

### Fase 3 - quiz funcional

- implementar abertura
- implementar instrucao
- implementar 20 perguntas com auto-avanco
- implementar progresso

### Fase 4 - tela de resultado

- calcular score total
- calcular score por area
- aplicar copy por faixa
- montar CTA final

### Fase 5 - acabamento

- responsividade real
- animacoes suaves
- refinamento tipografico
- acessibilidade

### Fase 6 - evolucao com Flask

- captura de leads
- eventos de conversao
- integracoes comerciais

## 13. Priorizacao do MVP

### Obrigatorio

- 20 perguntas finais do DOCX
- 1 pergunta por tela
- escala 0 a 4
- auto-avanco ao responder
- percentual total
- percentual por area
- 3 faixas de interpretacao
- CTA final funcional
- mobile first bem resolvido

### Pode entrar depois

- captacao de email ou WhatsApp
- testes A/B de copy
- dashboard de analytics
- configuracao remota por Flask

## 14. Criterios de aceite

- todas as 20 perguntas aparecem corretamente
- as 4 areas estao mapeadas corretamente
- o percentual total bate com a formula sobre 80 pontos
- os percentuais por area batem com a quantidade de perguntas da area
- 0 a 39 cai na faixa baixa
- 40 a 59 cai na faixa intermediaria
- 60 ou mais cai na faixa alta
- a tela final nao soa como diagnostico fechado
- o CTA aparece com destaque
- o layout funciona muito bem em mobile

## 15. Proximo passo recomendado

Agora que as perguntas ja estao fechadas, o melhor caminho e:

1. criar o `frontend/` com React + Vite
2. transformar `conteudo/quiz-config.json` em dados consumidos pelo app
3. implementar primeiro o fluxo completo local
4. validar a experiencia e a copy
5. adicionar Flask depois, se necessario
