import * as React from "react"
type FormFieldProps = {
  name: string
  onChange: (val: string) => void
  value: string
}

export const ShortString = ({name, value, onChange}: FormFieldProps) => {
  return <>
    <label>{name}:</label>
    <input value={value} onChange={(e) => onChange(e.target.value)}/>
  </>
}

type ChoiceProps = FormFieldProps & {
  choices: string[]
}

export const Choice = ({name, value, onChange, choices}: ChoiceProps) => {
  return <>
    <label>{name}:</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {choices.map((c, i) => <option key={i} value={c}>{c}</option>)}
    </select>
  </>
}
