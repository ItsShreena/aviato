import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeFetchInterceptor } from './utils/apiInterceptor';

// Initialize global fetch interceptor to catch any API 404s and 500s
initializeFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
