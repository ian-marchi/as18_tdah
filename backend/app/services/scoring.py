from collections import defaultdict


class QuizValidationError(ValueError):
    """Raised when the submitted answers are invalid for the configured quiz."""


def normalize_answers(raw_answers: list[dict] | None) -> dict[str, int]:
    if not isinstance(raw_answers, list) or not raw_answers:
        raise QuizValidationError("Envie a lista completa de respostas em 'answers'.")

    normalized: dict[str, int] = {}

    for entry in raw_answers:
        if not isinstance(entry, dict):
            raise QuizValidationError("Cada resposta precisa ser um objeto.")

        question_id = entry.get("questionId") or entry.get("question_id")
        value = entry.get("value")

        if not question_id or not isinstance(question_id, str):
            raise QuizValidationError("Cada resposta precisa ter um questionId válido.")

        if not isinstance(value, int):
            raise QuizValidationError("Cada resposta precisa ter um value numérico inteiro.")

        if question_id in normalized:
            raise QuizValidationError(f"Resposta duplicada para a pergunta '{question_id}'.")

        normalized[question_id] = value

    return normalized


def get_active_band(bands: list[dict], percentage: int) -> dict:
    return next(
        (
            band
            for band in bands
            if band["min"] <= percentage <= band["max"]
        ),
        bands[-1],
    )


def calculate_result(config: dict, raw_answers: list[dict] | None) -> dict:
    answers = normalize_answers(raw_answers)

    questions = config["questions"]
    areas = config["areas"]
    result_bands = config["resultBands"]
    area_result_bands = config.get("areaResultBands", {})
    scale_values = {item["value"] for item in config["scale"]}
    max_scale_value = max(scale_values)

    question_lookup = {question["id"]: question for question in questions}
    expected_question_ids = set(question_lookup)
    submitted_question_ids = set(answers)

    unknown_questions = sorted(submitted_question_ids - expected_question_ids)
    if unknown_questions:
        raise QuizValidationError(
            f"Foram recebidas perguntas desconhecidas: {', '.join(unknown_questions)}."
        )

    missing_questions = sorted(expected_question_ids - submitted_question_ids)
    if missing_questions:
        raise QuizValidationError(
            f"O teste precisa ser respondido por completo. Faltam {len(missing_questions)} respostas."
        )

    invalid_values = sorted({value for value in answers.values() if value not in scale_values})
    if invalid_values:
        raise QuizValidationError(
            f"Foram recebidos valores de resposta inválidos: {', '.join(map(str, invalid_values))}."
        )

    score_total = sum(answers.values())
    score_max = len(questions) * max_scale_value
    percentage_total = round((score_total / score_max) * 100)

    area_questions: dict[str, list[dict]] = defaultdict(list)
    for question in questions:
        area_questions[question["area"]].append(question)

    area_results = []
    for area in areas:
        scoped_questions = area_questions[area["key"]]
        scoped_score = sum(answers[question["id"]] for question in scoped_questions)
        scoped_max = len(scoped_questions) * max_scale_value
        scoped_percentage = round((scoped_score / scoped_max) * 100) if scoped_max else 0
        scoped_bands = area_result_bands.get(area["key"], result_bands)
        active_area_band = get_active_band(scoped_bands, scoped_percentage)

        area_results.append(
            {
                "key": area["key"],
                "label": area["label"],
                "description": area["description"],
                "score": scoped_score,
                "scoreMax": scoped_max,
                "percentage": scoped_percentage,
                "bandKey": active_area_band["key"],
                "bandLabel": active_area_band.get("label", active_area_band["key"].title()),
                "insight": active_area_band.get("body", ""),
            }
        )

    active_band = get_active_band(result_bands, percentage_total)

    return {
        "scoreTotal": score_total,
        "scoreMax": score_max,
        "percentageTotal": percentage_total,
        "questionCount": len(questions),
        "answeredCount": len(answers),
        "resultBand": active_band,
        "areas": area_results,
        "supportingCopy": config["supportingCopy"],
        "cta": config["cta"],
    }
