import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { WorkspaceProvider } from './features/progress/WorkspaceProvider.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter><WorkspaceProvider><App /></WorkspaceProvider></BrowserRouter>
  </React.StrictMode>,
);
