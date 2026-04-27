function normalizeAnswers(rawAnswers) {
  return Object.fromEntries(
    rawAnswers.map((answer) => [answer.questionId || answer.question_id, answer.value]),
  );
}


function getActiveBand(resultBands, percentageTotal) {
  return (
    resultBands.find(
      (band) => percentageTotal >= band.min && percentageTotal <= band.max,
    ) || resultBands[resultBands.length - 1]
  );
}


export function calculateQuizResult(config, rawAnswers) {
  const answers = normalizeAnswers(rawAnswers);
  const maxScaleValue = Math.max(...config.scale.map((option) => option.value));
  const scoreTotal = config.questions.reduce(
    (total, question) => total + (answers[question.id] ?? 0),
    0,
  );
  const scoreMax = config.questions.length * maxScaleValue;
  const percentageTotal = Math.round((scoreTotal / scoreMax) * 100);

  const areas = config.areas.map((area) => {
    const scopedQuestions = config.questions.filter((question) => question.area === area.key);
    const score = scopedQuestions.reduce(
      (total, question) => total + (answers[question.id] ?? 0),
      0,
    );
    const scopedMax = scopedQuestions.length * maxScaleValue;

    return {
      key: area.key,
      label: area.label,
      description: area.description,
      score,
      scoreMax: scopedMax,
      percentage: Math.round((score / scopedMax) * 100),
    };
  });

  return {
    answeredCount: rawAnswers.length,
    areas,
    cta: config.cta,
    percentageTotal,
    questionCount: config.questions.length,
    resultBand: getActiveBand(config.resultBands, percentageTotal),
    scoreMax,
    scoreTotal,
    supportingCopy: config.supportingCopy,
  };
}

