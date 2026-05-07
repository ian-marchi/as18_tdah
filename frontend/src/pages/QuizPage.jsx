import { AnswerButton } from "../components/AnswerButton";
import { ProgressBar } from "../components/ProgressBar";
import { ScreenFrame } from "../components/ScreenFrame";


export function QuizPage({
  answers,
  area,
  current,
  errorMessage,
  isSubmitting,
  options,
  onBack,
  question,
  total,
  onAnswer,
}) {
  return (
    <ScreenFrame
      cardClassName="quiz-screen"
      eyebrow={`Pergunta ${current} de ${total}`}
      subtitle={question.supportText || area?.description || ""}
      title={question.text}
      tone="soft"
    >
      <ProgressBar current={current} total={total} />

      <div className="question-meta">
        <span className="question-area-tag">{area?.label}</span>
        <p>Escolha a opção que mais parece com a sua experiência real.</p>
      </div>

      <div className="answers-grid">
        {options.map((option) => (
          <AnswerButton
            disabled={isSubmitting}
            isSelected={answers?.[question.id] === option.value}
            key={option.label}
            label={option.label}
            value={option.value}
            onClick={onAnswer}
          />
        ))}
      </div>

      <div className="quiz-footer-note">
        {isSubmitting
          ? "Calculando seu resultado..."
          : "O teste avança automaticamente, mas você pode voltar para revisar a resposta anterior."}
      </div>

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

      {current > 1 ? (
        <div className="quiz-navigation">
          <button className="ghost-button" disabled={isSubmitting} onClick={onBack} type="button">
            Voltar
          </button>
        </div>
      ) : null}
    </ScreenFrame>
  );
}
