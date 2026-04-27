export function AnswerButton({ disabled, label, value, onClick }) {
  return (
    <button
      className="answer-button"
      disabled={disabled}
      onClick={() => onClick(value)}
      type="button"
    >
      <span className="answer-title">{label}</span>
      <span className="answer-value">{value} pts</span>
    </button>
  );
}

