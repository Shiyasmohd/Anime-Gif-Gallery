import './App.css';
import MainPage from './MainPage'
import { HashRouter as Router, Routes, Route } from 'react-router-dom';



const App = () => {
  return (
    <Router>
          <MainPage/>
      </Router>
  );
};

export default App;
