import { startTransition, useEffect, useState } from "react";

import { IntroPage } from "./pages/IntroPage";
import { LeadCapturePage } from "./pages/LeadCapturePage";
import { QuizPage } from "./pages/QuizPage";
import { ResultPage } from "./pages/ResultPage";
import { WelcomePage } from "./pages/WelcomePage";
import { fetchQuizConfig, submitLeadForm, submitQuizAnswers } from "./lib/api";
import { clearQuizState, loadQuizState, saveQuizState } from "./lib/storage";
import { ScreenFrame } from "./components/ScreenFrame";


const DEFAULT_FLOW_STATE = {
  currentQuestionIndex: 0,
  answers: {},
  lead: null,
  result: null,
  screen: "welcome",
};


function normalizeLead(lead) {
  if (!lead || typeof lead !== "object") {
    return null;
  }

  const name = typeof lead.name === "string" ? lead.name.trim() : "";
  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  const email = typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  const ageRange = typeof lead.ageRange === "string" ? lead.ageRange.trim() : "";

  if (!name || !phone || !email || !ageRange) {
    return null;
  }

  return {
    ...lead,
    name,
    phone,
    email,
    ageRange,
  };
}


function normalizePersistedState(savedState, config) {
  if (!savedState || typeof savedState !== "object") {
    return DEFAULT_FLOW_STATE;
  }

  const validQuestionIds = new Set(config.questions.map((question) => question.id));
  const sanitizedAnswers = Object.fromEntries(
    Object.entries(savedState.answers || {}).filter(([questionId]) =>
      validQuestionIds.has(questionId),
    ),
  );
  const normalizedLead = normalizeLead(savedState.lead);

  const hasCompleteResult =
    savedState.screen === "result" &&
    savedState.result &&
    normalizedLead &&
    Object.keys(sanitizedAnswers).length === config.questions.length;

  const boundedIndex = Math.min(
    Math.max(savedState.currentQuestionIndex || 0, 0),
    Math.max(config.questions.length - 1, 0),
  );

  if (hasCompleteResult) {
    return {
      answers: sanitizedAnswers,
      currentQuestionIndex: config.questions.length - 1,
      lead: normalizedLead,
      result: savedState.result,
      screen: "result",
    };
  }

  if (
    savedState.screen === "quiz" &&
    normalizedLead &&
    Object.keys(sanitizedAnswers).length > 0
  ) {
    return {
      answers: sanitizedAnswers,
      currentQuestionIndex: boundedIndex,
      lead: normalizedLead,
      result: null,
      screen: "quiz",
    };
  }

  if (savedState.screen === "intro" && normalizedLead) {
    return {
      ...DEFAULT_FLOW_STATE,
      lead: normalizedLead,
      screen: "intro",
    };
  }

  if (savedState.screen === "lead") {
    return {
      ...DEFAULT_FLOW_STATE,
      lead: normalizedLead,
      screen: "lead",
    };
  }

  return DEFAULT_FLOW_STATE;
}


