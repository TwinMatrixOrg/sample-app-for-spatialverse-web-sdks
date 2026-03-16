/**
 * Main Entry Point
 * 
 * This is the entry point for the sample application.
 * Initializes React and renders the App component.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Import UI SDK styles
import '@twinmatrix/ui-sdk/styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
