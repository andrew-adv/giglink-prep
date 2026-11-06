import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { WorkspaceProvider } from './features/progress/WorkspaceProvider.jsx';
import { ThemeProvider } from './features/theme/ThemeProvider.jsx';
import { initializeTheme } from './features/theme/theme.js';
import './styles/global.css';

initializeTheme(document, window);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter><ThemeProvider><WorkspaceProvider><App /></WorkspaceProvider></ThemeProvider></BrowserRouter>
  </React.StrictMode>,
);
