import React from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import App from '@/App';
import '@/index.css';

// PWA update flow — deliberately NOT auto-updating (registerType: 'prompt'
// in vite.config.js). A new service worker installs in the background and
// waits; the person sees a dismissible toast and the update only applies
// when they explicitly confirm, which then reloads the page. This matters
// here specifically because someone could be mid-way through reading a
// report — code shouldn't silently swap underneath them. Every new
// deployment produces new content-hashed asset filenames, so update
// detection is automatic and correct on every deploy.
const updateSW = registerSW({
  onNeedRefresh() {
    toast('يتوفر تحديث جديد للوحة التحكم', {
      id: 'pwa-update-available',
      duration: Infinity,
      action: { label: 'تحديث الآن', onClick: () => updateSW(true) },
      cancel: { label: 'لاحقاً', onClick: () => {} },
    });
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);
