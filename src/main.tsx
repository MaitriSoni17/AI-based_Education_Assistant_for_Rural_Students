import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';

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
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const isDev = Boolean((import.meta as any).env?.DEV);
  if (isDev) {
    // In development mode, purge any registered service worker and stale browser caches
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          reg.update();
        })
        .catch((err) => {
          console.warn('[Service Worker] Registration bypassed or limited inside environment sandbox:', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
