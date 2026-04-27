export function AnswerButton({ disabled, isSelected = false, label, value, onClick }) {
  return (
    <button
      aria-pressed={isSelected}
      className="answer-button"
      data-selected={isSelected}
      disabled={disabled}
      onClick={() => onClick(value)}
      type="button"
    >
      <span className="answer-title">{label}</span>
    </button>
  );
}
