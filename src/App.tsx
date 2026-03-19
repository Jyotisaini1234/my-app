import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './styles/globals.scss';
import { Router } from './Router/Router';
import { ToastProvider } from './context/ToastContext/Toastcontext';

const App: React.FC = () => (
  <Provider store={store}>
    <ToastProvider>
      <Router />
    </ToastProvider>
  </Provider>
);

export default App;