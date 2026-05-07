import { startTransition, useEffect, useState } from "react";

import { ScreenFrame } from "./components/ScreenFrame";
import { clearQuizState, loadQuizState, saveQuizState } from "./lib/storage";
import { fetchQuizConfig, submitQuizAnswers, submitSubmission } from "./lib/api";
import { DashboardPage } from "./pages/DashboardPage";
import { IntroPage } from "./pages/IntroPage";
import { LeadCapturePage } from "./pages/LeadCapturePage";
import { QuizPage } from "./pages/QuizPage";
import { ResultPage } from "./pages/ResultPage";
import { ResultPreviewPage } from "./pages/ResultPreviewPage";
import { WelcomePage } from "./pages/WelcomePage";


const DEFAULT_FLOW_STATE = {
  currentQuestionIndex: 0,
  answers: {},
  lead: null,
  result: null,
  screen: "welcome",
};


function resolveAppRoute() {
  return window.location.pathname.startsWith("/dashboard") ? "dashboard" : "public";
}


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
  const questionCount = config.questions.length;
  const hasCompleteAnswers = Object.keys(sanitizedAnswers).length === questionCount;
  const boundedIndex = Math.min(
    Math.max(savedState.currentQuestionIndex || 0, 0),
    Math.max(questionCount - 1, 0),
  );

  if (savedState.screen === "result" && savedState.result && normalizedLead && hasCompleteAnswers) {
    return {
      answers: sanitizedAnswers,
      currentQuestionIndex: questionCount - 1,
      lead: normalizedLead,
      result: savedState.result,
      screen: "result",
    };
  }

  if (savedState.screen === "lead" && savedState.result && hasCompleteAnswers) {
    return {
      answers: sanitizedAnswers,
      currentQuestionIndex: questionCount - 1,
      lead: normalizedLead,
      result: savedState.result,
      screen: "lead",
    };
  }

  if (savedState.screen === "resultPreview" && savedState.result && hasCompleteAnswers) {
    return {
      answers: sanitizedAnswers,
      currentQuestionIndex: questionCount - 1,
      lead: normalizedLead,
      result: savedState.result,
      screen: "resultPreview",
    };
  }

  if (savedState.screen === "quiz" && Object.keys(sanitizedAnswers).length > 0) {
    return {
      answers: sanitizedAnswers,
      currentQuestionIndex: boundedIndex,
      lead: normalizedLead,
      result: null,
      screen: "quiz",
    };
  }

  if (savedState.screen === "intro") {
    return {
      ...DEFAULT_FLOW_STATE,
      screen: "intro",
    };
  }

  return DEFAULT_FLOW_STATE;
}


function buildAnswerPayload(answers) {
  return Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
}


function PublicApp() {
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

        setErrorMessage("Não consegui carregar o teste agora. Tente novamente dentro de instantes.");
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
        screen: "intro",
      });
    });
  }

  async function handleLeadSubmit(lead) {
    setErrorMessage("");
    setIsSavingLead(true);

    try {
      const answers = buildAnswerPayload(flowState.answers);
      const response = await submitSubmission(
        {
          ...lead,
          answers,
          source: "quiz-dashboard-flow",
        },
        config,
      );
      const persistedLead = normalizeLead(response.submission) || normalizeLead(lead);

      startTransition(() => {
        setFlowState((currentState) => ({
          ...currentState,
          lead: persistedLead,
          screen: "result",
        }));
      });
    } catch (error) {
      setErrorMessage(error.message || "Não consegui salvar seus dados agora. Tente novamente.");
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

  function handleUnlockResult() {
    setErrorMessage("");
    startTransition(() => {
      setFlowState((currentState) => ({
        ...currentState,
        screen: "lead",
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
        setFlowState((currentState) => ({
          answers: nextAnswers,
          currentQuestionIndex: config.questions.length - 1,
          lead: currentState.lead,
          result,
          screen: currentState.lead ? "result" : "resultPreview",
        }));
      });
    } catch (error) {
      setErrorMessage("Não consegui calcular o resultado agora. Tente novamente em alguns segundos.");
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

      {flowState.screen === "resultPreview" && flowState.result ? (
        <ResultPreviewPage
          onContinue={handleUnlockResult}
          result={flowState.result}
        />
      ) : null}

      {flowState.screen === "lead" && flowState.result ? (
        <LeadCapturePage
          errorMessage={errorMessage}
          initialLead={flowState.lead}
          isSubmitting={isSavingLead}
          screens={config.screens}
          onSubmit={handleLeadSubmit}
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


function App() {
  const [route, setRoute] = useState(resolveAppRoute);

  useEffect(() => {
    function handlePopState() {
      setRoute(resolveAppRoute());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (route === "dashboard") {
    return <DashboardPage />;
  }

  return <PublicApp />;
}


export default App;
