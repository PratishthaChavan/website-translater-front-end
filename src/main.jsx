import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>

)
