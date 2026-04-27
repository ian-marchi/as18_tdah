import fallbackQuizConfig from "../../../conteudo/quiz-config.json";

import { calculateQuizResult } from "./scoring";

const IS_STATIC_DEPLOY = import.meta.env.VITE_STATIC_DEPLOY === "true";


async function parseJsonResponse(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}


export async function fetchQuizConfig() {
  if (IS_STATIC_DEPLOY) {
    return fallbackQuizConfig;
  }

  try {
    const response = await fetch("/api/quiz/", {
      headers: {
        Accept: "application/json",
      },
    });

    return await parseJsonResponse(response);
  } catch (error) {
    return fallbackQuizConfig;
  }
}


export async function submitLeadForm(lead) {
  if (IS_STATIC_DEPLOY) {
    return {
      status: "stored-locally",
      lead: {
        ...lead,
        submittedAtUtc: new Date().toISOString(),
      },
    };
  }

  try {
    const response = await fetch("/api/leads/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(lead),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    return {
      status: "stored-locally",
      lead: {
        ...lead,
        submittedAtUtc: new Date().toISOString(),
      },
    };
  }
}


export async function submitQuizAnswers(answers, config = fallbackQuizConfig) {
  if (IS_STATIC_DEPLOY) {
    return calculateQuizResult(config, answers);
  }

  try {
    const response = await fetch("/api/quiz/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ answers }),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    return calculateQuizResult(config, answers);
  }
}
