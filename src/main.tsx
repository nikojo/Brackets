import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import bpstore, { ParticipantStore } from './lib/BracketStore.ts'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ParticipantStore.Provider value={bpstore}>
      <App />
    </ParticipantStore.Provider>
  </React.StrictMode>,
)


/*
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ParticipantStore.Provider value={bpstore}>
    <App />
  </ParticipantStore.Provider>
);
*/
