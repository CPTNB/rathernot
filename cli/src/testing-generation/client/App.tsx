import * as React from "react"
import * as ReactDOM from 'react-dom'
import { UserApplication } from '../../../../common/application';
import { Form } from './Form';

declare const UI: UserApplication

const Application = () => Object.entries(UI.forms).map(([name, form]) =>
  <Form name={name} fields={form.fields}/>);

ReactDOM.render(Application(), document.getElementById('root'));
