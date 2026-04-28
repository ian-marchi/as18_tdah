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
      <span aria-hidden="true" className="answer-leading-orbs">
        <span className="answer-orb answer-orb-solid" />
        <span className="answer-orb answer-orb-outline" />
      </span>

      <span className="answer-title">{label}</span>

      <span aria-hidden="true" className="answer-arrow">
        {"\u2192"}
      </span>
    </button>
  );
}
