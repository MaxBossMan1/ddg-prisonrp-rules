import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.$compact ? '1rem' : '3rem'};
  min-height: ${props => props.$fullHeight ? '200px' : 'auto'};
`;

const Spinner = styled.div`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border: 3px solid #34495e;
  border-top: 3px solid #677bae;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: ${props => props.$compact ? '0.5rem' : '1rem'};
`;

const LoadingText = styled.div`
  color: #bdc3c7;
  font-size: ${props => props.$compact ? '0.9rem' : '1rem'};
  animation: ${pulse} 1.5s ease-in-out infinite;
  text-align: center;
`;

const LoadingSpinner = ({ 
  text = "Loading...", 
  size = "40px", 
  compact = false, 
  fullHeight = false 
}) => {
  return (
    <LoadingContainer $compact={compact} $fullHeight={fullHeight}>
      <Spinner $size={size} $compact={compact} />
      {text && <LoadingText $compact={compact}>{text}</LoadingText>}
    </LoadingContainer>
  );
};

export default LoadingSpinner; 