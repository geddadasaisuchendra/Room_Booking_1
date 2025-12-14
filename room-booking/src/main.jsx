import React from 'react'
import { AuthProvider } from "./context/AuthContext";
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'

import './styles/global.css'
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)
