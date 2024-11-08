import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router basename="/App-Guard-Control">  {/* Solo usa el nombre del repositorio */}
      <App />
    </Router>
  </StrictMode>,
);
