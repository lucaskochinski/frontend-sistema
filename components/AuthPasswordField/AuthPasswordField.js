"use client";

import { useId, useState } from "react";
import { OctoEyeOpen, OctoEyeShut } from "@/components/OctopusEyeIcons/OctopusEyeIcons";
import styles from "./AuthPasswordField.module.css";

export default function AuthPasswordField({
  label,
  value,
  onChange,
  name,
  autoComplete,
  placeholder,
  required = true,
}) {
  const baseId = useId();
  const inputId = `${baseId}-pwd`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrap}>
      <label className={styles.labelText} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          id={inputId}
          className={styles.input}
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <OctoEyeOpen /> : <OctoEyeShut />}
        </button>
      </div>
    </div>
  );
}
