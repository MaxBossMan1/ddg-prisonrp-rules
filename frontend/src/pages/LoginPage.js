import React from 'react';
import styled from 'styled-components';
import { BASE_URL } from '../utils/apiConfig';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1d23 0%, #2c3e50 50%, #1a1d23 100%);
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: linear-gradient(135deg, #34495e 0%, #3d566e 100%);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(103, 123, 174, 0.3);
  text-align: center;
  max-width: 500px;
  width: 100%;
`;

const Title = styled.h1`
  color: #ecf0f1;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #e9ecef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #bdc3c7;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const DiscordButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #5865F2;
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    background: #4752C4;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const DiscordIcon = styled.div`
  width: 24px;
  height: 24px;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwLjMxNyA0LjM2OTU3QzE4Ljc4NzMgMy42MTk0IDE3LjE0NzUgMy4wODA1IDE1LjQzNzggMi44MTQ1NkMxNS4yMTc5IDMuMjM5MzYgMTQuOTY1NSAzLjc3OTM0IDE0Ljc5MDggNC4yMDE0NkMxMy4wMDMgMy45NzE5MyAxMS4yNDA5IDMuOTcxOTMgOS40ODEgNC4yMDE0NkM5LjMwNzI2IDMuNzc5MzQgOS4wNDgxNCAzLjIzOTM2IDguODI2NDQgMi44MTQ1NkM3LjExNjMyIDMuMDgwNSA1LjQ3NjE5IDMuNjE5NCA0Ljk0NTI4IDQuMzY5NTdDMS41ODQwNiA5LjAzOTQ1IDAuNjczNzQ0IDEzLjU4OTcgMS4xMzkwNSAxOC4wNzQ2QzMuMTc3MDcgMTkuNjE1OSA1LjEzNTg5IDIwLjU3MzUgNy4wNTQxOSAyMS4xMjdDNy41NzU4NCAyMC40ODY5IDguMDQxNDUgMTkuNzk4MSA4LjQ0NzA2IDE5LjA2OTZDOS44ODYzMyAxOS4xNDAyIDExLjM0OTEgMTkuMTQwMiAxMi44MTA5IDE5LjA2OTZDOC40NDcwNiAxOS43OTgxIDguOTEyNjYgMjAuNDg2OSA5LjQzNDMxIDIxLjEyN0M5LjU1MjU4IDIwLjU3MzUgOS42ODMzNyAxOS42MTU5IDEwLjY5MTQgMTguMDc0NkMxMS4xNTY3IDEzLjU4OTcgMTAuMjQ2NCA5LjAzOTQ1IDcuODg1MTUgNC4zNjk1N1YuMDEyNDE5MDY1OTU4IDE5IDQuNjIxMTUgMTMuNzUgNS4yNjMzOUMxMy43NSA1LjkwNTM0IDEzLjQwOSA2LjUgMTIuNzUgNi41UzExLjc1IDUuOTA1MzQgMTEuNzUgNS4yNjMzOVptNS41IDBDMTguMjUgNC42MjExNSAxNy45MDkgNC4wMjYzOSAxNy4yNSA0LjAyNjM5UzE2LjI1IDQuNjIxMTUgMTYuMjUgNS4yNjMzOUMxNi4yNSA1LjkwNTM0IDE2LjU5MSA2LjUgMTcuMjUgNi41UzE4LjI1IDUuOTA1MzQgMTguMjUgNS4yNjMzOVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=') center/contain no-repeat;
`;

const Info = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(52, 73, 94, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(103, 123, 174, 0.2);
`;

const InfoText = styled.p`
  color: #8a9dc9;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

function LoginPage() {
  const loginUrl = `${BASE_URL}/auth/discord`;
  
  return (
    <LoginContainer>
      <LoginCard>
        <Title>Staff Login</Title>
        <Subtitle>
          Access the DigitalDeltaGaming PrisonRP Rules Management System
        </Subtitle>
        
        <DiscordButton href={loginUrl}>
          <DiscordIcon />
          Login with Discord
        </DiscordButton>
        
        <Info>
          <InfoText>
            <strong>Staff Access Only</strong><br />
            You must be authorized by an administrator to access this system.
            Contact your server administrators if you need access.
          </InfoText>
        </Info>
      </LoginCard>
    </LoginContainer>
  );
}

export default LoginPage; 