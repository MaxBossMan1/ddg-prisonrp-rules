import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import HomePage from './pages/HomePage';
import RulePage from './pages/RulePage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1d23;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: #e9ecef;
`;

const Header = styled.header`
  text-align: center;
  padding: 2rem 1rem 1rem 1rem;
  background-color: #2c3e50;
  border-bottom: 1px solid #34495e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: #ecf0f1;
  margin: 0;
  letter-spacing: -0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #bdc3c7;
  margin: 0.5rem 0 0 0;
  font-weight: 400;
`;

function App() {
  return (
    <AppContainer>
      <Router>
        <Header>
          <Title>DigitalDeltaGaming PrisonRP</Title>
          <Subtitle>Server Rules & Guidelines</Subtitle>
        </Header>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rules/:category" element={<RulePage />} />
          <Route path="/rules/:category/:rule" element={<RulePage />} />
          <Route path="/rules/:category/:rule/:subrule" element={<RulePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AppContainer>
  );
}

export default App;
