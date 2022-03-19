import * as React from "react"
import { FormField } from '../test';
import {
  Choice,
  ShortString
} from './FormPrimitives';

type FormProps = {
  name: string
  fields: {[key:string]: FormField}
}

export const Form = ({name, fields}: FormProps) => {
  const [state, setState] = React.useState<{[key: string]: string}>({});

  const updaterFactory = (fieldName: string) => (newVal: string) => setState({
    ...state,
    [fieldName]: newVal
  });

  const fieldElements = Object.entries(fields).map(([name, val]) => {
    switch (val._formField_Type) {
      case 'shortString':
        return <ShortString
          name={name}
          value={state[name]}
          onChange={updaterFactory(name)}/>
      case 'choice':
        return <Choice
          name={name}
          value={state[name]}
          onChange={updaterFactory(name)}
          choices={val.choices}/>
    }
  }).map((e, i) => <div key={i}>{e}</div>)

  const submit = () => {
    fetch(name, {
      method: "POST",
      headers: [['Content-Type', 'application/json']],
      body: JSON.stringify(state)
    })
  }

  return <>
    {fieldElements}
    <button onClick={submit}>Submit</button>
  </>
}
