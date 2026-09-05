import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { ThemeProvider, ToastProvider } from './design-system';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider defaultTheme="light">
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
