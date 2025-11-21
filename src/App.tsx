
import React from 'react';
import { Provider } from 'react-redux';
import { Dashboard } from './pages/Dashboard';
import './styles/globals.scss';
import { store } from './store/store';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  );
};

export default App;