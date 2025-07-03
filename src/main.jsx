// src/main.jsx

// Global error logging
window.onerror = function (message, source, lineno, colno, error) {
  console.error("🌍 Global error caught:", { message, source, lineno, colno, error });
};

window.addEventListener('unhandledrejection', function (event) {
  console.error("🚨 Unhandled promise rejection:", event.reason);
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import './polotno.css'; // ✅ Use local copy of Polotno CSS
import App from './App.jsx';

// ✅ Mount app
const container =
  document.getElementById('polotno-app-container') ||
  document.getElementById('root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('❌ No container found to mount Polotno app.');
}

// ✅ Toolbar formatting fix
const toolbarFix = new MutationObserver(() => {
  const outer = document.querySelector('.polotno-toolbar.bp5-navbar');
  const inner = outer?.querySelector('.bp5-navbar.polotno-toolbar');

  if (outer && inner) {
    Object.assign(outer.style, {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      padding: '6px',
      backgroundColor: '#f9f9f9',
      borderBottom: '1px solid #ccc',
    });

    const groups = inner.querySelectorAll('.bp5-navbar-group');
    groups.forEach((group) => {
      Object.assign(group.style, {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'nowrap',
      });
    });

    toolbarFix.disconnect();
  }
});

toolbarFix.observe(document.body, { childList: true, subtree: true });