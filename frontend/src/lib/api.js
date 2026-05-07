import fallbackQuizConfig from "../../../conteudo/quiz-config.json";

import { calculateQuizResult } from "./scoring";


const IS_STATIC_DEPLOY = import.meta.env.VITE_STATIC_DEPLOY === "true";


async function parseJsonResponse(response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}


async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });

  return parseJsonResponse(response);
}


export async function fetchQuizConfig() {
  if (IS_STATIC_DEPLOY) {
    return fallbackQuizConfig;
  }

  try {
    return await fetchJson("/api/quiz/", {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    return fallbackQuizConfig;
  }
}


export async function submitQuizAnswers(answers, config = fallbackQuizConfig) {
  if (IS_STATIC_DEPLOY) {
    return calculateQuizResult(config, answers);
  }

  try {
    return await fetchJson("/api/quiz/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ answers }),
    });
  } catch (error) {
    return calculateQuizResult(config, answers);
  }
}


export async function submitSubmission(submissionPayload, config = fallbackQuizConfig) {
  if (IS_STATIC_DEPLOY) {
    return {
      status: "stored-locally",
      submission: {
        ...submissionPayload,
        result: calculateQuizResult(config, submissionPayload.answers),
        createdAtUtc: new Date().toISOString(),
      },
    };
  }

  return fetchJson("/api/submissions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(submissionPayload),
  });
}


export function fetchAdminSession() {
  return fetchJson("/api/admin/session", {
    headers: {
      Accept: "application/json",
    },
  });
}


export function createAdminSession(email, password) {
  return fetchJson("/api/admin/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}


export function deleteAdminSession() {
  return fetchJson("/api/admin/session", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });
}


export function fetchDashboardData() {
  return fetchJson("/api/admin/dashboard", {
    headers: {
      Accept: "application/json",
    },
  });
}


export function fetchDashboardSubmissions({ query = "", legacy = "all" } = {}) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("query", query.trim());
  }

  if (legacy && legacy !== "all") {
    params.set("legacy", legacy);
  }

  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : "";

  return fetchJson(`/api/admin/submissions${suffix}`, {
    headers: {
      Accept: "application/json",
    },
  });
}


export function fetchSubmissionDetail(submissionId) {
  return fetchJson(`/api/admin/submissions/${submissionId}`, {
    headers: {
      Accept: "application/json",
    },
  });
}