function App() {
  const [config, setConfig] = useState(null);
  const [flowState, setFlowState] = useState(DEFAULT_FLOW_STATE);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingLead, setIsSavingLead] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      try {
        const nextConfig = await fetchQuizConfig();
        if (!isActive) {
          return;
        }

        const restoredState = normalizePersistedState(loadQuizState(), nextConfig);
        setConfig(nextConfig);
        setFlowState(restoredState);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          "Não consegui carregar o teste agora. Tente novamente dentro de instantes.",
        );
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    saveQuizState(flowState);
  }, [config, flowState]);

  useEffect(() => {
    if (flowState.screen === "quiz") {
      setIsSubmitting(false);
    }
  }, [flowState.currentQuestionIndex, flowState.screen]);

  function handleStart() {
    clearQuizState();
    setErrorMessage("");
    startTransition(() => {
      setFlowState({
        ...DEFAULT_FLOW_STATE,
        screen: "lead",
      });
    });
  }

  async function handleLeadSubmit(lead) {
    setErrorMessage("");
    setIsSavingLead(true);

    try {
      const response = await submitLeadForm(lead);
      const nextLead = normalizeLead(response.lead) || normalizeLead(lead);

      startTransition(() => {
        setFlowState((currentState) => ({
          ...currentState,
          lead: nextLead,
          screen: "intro",
        }));
      });
    } catch (error) {
      setErrorMessage(
        "Não consegui salvar seus dados agora. Revise as informações e tente novamente.",
      );
    } finally {
      setIsSavingLead(false);
    }
  }

  function handleContinue() {
    setErrorMessage("");
    startTransition(() => {
      setFlowState((currentState) => ({
        ...currentState,
        screen: "quiz",
      }));
    });
  }

  function handleBackQuestion() {
    if (isSubmitting || flowState.currentQuestionIndex === 0) {
      return;
    }

    setErrorMessage("");
    startTransition(() => {
      setFlowState((currentState) => ({
        ...currentState,
        currentQuestionIndex: Math.max(currentState.currentQuestionIndex - 1, 0),
      }));
    });
  }

  async function handleAnswer(value) {
    if (!config || isSubmitting) {
      return;
    }

    const currentQuestion = config.questions[flowState.currentQuestionIndex];
    const nextAnswers = {
      ...flowState.answers,
      [currentQuestion.id]: value,
    };
    const isLastQuestion = flowState.currentQuestionIndex === config.questions.length - 1;

    setErrorMessage("");
    setIsSubmitting(true);

    if (!isLastQuestion) {
      startTransition(() => {
        setFlowState((currentState) => ({
          ...currentState,
          answers: nextAnswers,
          currentQuestionIndex: currentState.currentQuestionIndex + 1,
        }));
      });
      return;
    }

    try {
      const payload = config.questions.map((question) => ({
        questionId: question.id,
        value: nextAnswers[question.id],
      }));

      const result = await submitQuizAnswers(payload, config);

      startTransition(() => {
        setFlowState({
          answers: nextAnswers,
          currentQuestionIndex: config.questions.length - 1,
          lead: flowState.lead,
          result,
          screen: "result",
        });
      });
    } catch (error) {
      setErrorMessage(
        "Não consegui calcular o resultado agora. Tente novamente em alguns segundos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRestart() {
    clearQuizState();
    setErrorMessage("");
    startTransition(() => {
      setFlowState(DEFAULT_FLOW_STATE);
    });
  }

  if (isBootstrapping) {
    return (
      <ScreenFrame
        eyebrow="Carregando o teste"
        title="Preparando a experiência..."
        subtitle="Estamos organizando as perguntas para você começar sem distrações."
        tone="soft"
      >
        <div className="loading-stack">
          <div className="loading-line loading-line-primary" />
          <div className="loading-line" />
          <div className="loading-line loading-line-short" />
        </div>
      </ScreenFrame>
    );
  }

  if (!config) {
    return (
      <ScreenFrame
        eyebrow="Algo saiu do esperado"
        title="Não consegui abrir o teste agora"
        subtitle={errorMessage}
        tone="soft"
      >
        <button className="primary-button" onClick={() => window.location.reload()} type="button">
          Tentar novamente
        </button>
      </ScreenFrame>
    );
  }

  const currentQuestion = config.questions[flowState.currentQuestionIndex];
  const currentArea = config.areas.find((area) => area.key === currentQuestion?.area);

  return (
    <>
      {flowState.screen === "welcome" ? (
        <WelcomePage screens={config.screens} onStart={handleStart} />
      ) : null}

      {flowState.screen === "intro" ? (
        <IntroPage screens={config.screens} onContinue={handleContinue} />
      ) : null}

      {flowState.screen === "lead" ? (
        <LeadCapturePage
          errorMessage={errorMessage}
          initialLead={flowState.lead}
          isSubmitting={isSavingLead}
          screens={config.screens}
          onSubmit={handleLeadSubmit}
        />
      ) : null}

      {flowState.screen === "quiz" ? (
        <QuizPage
          answers={flowState.answers}
          area={currentArea}
          current={flowState.currentQuestionIndex + 1}
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          options={config.scale}
          onBack={handleBackQuestion}
          question={currentQuestion}
          total={config.questions.length}
          onAnswer={handleAnswer}
        />
      ) : null}

      {flowState.screen === "result" && flowState.result ? (
        <ResultPage
          result={flowState.result}
          onRestart={handleRestart}
        />
      ) : null}
    </>
  );
}


export default App;
