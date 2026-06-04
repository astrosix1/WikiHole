import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import WikiHole from './WikiHole.jsx';
import { AccessGate } from './AccessGate.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

// localStorage polyfill for window.storage (Claude artifact API)
window.storage = {
  async set(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  },
  async get(key) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? { value: v } : null;
    } catch { return null; }
  },
  async list(prefix) {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      return { keys };
    } catch { return { keys: [] }; }
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AccessGate>
        <WikiHole />
      </AccessGate>
    </ErrorBoundary>
  </StrictMode>
);
