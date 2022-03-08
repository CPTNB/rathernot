import * as React from "react"
import ReactDOMServer from 'react-dom/server';
import { UserApplication } from './test';
import { FormField } from './test';

const Field = (name: string, val: FormField, i: number) => {
  return <div key={i}>
    {name},
    {val._formField_Type}
  </div>
}

const Application = (app: UserApplication) => {
  return <html>
    <head>
      <title>{app.title}</title>
    </head>
    <body>
      <script>{"var exports = {};"}</script>
      {Object.entries(app.fields).map(([name, val], i) => Field(name, val, i))}
      <script src="https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js"></script>
      <script src="./app.js"></script>
    </body>
  </html>
}

export const renderApplication = (app: UserApplication) =>
  ReactDOMServer.renderToString(Application(app));  
