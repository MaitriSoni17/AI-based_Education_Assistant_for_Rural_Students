import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up system credentials/auth tokens from the visible URL bar once loaded
if (typeof window !== 'undefined' && window.location.search) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('__aistudio_auth_token')) {
      url.searchParams.delete('__aistudio_auth_token');
      const cleanSearch = url.searchParams.toString();
      const newUrl = url.pathname + (cleanSearch ? `?${cleanSearch}` : '') + url.hash;
      window.history.replaceState({}, '', newUrl);
    }
  } catch (err) {
    console.warn('[URL Cleaner] Bypassed cleaning query parameters:', err);
  }
}

// Register offline-ready Service Worker securely on launch
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Service Worker] Registration bypassed or limited inside environment sandbox:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
