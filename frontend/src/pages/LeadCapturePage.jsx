import { useEffect, useState } from "react";

import { ScreenFrame } from "../components/ScreenFrame";


const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
};


function validateLead(formData) {
  const errors = {};
  const phoneDigits = formData.phone.replace(/\D/g, "");

  if (formData.name.trim().length < 2) {
    errors.name = "Digite seu nome para continuar.";
  }

  if (phoneDigits.length < 10) {
    errors.phone = "Digite um telefone válido com DDD.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = "Digite um e-mail válido.";
  }

  return errors;
}


export function LeadCapturePage({
  errorMessage,
  initialLead,
  isSubmitting,
  screens,
  onSubmit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setFormData({
      name: initialLead?.name || "",
      phone: initialLead?.phone || "",
      email: initialLead?.email || "",
    });
  }, [initialLead]);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setFormData((currentState) => ({
      ...currentState,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateLead(formData);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    onSubmit({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
    });
  }

  const leadScreen = screens.leadCapture;

  return (
    <ScreenFrame
      eyebrow={leadScreen.eyebrow}
      subtitle={leadScreen.body}
      title={leadScreen.title}
      tone="warm"
    >
      <form className="lead-form" onSubmit={handleSubmit}>
        <label className="field-stack" htmlFor="name">
          <span>{leadScreen.fields.name.label}</span>
          <input
            autoComplete="name"
            className={`text-input ${fieldErrors.name ? "text-input-error" : ""}`}
            id="name"
            name="name"
            onChange={handleFieldChange}
            placeholder={leadScreen.fields.name.placeholder}
            type="text"
            value={formData.name}
          />
          {fieldErrors.name ? <small className="field-error">{fieldErrors.name}</small> : null}
        </label>

        <label className="field-stack" htmlFor="phone">
          <span>{leadScreen.fields.phone.label}</span>
          <input
            autoComplete="tel"
            className={`text-input ${fieldErrors.phone ? "text-input-error" : ""}`}
            id="phone"
            name="phone"
            onChange={handleFieldChange}
            placeholder={leadScreen.fields.phone.placeholder}
            type="tel"
            value={formData.phone}
          />
          {fieldErrors.phone ? <small className="field-error">{fieldErrors.phone}</small> : null}
        </label>

        <label className="field-stack" htmlFor="email">
          <span>{leadScreen.fields.email.label}</span>
          <input
            autoComplete="email"
            className={`text-input ${fieldErrors.email ? "text-input-error" : ""}`}
            id="email"
            name="email"
            onChange={handleFieldChange}
            placeholder={leadScreen.fields.email.placeholder}
            type="email"
            value={formData.email}
          />
          {fieldErrors.email ? <small className="field-error">{fieldErrors.email}</small> : null}
        </label>

        <p className="privacy-note">{leadScreen.privacyNote}</p>

        <button className="primary-button lead-submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando..." : leadScreen.cta}
        </button>
      </form>

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
    </ScreenFrame>
  );
}
