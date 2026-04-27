const STORAGE_KEY = "tdah-feminino-quiz:v1";


export function loadQuizState() {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}


export function saveQuizState(state) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
        lead: state.lead,
        result: state.result,
        screen: state.screen,
      }),
    );
  } catch (error) {
    // Ignore storage failures to keep the quiz usable in private mode.
  }
}


export function clearQuizState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage failures to keep the quiz usable in private mode.
  }
}
