import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import HomePage from './pages/HomePage';
import RulePage from './pages/RulePage';
import StaffDashboard from './pages/StaffDashboard';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import { PageTransition } from './components/PageTransition';
import './App.css';

// Background animation keyframes
const backgroundPattern = keyframes`
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
`;

const floatingParticles = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
`;

const headerGlow = keyframes`
  0%, 100% {
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(103, 123, 174, 0.1);
  }
  50% {
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 0 40px rgba(103, 123, 174, 0.2);
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: 
    radial-gradient(circle at 20% 80%, rgba(103, 123, 174, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(138, 157, 201, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(52, 73, 94, 0.2) 0%, transparent 50%),
    linear-gradient(135deg, #1a1d23 0%, #2c3e50 50%, #1a1d23 100%);
  background-size: 200% 200%, 200% 200%, 200% 200%, 100% 100%;
  animation: ${backgroundPattern} 20s ease-in-out infinite;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: #e9ecef;
  overflow-x: hidden;
  position: relative;
  
  /* Subtle pattern overlay */
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
    opacity: 0.3;
  }
  
  /* Floating particles */
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(103, 123, 174, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 80%, rgba(138, 157, 201, 0.08) 1px, transparent 1px),
      radial-gradient(circle at 40% 40%, rgba(52, 73, 94, 0.1) 1px, transparent 1px);
    background-size: 50px 50px, 80px 80px, 120px 120px;
    animation: ${floatingParticles} 15s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
  }
`;

const Header = styled.header`
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
  background-size: 400% 400%;
  animation: ${backgroundPattern} 20s ease infinite;
  color: white;
  padding: 2rem 3rem 2rem 0;
  position: relative;
  overflow: hidden;
  border-bottom: 3px solid rgba(103, 123, 174, 0.5);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(103, 123, 174, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(67, 88, 158, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(103, 123, 174, 0.2) 0%, transparent 50%);
    animation: ${floatingParticles} 30s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
    animation: ${backgroundPattern} 40s linear infinite;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 3rem;
  
  @media (max-width: 768px) {
    padding: 0 2rem;
  }
`;

const LogoSection = styled.div`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  z-index: 3;
  padding-left: 1.5rem;
  
  @media (max-width: 768px) {
    padding-left: 1rem;
  }
`;

const Logo = styled.img`
  height: 60px;
  width: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const TitleSection = styled.div`
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #e9ecef 50%, #ffffff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(103, 123, 174, 0.8), transparent);
    border-radius: 2px;
  }
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const Subtitle = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 1.1rem;
  font-weight: 300;
  opacity: 0.9;
  letter-spacing: 0.5px;
`;

const StatusSection = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  z-index: 3;
  padding-right: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ServerStatus = styled.div`
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #fff;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MainContent = styled.main`
  position: relative;
  min-height: calc(100vh - 180px);
  z-index: 2;
`;

function App() {
  return (
    <ErrorBoundary>
      <AppContainer>
        <Router>
          <Routes>
            {/* Public routes with header */}
            <Route path="/" element={
              <>
                <Header>
                  <HeaderContent>
                    <LogoSection>
                      <Logo src="/ddg-logo.png" alt="DigitalDeltaGaming Logo" />
                    </LogoSection>
                    <TitleSection>
                      <Title>DigitalDeltaGaming PrisonRP</Title>
                      <Subtitle>Server Rules & Guidelines</Subtitle>
                    </TitleSection>
                    <StatusSection>
                      <ServerStatus>
                        Server Online
                      </ServerStatus>
                    </StatusSection>
                  </HeaderContent>
                </Header>
                <MainContent>
                  <ErrorBoundary>
                    <PageTransition>
                      <HomePage />
                    </PageTransition>
                  </ErrorBoundary>
                </MainContent>
                <Footer />
              </>
            } />
            <Route path="/rules/:category" element={
              <>
                <Header>
                  <HeaderContent>
                    <LogoSection>
                      <Logo src="/ddg-logo.png" alt="DigitalDeltaGaming Logo" />
                    </LogoSection>
                    <TitleSection>
                      <Title>DigitalDeltaGaming PrisonRP</Title>
                      <Subtitle>Server Rules & Guidelines</Subtitle>
                    </TitleSection>
                    <StatusSection>
                      <ServerStatus>
                        Server Online
                      </ServerStatus>
                    </StatusSection>
                  </HeaderContent>
                </Header>
                <MainContent>
                  <ErrorBoundary>
                    <PageTransition>
                      <RulePage />
                    </PageTransition>
                  </ErrorBoundary>
                </MainContent>
                <Footer />
              </>
            } />
            <Route path="/rules/:category/:rule" element={
              <>
                <Header>
                  <HeaderContent>
                    <LogoSection>
                      <Logo src="/ddg-logo.png" alt="DigitalDeltaGaming Logo" />
                    </LogoSection>
                    <TitleSection>
                      <Title>DigitalDeltaGaming PrisonRP</Title>
                      <Subtitle>Server Rules & Guidelines</Subtitle>
                    </TitleSection>
                    <StatusSection>
                      <ServerStatus>
                        Server Online
                      </ServerStatus>
                    </StatusSection>
                  </HeaderContent>
                </Header>
                <MainContent>
                  <ErrorBoundary>
                    <PageTransition>
                      <RulePage />
                    </PageTransition>
                  </ErrorBoundary>
                </MainContent>
                <Footer />
              </>
            } />
            <Route path="/rules/:category/:rule/:subrule" element={
              <>
                <Header>
                  <HeaderContent>
                    <LogoSection>
                      <Logo src="/ddg-logo.png" alt="DigitalDeltaGaming Logo" />
                    </LogoSection>
                    <TitleSection>
                      <Title>DigitalDeltaGaming PrisonRP</Title>
                      <Subtitle>Server Rules & Guidelines</Subtitle>
                    </TitleSection>
                    <StatusSection>
                      <ServerStatus>
                        Server Online
                      </ServerStatus>
                    </StatusSection>
                  </HeaderContent>
                </Header>
                <MainContent>
                  <ErrorBoundary>
                    <PageTransition>
                      <RulePage />
                    </PageTransition>
                  </ErrorBoundary>
                </MainContent>
                <Footer />
              </>
            } />
            
            {/* Staff dashboard route (no public header or footer) */}
            <Route path="/staff/*" element={
              <ErrorBoundary>
                <StaffDashboard />
              </ErrorBoundary>
            } />
            
            {/* 404 fallback */}
            <Route path="*" element={
              <>
                <Header>
                  <HeaderContent>
                    <LogoSection>
                      <Logo src="/ddg-logo.png" alt="DigitalDeltaGaming Logo" />
                    </LogoSection>
                    <TitleSection>
                      <Title>DigitalDeltaGaming PrisonRP</Title>
                      <Subtitle>Server Rules & Guidelines</Subtitle>
                    </TitleSection>
                    <StatusSection>
                      <ServerStatus>
                        Server Online
                      </ServerStatus>
                    </StatusSection>
                  </HeaderContent>
                </Header>
                <MainContent>
                  <ErrorBoundary>
                    <PageTransition>
                      <NotFoundPage />
                    </PageTransition>
                  </ErrorBoundary>
                </MainContent>
                <Footer />
              </>
            } />
          </Routes>
        </Router>
      </AppContainer>
    </ErrorBoundary>
  );
}

export default App;
