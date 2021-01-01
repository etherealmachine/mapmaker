import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import './index.css';
import App from './App';

Sentry.init({
  dsn: "https://d42a7c4cafcb47f5b298dbf6e44b1834@o486991.ingest.sentry.io/5545134",
  integrations: [
    new Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);