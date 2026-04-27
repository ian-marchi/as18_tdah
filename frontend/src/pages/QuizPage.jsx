import { AnswerButton } from "../components/AnswerButton";
import { ProgressBar } from "../components/ProgressBar";
import { ScreenFrame } from "../components/ScreenFrame";


export function QuizPage({
  area,
  current,
  errorMessage,
  isSubmitting,
  options,
  question,
  total,
  onAnswer,
}) {
  return (
    <ScreenFrame
      eyebrow={`Pergunta ${current} de ${total}`}
      subtitle={area ? area.description : ""}
      title={question.text}
      tone="soft"
    >
      <ProgressBar current={current} total={total} />

      <div className="question-meta">
        <span className="question-area-tag">{area?.label}</span>
        <p>Escolha a opcao que mais parece com a sua experiencia real.</p>
      </div>

      <div className="answers-grid">
        {options.map((option) => (
          <AnswerButton
            disabled={isSubmitting}
            key={option.label}
            label={option.label}
            value={option.value}
            onClick={onAnswer}
          />
        ))}
      </div>

      <div className="quiz-footer-note">
        {isSubmitting ? "Calculando seu resultado..." : "Seu teste avanca automaticamente a cada resposta."}
      </div>

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
    </ScreenFrame>
  );
}

