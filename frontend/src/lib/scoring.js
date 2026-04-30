function normalizeAnswers(rawAnswers) {
  return Object.fromEntries(
    rawAnswers.map((answer) => [answer.questionId || answer.question_id, answer.value]),
  );
}


function getActiveBand(bands, percentage) {
  return (
    bands.find((band) => percentage >= band.min && percentage <= band.max) ||
    bands[bands.length - 1]
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
    const percentage = Math.round((score / scopedMax) * 100);
    const scopedBands = config.areaResultBands?.[area.key] || config.resultBands;
    const activeAreaBand = getActiveBand(scopedBands, percentage);

    return {
      key: area.key,
      label: area.label,
      description: area.description,
      score,
      scoreMax: scopedMax,
      percentage,
      bandKey: activeAreaBand.key,
      bandLabel: activeAreaBand.label || activeAreaBand.key,
      insight: activeAreaBand.body || "",
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
