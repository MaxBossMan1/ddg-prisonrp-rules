import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
`;

const ErrorCode = styled.div`
  font-size: 8rem;
  font-weight: 700;
  color: #677bae;
  line-height: 1;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #ecf0f1;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: #bdc3c7;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #677bae;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #8a9dc9;
    text-decoration: none;
    color: white;
  }
`;

const SuggestionList = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  text-align: left;
`;

const SuggestionTitle = styled.h3`
  color: #ecf0f1;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const SuggestionLink = styled(Link)`
  display: block;
  color: #677bae;
  text-decoration: none;
  padding: 0.5rem 0;
  border-bottom: 1px solid #2c3e50;
  transition: color 0.2s;
  
  &:hover {
    color: #8a9dc9;
    text-decoration: underline;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

function NotFoundPage() {
  return (
    <Container>
      <ErrorCode>404</ErrorCode>
      <ErrorTitle>Page Not Found</ErrorTitle>
      <ErrorMessage>
        The page you're looking for doesn't exist or may have been moved.
        <br />
        Let's get you back to the rules and guidelines.
      </ErrorMessage>
      
      <BackButton to="/">
        ← Return to Home
      </BackButton>
      
      <SuggestionList>
        <SuggestionTitle>Quick Links:</SuggestionTitle>
        <SuggestionLink to="/rules/a">Section A: General Server Rules</SuggestionLink>
        <SuggestionLink to="/rules/b">Section B: PrisonRP Specific Rules</SuggestionLink>
        <SuggestionLink to="/rules/c">Section C: Guard Guidelines</SuggestionLink>
        <SuggestionLink to="/rules/d">Section D: Prisoner Guidelines</SuggestionLink>
      </SuggestionList>
    </Container>
  );
}

export default NotFoundPage; 