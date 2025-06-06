import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import MDEditor from '@uiw/react-md-editor';
import { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { markdownToHtml } from '../utils/markdownUtils';
import { SketchPicker } from 'react-color';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';
import { apiService } from '../services/api';

// Dynamic API configuration - Auto-detect environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If we're running on localhost or 127.0.0.1, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If we're on the server IP or any other domain, use the same host with port 3001
  return `http://${hostname}:3001`;
};

const BASE_URL = getApiBaseUrl();

console.log('🔧 StaffDashboard API Configuration:', { 
  hostname: window.location.hostname,
  BASE_URL 
});

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1d23 0%, #2c3e50 50%, #34495e 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(103, 123, 174, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(138, 157, 201, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(103, 123, 174, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(103,123,174,0.03)"/><circle cx="75" cy="75" r="1" fill="rgba(138,157,201,0.02)"/><circle cx="50" cy="10" r="0.5" fill="rgba(103,123,174,0.02)"/><circle cx="10" cy="60" r="0.5" fill="rgba(138,157,201,0.03)"/><circle cx="90" cy="40" r="0.5" fill="rgba(103,123,174,0.02)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 50%, #34495e 100%);
  background-size: 200% 100%;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(103, 123, 174, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(103, 123, 174, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 40%, rgba(103, 123, 174, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  
  &:hover {
    background-position: right center;
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 6px 20px rgba(103, 123, 174, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const HeaderTitle = styled.h1`
  color: #ecf0f1;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 50%, #ecf0f1 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleShimmer 4s ease-in-out infinite alternate;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, #677bae 0%, #8a9dc9 100%);
    border-radius: 1px;
    opacity: 0.8;
  }
  
  @keyframes titleShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
`;

const UserInfo = styled.div`
  color: #bdc3c7;
  text-align: right;
`;

const UserName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  color: #ecf0f1;
`;

const UserRole = styled.div`
  font-size: 0.9rem;
  color: #677bae;
  text-transform: capitalize;
`;

const TabContainer = styled.div`
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 50%, #34495e 100%);
  background-size: 200% 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(103, 123, 174, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(103, 123, 174, 0.2);
  position: relative;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 20%, rgba(103, 123, 174, 0.08) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const TabNavigation = styled.div`
  display: flex;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
  background-size: 200% 100%;
  border-bottom: 1px solid rgba(103, 123, 174, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(103, 123, 174, 0.5) 50%, transparent 100%);
  }
`;

const TabButton = styled.button`
  padding: 1.25rem 2rem;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #677bae 0%, #8a9dc9 100%)' : 
    'transparent'};
  background-size: 200% 100%;
  color: ${props => props.active ? '#ffffff' : '#bdc3c7'};
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border-bottom: 3px solid ${props => props.active ? '#8a9dc9' : 'transparent'};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    right: 100%;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(103, 123, 174, 0.2), transparent);
    transition: all 0.5s ease;
  }
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%)' : 
      'linear-gradient(135deg, rgba(103, 123, 174, 0.2) 0%, rgba(138, 157, 201, 0.3) 100%)'};
    background-position: right center;
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(103, 123, 174, 0.3);
    
    &::before {
      left: -50%;
      right: -50%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TabContent = styled.div`
  padding: 2rem;
  color: #ecf0f1;
  min-height: 500px;
`;

const RulesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
  background-size: 200% 100%;
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 8px rgba(103, 123, 174, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(138, 157, 201, 0.3);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    right: 100%;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%);
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 
      0 4px 16px rgba(103, 123, 174, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    border-color: rgba(168, 185, 214, 0.5);
    
    &::before {
      left: -50%;
      right: -50%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 
      0 2px 8px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    
    &:hover {
      transform: none;
      background-position: left center;
    }
  }
`;

const Select = styled.select`
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: #ecf0f1;
  border: 2px solid rgba(103, 123, 174, 0.3);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  
  &:hover {
    border-color: rgba(138, 157, 201, 0.5);
    background: linear-gradient(135deg, #34495e 0%, #3d566e 100%);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  &:focus {
    outline: none;
    border-color: #677bae;
    background: linear-gradient(135deg, #34495e 0%, #677bae 100%);
    box-shadow: 
      0 0 0 3px rgba(103, 123, 174, 0.2),
      0 4px 12px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  
  option {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding: 0.5rem;
  }
`;

const RulesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const RuleCard = styled.div`
  background: ${props => props.highlighted ? 
    'linear-gradient(135deg, rgba(243, 156, 18, 0.15) 0%, rgba(243, 156, 18, 0.05) 100%)' : 
    'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)'};
  background-size: 200% 100%;
  border: 2px solid ${props => props.highlighted ? '#f39c12' : 'rgba(103, 123, 174, 0.3)'};
  border-radius: 12px;
  padding: 1.75rem;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(103, 123, 174, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 70% 30%, rgba(103, 123, 174, 0.08) 0%, transparent 50%);
    pointer-events: none;
    transition: opacity 0.3s ease;
    opacity: ${props => props.highlighted ? 0 : 1};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, rgba(103, 123, 174, 0.2), transparent 50%, rgba(138, 157, 201, 0.1));
    border-radius: 12px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: ${props => props.highlighted ? '#f39c12' : 'rgba(138, 157, 201, 0.6)'};
    background-position: right center;
    transform: translateY(-4px);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 4px 16px rgba(103, 123, 174, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    
    &::after {
      opacity: 1;
    }
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const RuleTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #ecf0f1;
  font-size: 1.1rem;
`;

const RuleCode = styled.span`
  background-color: #34495e;
  color: #677bae;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  margin-right: 1rem;
`;

const RuleContent = styled.div`
  color: #bdc3c7;
  margin: 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
  
  p {
    margin-bottom: 1rem;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #ecf0f1;
    margin: 1.5rem 0 1rem 0;
    font-weight: 600;

  }
  
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.2rem; }
  h3 { font-size: 1.05rem; }
  h4 { font-size: 0.95rem; }
  
  strong, b {
    font-weight: 600;
    color: #ecf0f1;
  }
  
  em, i {
    font-style: italic;
    color: #e9ecef;
  }
  
  code {
    background-color: #2c3e50;
    color: #8a9dc9;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
  }
  
  pre {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
    border-left: 3px solid #677bae;
    
    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }
  
  blockquote {
    border-left: 3px solid #677bae;
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    background-color: rgba(103, 123, 174, 0.1);
    font-style: italic;
    color: #bdc3c7;
  }
  
  ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  a {
    color: #677bae;
    text-decoration: none;
    
    &:hover {
      color: #8a9dc9;
      text-decoration: underline;
    }
  }
  
  hr {
    border: none;
    height: 1px;
    background-color: #445566;
    margin: 1.5rem 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.85rem;
    
    th, td {
      border: 1px solid #445566;
      padding: 0.5rem;
      text-align: left;
    }
    
    th {
      background-color: #2c3e50;
      font-weight: 600;
      color: #ecf0f1;
    }
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 0.5rem 0;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #677bae;
      box-shadow: 0 2px 8px rgba(103, 123, 174, 0.3);
    }
  }
`;

const RuleActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background-color: ${props => props.danger ? '#e74c3c' : '#95a5a6'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${props => props.danger ? '#c0392b' : '#7f8c8d'};
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 40%, rgba(103, 123, 174, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(138, 157, 201, 0.1) 0%, transparent 50%),
    rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const NotificationModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 40%, rgba(103, 123, 174, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(138, 157, 201, 0.1) 0%, transparent 50%),
    rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: 
    linear-gradient(135deg, 
      rgba(52, 73, 94, 0.95) 0%, 
      rgba(44, 62, 80, 0.98) 50%,
      rgba(52, 73, 94, 0.95) 100%
    ),
    radial-gradient(circle at top right, rgba(103, 123, 174, 0.1) 0%, transparent 60%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(103, 123, 174, 0.3);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 8px 16px rgba(103, 123, 174, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  animation: modalSlideIn 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(103, 123, 174, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(138, 157, 201, 0.03) 0%, transparent 50%);
    border-radius: 16px;
    pointer-events: none;
    z-index: -1;
  }
  
  @keyframes modalSlideIn {
    from { 
      opacity: 0; 
      transform: translateY(-20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(44, 62, 80, 0.5);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
  color: #ecf0f1;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #ecf0f1;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  color: #ecf0f1;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const Input = styled.input`
  width: 100%;
  background: 
    linear-gradient(135deg, 
      rgba(44, 62, 80, 0.9) 0%, 
      rgba(52, 73, 94, 0.95) 100%
    );
  color: #ecf0f1;
  border: 2px solid rgba(103, 123, 174, 0.3);
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &::placeholder {
    color: rgba(138, 157, 201, 0.7);
    font-style: italic;
  }
  
  &:hover {
    border-color: rgba(138, 157, 201, 0.5);
    background: 
      linear-gradient(135deg, 
        rgba(52, 73, 94, 0.95) 0%, 
        rgba(58, 79, 100, 0.98) 100%
      );
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  &:focus {
    border-color: #677bae;
    outline: none;
    background: 
      linear-gradient(135deg, 
        rgba(52, 73, 94, 0.98) 0%, 
        rgba(103, 123, 174, 0.15) 100%
      );
    box-shadow: 
      0 0 0 3px rgba(103, 123, 174, 0.2),
      0 6px 16px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: linear-gradient(135deg, rgba(149, 165, 166, 0.3) 0%, rgba(127, 140, 141, 0.3) 100%);
    color: rgba(236, 240, 241, 0.5);
    cursor: not-allowed;
    border-color: rgba(103, 123, 174, 0.1);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  background: 
    linear-gradient(135deg, 
      rgba(44, 62, 80, 0.9) 0%, 
      rgba(52, 73, 94, 0.95) 100%
    );
  color: #ecf0f1;
  border: 2px solid rgba(103, 123, 174, 0.3);
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &::placeholder {
    color: rgba(138, 157, 201, 0.7);
    font-style: italic;
  }
  
  &:hover {
    border-color: rgba(138, 157, 201, 0.5);
    background: 
      linear-gradient(135deg, 
        rgba(52, 73, 94, 0.95) 0%, 
        rgba(58, 79, 100, 0.98) 100%
      );
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  &:focus {
    border-color: #677bae;
    outline: none;
    background: 
      linear-gradient(135deg, 
        rgba(52, 73, 94, 0.98) 0%, 
        rgba(103, 123, 174, 0.15) 100%
      );
    box-shadow: 
      0 0 0 3px rgba(103, 123, 174, 0.2),
      0 6px 16px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: linear-gradient(135deg, rgba(149, 165, 166, 0.3) 0%, rgba(127, 140, 141, 0.3) 100%);
    color: rgba(236, 240, 241, 0.5);
    cursor: not-allowed;
    border-color: rgba(103, 123, 174, 0.1);
  }
`;

const EditorContainer = styled.div`
  .w-md-editor {
    background: 
      linear-gradient(135deg, 
        rgba(44, 62, 80, 0.9) 0%, 
        rgba(52, 73, 94, 0.95) 100%
      );
    border: 2px solid rgba(103, 123, 174, 0.3);
    border-radius: 8px;
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
  }
  
  .w-md-editor-text-textarea, 
  .w-md-editor-text {
    background: 
      linear-gradient(135deg, 
        rgba(44, 62, 80, 0.95) 0%, 
        rgba(52, 73, 94, 0.98) 100%
      ) !important;
    color: #ecf0f1 !important;
    border: none !important;
    font-family: inherit !important;
  }
  
  .w-md-editor-bar {
    background: 
      linear-gradient(135deg, 
        rgba(52, 73, 94, 0.98) 0%, 
        rgba(44, 62, 80, 0.95) 100%
      );
    border: none;
    border-bottom: 1px solid rgba(103, 123, 174, 0.2);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }
  
  .w-md-editor-bar svg {
    color: #ecf0f1;
    transition: color 0.2s ease;
  }
  
  .w-md-editor-bar button:hover svg {
    color: #8a9dc9;
  }
  
  .w-md-editor-bar button {
    background: transparent;
    border: none;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(103, 123, 174, 0.2);
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(103, 123, 174, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(103, 123, 174, 0.5) 50%, 
      transparent 100%
    );
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const SearchInput = styled(Input)`
  padding-left: 2.5rem;
  
  &::placeholder {
    color: #8a9dc9;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #8a9dc9;
  font-size: 1rem;
  pointer-events: none;
`;

const SubRuleContainer = styled.div`
  margin-left: 2rem;
  margin-top: 1rem;
  border-left: 3px solid #677bae;
  padding-left: 1rem;
  background-color: #2a3441;
  border-radius: 0 8px 8px 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #677bae 0%, rgba(103, 123, 174, 0.3) 100%);
  }
`;

const SubRuleCard = styled(RuleCard)`
  background-color: ${props => props.highlighted ? 'rgba(243, 156, 18, 0.1) !important' : '#34495e !important'};
  border: 1px solid ${props => props.highlighted ? '#f39c12 !important' : '#445566 !important'};
  margin-bottom: 1rem;
  
  &:hover {
    border-color: ${props => props.highlighted ? '#f39c12 !important' : '#677bae !important'};
    transform: translateX(2px);
    transition: all 0.2s ease;
  }
`;

const ExpandButton = styled(ActionButton)`
  background-color: #3498db;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &::before {
    content: '${props => props.$expanded ? '▼' : '▶'}';
    margin-right: 0.5rem;
    font-size: 0.7rem;
  }
`;

const SearchResultsCount = styled.div`
  color: #8a9dc9;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-style: italic;
`;

const AnnouncementPreview = styled.div`
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  
  &::before {
    content: "📢 Homepage Preview";
    display: block;
    color: #8a9dc9;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #445566;
  }
`;

const PreviewTitle = styled.h3`
  color: #ecf0f1;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const PreviewContent = styled.div`
  color: #bdc3c7;
  line-height: 1.6;
  
  p {
    margin-bottom: 1rem;
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
  }
`;

const PreviewMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #445566;
  font-size: 0.8rem;
  color: #8a9dc9;
`;

const TogglePreviewButton = styled(Button)`
  background-color: #3498db;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const DeleteButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: #c0392b;
  }
`;

// Categories specific styled components
const CategoryCard = styled.div`
  background-color: #2c3e50;
  border: 2px solid ${props => props.isDragging ? '#677bae' : '#445566'};
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: ${props => props.isDraggable ? 'move' : 'default'};
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragging ? 'rotate(2deg)' : 'none'};

  &:hover {
    border-color: #677bae;
    box-shadow: 0 4px 12px rgba(103, 123, 174, 0.2);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CategoryCode = styled.div`
  background-color: #677bae;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
`;

const CategoryInfo = styled.div`
  flex: 1;
  margin-left: 1.5rem;
`;

const CategoryName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #ecf0f1;
  font-size: 1.3rem;
  font-weight: 600;
`;

const CategoryDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: #bdc3c7;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const CategoryStats = styled.div`
  color: #8a9dc9;
  font-size: 0.9rem;
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CategoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const DragHandle = styled.div`
  color: #677bae;
  font-size: 1.2rem;
  cursor: move;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #34495e;
  }
`;

const ReorderingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  color: #ecf0f1;
  font-size: 1.2rem;
`;

// Custom notification modal styled components
const NotificationModalContainer = styled.div`
  background: 
    linear-gradient(135deg, 
      rgba(52, 73, 94, 0.98) 0%, 
      rgba(44, 62, 80, 0.99) 50%,
      rgba(52, 73, 94, 0.98) 100%
    ),
    radial-gradient(circle at top left, rgba(103, 123, 174, 0.1) 0%, transparent 50%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.5),
    0 12px 24px rgba(103, 123, 174, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 2px solid ${props => {
    switch(props.type) {
      case 'success': return 'rgba(39, 174, 96, 0.4)';
      case 'error': return 'rgba(231, 76, 60, 0.4)';
      case 'warning': return 'rgba(243, 156, 18, 0.4)';
      case 'confirm': return 'rgba(52, 152, 219, 0.4)';
      default: return 'rgba(103, 123, 174, 0.4)';
    }
  }};
  position: relative;
  animation: notificationSlideIn 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => {
      switch(props.type) {
        case 'success': return 'radial-gradient(circle at top right, rgba(39, 174, 96, 0.05) 0%, transparent 60%)';
        case 'error': return 'radial-gradient(circle at top right, rgba(231, 76, 60, 0.05) 0%, transparent 60%)';
        case 'warning': return 'radial-gradient(circle at top right, rgba(243, 156, 18, 0.05) 0%, transparent 60%)';
        case 'confirm': return 'radial-gradient(circle at top right, rgba(52, 152, 219, 0.05) 0%, transparent 60%)';
        default: return 'radial-gradient(circle at top right, rgba(103, 123, 174, 0.05) 0%, transparent 60%)';
      }
    }};
    border-radius: 16px;
    pointer-events: none;
    z-index: -1;
  }
  
  @keyframes notificationSlideIn {
    from { 
      opacity: 0; 
      transform: translateY(-30px) scale(0.9); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const NotificationIcon = styled.div`
  font-size: 2rem;
  color: ${props => {
    switch(props.type) {
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'confirm': return '#3498db';
      default: return '#677bae';
    }
  }};
`;

const NotificationTitle = styled.h3`
  margin: 0;
  color: #ecf0f1;
  font-size: 1.3rem;
  font-weight: 600;
`;

const NotificationMessage = styled.div`
  color: #bdc3c7;
  line-height: 1.6;
  margin-bottom: 2rem;
  white-space: pre-line;
  font-size: 1rem;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const NotificationButton = styled.button`
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    right: 100%;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.5s ease;
  }
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, ${props.type === 'warning' || props.type === 'error' ? '#e74c3c' : '#677bae'} 0%, ${props.type === 'warning' || props.type === 'error' ? '#c0392b' : '#8a9dc9'} 100%);
    background-size: 200% 100%;
    color: white;
    box-shadow: 
      0 2px 8px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(138, 157, 201, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, ${props.type === 'warning' || props.type === 'error' ? '#c0392b' : '#8a9dc9'} 0%, ${props.type === 'warning' || props.type === 'error' ? '#a93226' : '#a8b9d6'} 100%);
      background-position: right center;
      transform: translateY(-2px);
      box-shadow: 
        0 4px 16px rgba(103, 123, 174, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      border-color: rgba(168, 185, 214, 0.5);
      
      &::before {
        left: -50%;
        right: -50%;
      }
    }
  ` : `
    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    background-size: 200% 100%;
    color: white;
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(149, 165, 166, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #7f8c8d 0%, #6c7b7d 100%);
      background-position: right center;
      transform: translateY(-2px);
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      
      &::before {
        left: -50%;
        right: -50%;
      }
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

// Dashboard Overview styled components
const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const DashboardCard = styled.div`
  background: 
    linear-gradient(135deg, 
      rgba(44, 62, 80, 0.95) 0%, 
      rgba(52, 73, 94, 0.98) 50%,
      rgba(44, 62, 80, 0.95) 100%
    ),
    radial-gradient(circle at top right, rgba(103, 123, 174, 0.1) 0%, transparent 60%);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 2px solid rgba(103, 123, 174, 0.2);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(103, 123, 174, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(103, 123, 174, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(138, 157, 201, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  &:hover {
    border-color: rgba(138, 157, 201, 0.4);
    transform: translateY(-4px);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.4),
      0 6px 20px rgba(103, 123, 174, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const StatCard = styled(DashboardCard)`
  text-align: center;
  
  &:hover {
    transform: translateY(-6px) scale(1.02);
  }
`;

const StatIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
  transition: all 0.3s ease;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  ${StatCard}:hover & {
    transform: scale(1.1);
    opacity: 1;
    text-shadow: 0 4px 16px rgba(103, 123, 174, 0.4);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ecf0f1;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #ecf0f1 0%, #8a9dc9 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  ${StatCard}:hover & {
    transform: scale(1.05);
    background: linear-gradient(135deg, #ffffff 0%, #677bae 100%);
    background-clip: text;
    -webkit-background-clip: text;
  }
`;

const StatLabel = styled.div`
  color: #bdc3c7;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
`;

const ActivityList = styled.div`
  max-height: 360px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(44, 62, 80, 0.5);
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%);
    box-shadow: 0 2px 8px rgba(103, 123, 174, 0.3);
  }
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid rgba(103, 123, 174, 0.15);
  transition: all 0.3s ease;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(135deg, transparent 0%, rgba(103, 123, 174, 0.3) 50%, transparent 100%);
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  &:hover {
    background: 
      linear-gradient(135deg, 
        rgba(103, 123, 174, 0.05) 0%, 
        rgba(138, 157, 201, 0.03) 100%
      );
    border-radius: 8px;
    padding-left: 1rem;
    margin-left: -1rem;
    margin-right: -0.5rem;
    
    &::before {
      opacity: 1;
    }
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  font-size: 1.4rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
  padding: 0.75rem;
  background: 
    linear-gradient(135deg, 
      rgba(103, 123, 174, 0.2) 0%, 
      rgba(138, 157, 201, 0.1) 100%
    );
  border-radius: 12px;
  border: 1px solid rgba(103, 123, 174, 0.3);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  ${ActivityItem}:hover & {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 
      0 4px 16px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTitle = styled.div`
  color: #ecf0f1;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ActivityDescription = styled.div`
  color: #bdc3c7;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  opacity: 0.9;
`;

const ActivityTime = styled.div`
  color: #8a9dc9;
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.8;
  font-style: italic;
`;

const ChangesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(44, 62, 80, 0.5);
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%);
    box-shadow: 0 2px 8px rgba(103, 123, 174, 0.3);
  }
`;

const ChangeItem = styled.div`
  background: 
    linear-gradient(135deg, 
      rgba(52, 73, 94, 0.8) 0%, 
      rgba(44, 62, 80, 0.9) 100%
    );
  border-left: 4px solid ${props => {
    switch(props.type) {
      case 'create': return 'rgba(39, 174, 96, 0.8)';
      case 'update': return 'rgba(243, 156, 18, 0.8)';
      case 'delete': return 'rgba(231, 76, 60, 0.8)';
      default: return 'rgba(103, 123, 174, 0.8)';
    }
  }};
  padding: 1.25rem;
  border-radius: 0 12px 12px 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(103, 123, 174, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 0; /* Allow flex items to shrink */
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => {
      switch(props.type) {
        case 'create': return 'radial-gradient(circle at top right, rgba(39, 174, 96, 0.1) 0%, transparent 50%)';
        case 'update': return 'radial-gradient(circle at top right, rgba(243, 156, 18, 0.1) 0%, transparent 50%)';
        case 'delete': return 'radial-gradient(circle at top right, rgba(231, 76, 60, 0.1) 0%, transparent 50%)';
        default: return 'radial-gradient(circle at top right, rgba(103, 123, 174, 0.1) 0%, transparent 50%)';
      }
    }};
    pointer-events: none;
    z-index: 0;
  }
  
  &:hover {
    transform: translateX(4px);
    border-color: rgba(138, 157, 201, 0.4);
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.3),
      0 2px 8px rgba(103, 123, 174, 0.2);
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const ChangeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
  flex-wrap: wrap;
  min-width: 0; /* Allow flex items to shrink */
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const ChangeAction = styled.span`
  background: ${props => {
    switch(props.type) {
      case 'create': return 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
      case 'update': return 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
      case 'delete': return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      default: return 'linear-gradient(135deg, #677bae 0%, #8a9dc9 100%)';
    }
  }};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
`;

const ChangeTarget = styled.div`
  color: #ecf0f1;
  font-weight: 600;
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ChangeTime = styled.div`
  color: #8a9dc9;
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.9;
  white-space: nowrap;
`;

const RefreshButton = styled(Button)`
  background-color: #3498db;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #8a9dc9;
  font-style: italic;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #bdc3c7;
  font-style: italic;
`;

const SystemHealthIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const HealthDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => {
    switch(props.status) {
      case 'healthy': return '#27ae60';
      case 'warning': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

const HealthStatus = styled.span`
  color: ${props => {
    switch(props.status) {
      case 'healthy': return '#27ae60';
      case 'warning': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
  font-weight: 500;
`;

const RuleLink = styled.button`
  background: none;
  border: none;
  color: #677bae;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  padding: 0;
  transition: color 0.3s ease;
  
  &:hover {
    color: #8a9dc9;
  }
`;

// Debug Panel Styled Components
const DebugPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: 2px solid #a93226;
  border-radius: 12px;
  padding: 1rem;
  color: white;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
  z-index: 10000;
  min-width: 280px;
  animation: debugPulse 2s ease-in-out infinite alternate;

  @keyframes debugPulse {
    0% { box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4); }
    100% { box-shadow: 0 6px 20px rgba(231, 76, 60, 0.6); }
  }
`;

const DebugHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
`;

const DebugTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DebugToggle = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const DebugContent = styled.div`
  display: ${props => props.show ? 'block' : 'none'};
`;

const DebugCurrentLevel = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
`;

const DebugLevelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const DebugLevelButton = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DebugFeatureList = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  
  h5 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  ul {
    margin: 0;
    padding-left: 1rem;
    
    li {
      margin-bottom: 0.25rem;
    }
  }
`;

// Floating particles animation system
const ParticlesContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const Particle = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: radial-gradient(circle, rgba(103, 123, 174, ${props => props.opacity}) 0%, transparent 70%);
  border-radius: 50%;
  animation: float ${props => props.duration}s linear infinite;
  
  @keyframes float {
    0% {
      transform: translateY(100vh) translateX(${props => props.startX}px) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: ${props => props.opacity};
    }
    90% {
      opacity: ${props => props.opacity};
    }
    100% {
      transform: translateY(-100px) translateX(${props => props.endX}px) rotate(360deg);
      opacity: 0;
    }
  }
`;

const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        const size = Math.random() * 3 + 1; // 1-4px
        const startX = Math.random() * window.innerWidth;
        const endX = startX + (Math.random() - 0.5) * 200; // drift ±100px
        const duration = Math.random() * 20 + 15; // 15-35s
        const delay = Math.random() * 20; // 0-20s delay
        const opacity = Math.random() * 0.6 + 0.1; // 0.1-0.7 opacity
        
        newParticles.push({
          id: i,
          size,
          startX,
          endX,
          duration,
          delay,
          opacity
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    
    // Regenerate particles periodically
    const interval = setInterval(generateParticles, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ParticlesContainer>
      {particles.map(particle => (
        <Particle
          key={particle.id}
          size={particle.size}
          startX={particle.startX}
          endX={particle.endX}
          duration={particle.duration}
          opacity={particle.opacity}
          style={{
            animationDelay: `${particle.delay}s`,
            left: 0,
            bottom: 0
          }}
        />
      ))}
    </ParticlesContainer>
  );
};

function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('log');
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'create-sub'
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    parentRuleId: null
  });
  const [ruleImages, setRuleImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRules, setExpandedRules] = useState(new Set());

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    priority: 1,
    isActive: true,
    isScheduled: false,
    scheduledFor: '',
    autoExpireHours: ''
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showAnnouncementPreview, setShowAnnouncementPreview] = useState(false);
  const [scheduledAnnouncements, setScheduledAnnouncements] = useState([]);

  // Announcement templates
  const announcementTemplates = [
    {
      name: "Server Maintenance",
      title: "🔧 Scheduled Server Maintenance",
      content: `**Server maintenance is scheduled for [DATE] at [TIME].**

The server will be offline for approximately **[DURATION]** while we:
- Update server performance
- Apply security patches
- Optimize gameplay systems

We apologize for any inconvenience. Thank you for your patience!`,
      priority: 4
    },
    {
      name: "Rule Update",
      title: "📋 Server Rules Updated",
      content: `**Important rule changes have been made to [SECTION].**

Please review the updated rules:
- [RULE CHANGE 1]
- [RULE CHANGE 2]
- [RULE CHANGE 3]

These changes are effective immediately. Failure to follow updated rules may result in disciplinary action.`,
      priority: 3
    },
    {
      name: "Server Event",
      title: "🎉 Special Server Event",
      content: `**Join us for [EVENT NAME]!**

📅 **When:** [DATE] at [TIME]
📍 **Where:** [LOCATION]
🎁 **Prizes:** [PRIZES]

Event Rules:
- [RULE 1]
- [RULE 2]
- [RULE 3]

Don't miss out on this exciting event!`,
      priority: 2
    },
    {
      name: "Emergency Notice",
      title: "🚨 Emergency Server Notice",
      content: `**URGENT: [EMERGENCY TYPE]**

**What happened:** [DESCRIPTION]

**Actions taken:**
- [ACTION 1]
- [ACTION 2]

**What you need to do:**
- [USER ACTION 1]
- [USER ACTION 2]

For questions, contact staff immediately.`,
      priority: 5
    }
  ];

  // Categories state
  const [categoriesData, setCategoriesData] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalType, setCategoryModalType] = useState('create'); // 'create' or 'edit'
  const [categoryFormData, setCategoryFormData] = useState({
    id: null,
    letter_code: '',
    name: '',
    description: '',
    color: '#3498db',
    is_active: true
  });
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [reorderingCategories, setReorderingCategories] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null);

  // Add state for highlighting rules
  const [highlightedRuleId, setHighlightedRuleId] = useState(null);

  // User management state
  const [staffUsers, setStaffUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalType, setUserModalType] = useState('create'); // 'create' or 'edit'
  const [userFormData, setUserFormData] = useState({
    id: null,
    steamId: '',
    username: '',
    permissionLevel: 'editor',
    isActive: true
  });
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    type: 'info', // 'success', 'error', 'warning', 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  });

  // Dashboard state
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Approval system state
  const [pendingApprovals, setPendingApprovals] = useState({ rules: [], announcements: [], totalPending: 0 });
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'reject'
  const [reviewNotes, setReviewNotes] = useState('');

  // Approval workflow state for modals
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [submissionMode, setSubmissionMode] = useState('submit'); // 'draft' or 'submit'

  // Discord integration state
  const [discordSettings, setDiscordSettings] = useState({
    announcementWebhookUrl: '',
    rulesWebhookUrl: '',
    announcementsEnabled: false,
    rulesEnabled: false,
    emergencyRoleId: '',
    defaultChannelType: 'announcements',
    embedColor: '#677bae'
  });
  const [discordMessages, setDiscordMessages] = useState([]);
  const [loadingDiscord, setLoadingDiscord] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [sendingToDiscord, setSendingToDiscord] = useState(false);
  const [loadingDiscordMessages, setLoadingDiscordMessages] = useState(false);
  const [discordMessageFilter, setDiscordMessageFilter] = useState('all'); // 'all', 'announcements', 'rules'
  const [colorHover, setColorHover] = useState(null);
  const [colorInputFocused, setColorInputFocused] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Discord preset colors
  const presetColors = [
    '#677bae', // DDG Blue
    '#5865F2', // Discord Blurple
    '#57F287', // Green
    '#FEE75C', // Yellow
    '#EB459E', // Fuchsia
    '#ED4245', // Red
    '#FF6B35', // Orange
    '#00D166', // Bright Green
    '#3498db', // Blue
    '#9b59b6', // Purple
    '#e91e63', // Pink
    '#f39c12', // Orange
    '#27ae60', // Success Green
    '#e74c3c', // Error Red
    '#95a5a6', // Gray
    '#34495e'  // Dark Gray
  ];

  // Cross-references state
  const [showCrossReferencesModal, setShowCrossReferencesModal] = useState(false);
  const [currentRuleForCrossRefs, setCurrentRuleForCrossRefs] = useState(null);
  const [crossReferences, setCrossReferences] = useState([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false);
  const [ruleSearchQuery, setRuleSearchQuery] = useState('');
  const [ruleSearchResults, setRuleSearchResults] = useState([]);
  const [newCrossRefData, setNewCrossRefData] = useState({
    target_rule_id: '',
    reference_type: 'related',
    reference_context: '',
    is_bidirectional: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Load Discord settings when Discord tab is active
  useEffect(() => {
    if (activeTab === 'discord' && (user?.permissionLevel === 'admin' || user?.permissionLevel === 'owner')) {
      loadDiscordSettings();
    }
  }, [activeTab, user]);

  // Custom modal helper functions - MUST BE DEFINED BEFORE THEY ARE USED
  const showCustomAlert = (title, message, type = 'info') => {
    setNotificationConfig({
      type,
      title,
      message,
      onConfirm: () => setShowNotificationModal(false),
      onCancel: null,
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false
    });
    setShowNotificationModal(true);
  };

  const showCustomConfirm = (title, message, onConfirm, onCancel = null, type = 'confirm') => {
    setNotificationConfig({
      type,
      title,
      message,
      onConfirm: () => {
        setShowNotificationModal(false);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setShowNotificationModal(false);
        if (onCancel) onCancel();
      },
      confirmText: type === 'warning' ? 'Delete Anyway' : 'Confirm',
      cancelText: 'Cancel',
      showCancel: true
    });
    setShowNotificationModal(true);
  };

  const closeNotificationModal = () => {
    if (notificationConfig.onCancel) {
      notificationConfig.onCancel();
    }
    setShowNotificationModal(false);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'confirm': return '❓';
      default: return 'ℹ️';
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/check`, { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        if (userData.authenticated && userData.user) {
          setUser(userData.user);
          loadDashboardData();
        } else {
          window.location.href = `${BASE_URL}/auth/steam`;
        }
      } else {
        window.location.href = `${BASE_URL}/auth/steam`;
      }
    } catch (error) {
      console.error('Auth failed:', error);
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    const promises = [
      loadRules(),
      loadCategories(),
      loadCategoriesData(),
      loadAnnouncements(),
      loadActivityLog(),
      loadStaffUsers()
    ];

    // Load pending approvals for moderators and above
    if (user && (user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner')) {
      promises.push(loadPendingApprovals());
    }

    await Promise.all(promises);
  };

  const loadDashboardStats = async () => {
    setLoadingDashboard(true);
    try {
      const response = await fetch(`${BASE_URL}/api/staff/dashboard`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard API Response:', data); // Debug logging
        console.log('Recent Activity:', data.recentActivity); // Debug recent activity
        console.log('Recent Changes:', data.recentChanges); // Debug recent changes
        console.log('Activity Summary:', data.activitySummary); // Debug activity summary
        setRecentActivity(data.recentActivity || []);
        setRecentChanges(data.recentChanges || []);
      } else {
        console.error('Dashboard API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/staff/rules`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        // Ensure data is valid array before setting state
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('Categories API returned invalid data:', data);
          setCategories([]);
        }
      } else {
        console.error('Failed to load categories:', response.status, response.statusText);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadCategoriesData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/staff/categories`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data is valid array before setting state
        if (Array.isArray(data)) {
          setCategoriesData(data);
        } else {
          console.error('Categories data API returned invalid data:', data);
          setCategoriesData([]);
        }
      } else {
        console.error('Failed to load categories data:', response.status, response.statusText);
        setCategoriesData([]);
      }
    } catch (error) {
      console.error('Error loading categories data:', error);
      setCategoriesData([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/staff/announcements`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
  };

  // Approval system functions
  const loadPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const response = await fetch(`${BASE_URL}/api/staff/pending-approvals`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data);
      } else {
        console.error('Failed to load pending approvals:', response.status);
      }
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = `${BASE_URL}/`;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  // Full cross-references management functions
  const openCrossReferencesModal = async (rule) => {
    console.log('🔗 Opening cross-references modal for rule:', rule);
    setCurrentRuleForCrossRefs(rule);
    setShowCrossReferencesModal(true);
    setLoadingCrossRefs(true);
    
    try {
      const url = `${BASE_URL}/api/rules/${rule.id}/cross-references`;
      console.log('🔗 Fetching cross-references from:', url);
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      console.log('🔗 Response status:', response.status);
      console.log('🔗 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔗 Cross-references data received:', data);
        
        // Flatten the grouped data into a single array
        const flattenedCrossRefs = [];
        Object.keys(data).forEach(referenceType => {
          data[referenceType].forEach(crossRef => {
            flattenedCrossRefs.push({
              id: crossRef.id,
              reference_type: referenceType,
              reference_context: crossRef.reference_context,
              is_bidirectional: crossRef.is_bidirectional,
              created_at: crossRef.created_at,
              direction: crossRef.direction,
              target_rule_id: crossRef.related_rule.id,
              target_title: crossRef.related_rule.title,
              target_full_code: crossRef.related_rule.full_code,
              target_category_name: crossRef.related_rule.category_name
            });
          });
        });
        
        console.log('🔗 Flattened cross-references:', flattenedCrossRefs);
        setCrossReferences(flattenedCrossRefs);
      } else {
        const errorText = await response.text();
        console.error('Failed to load cross-references:', response.status, errorText);
        setCrossReferences([]);
      }
    } catch (error) {
      console.error('Error loading cross-references:', error);
      setCrossReferences([]);
    }
    
    setLoadingCrossRefs(false);
  };

  const closeCrossReferencesModal = () => {
    setShowCrossReferencesModal(false);
    setCurrentRuleForCrossRefs(null);
    setCrossReferences([]);
    setRuleSearchQuery('');
    setRuleSearchResults([]);
    setNewCrossRefData({
      target_rule_id: '',
      reference_type: 'related',
      reference_context: '',
      is_bidirectional: true
    });
  };

  const searchRulesForCrossRef = (query) => {
    console.log('🔍 Search function called with query:', query);
    console.log('🔍 Available rules count:', rules.length);
    
    if (!query.trim()) {
      setRuleSearchResults([]);
      return;
    }

    try {
      // Build a flat array of all rules including sub-rules
      const allRules = [];
      
      // Safely iterate through rules
      if (Array.isArray(rules)) {
        rules.forEach(rule => {
          // Add main rule
          if (rule && rule.id) {
            allRules.push(rule);
          }
          
          // Add sub-rules if they exist and are valid
          if (rule && rule.sub_rules && Array.isArray(rule.sub_rules)) {
            rule.sub_rules.forEach(subRule => {
              if (subRule && subRule.id) {
                allRules.push(subRule);
              }
            });
          }
        });
      }
      
      console.log('🔍 Total rules including sub-rules:', allRules.length);
      
      // Filter out current rule and already cross-referenced rules
      // Ensure crossReferences is always an array and filter out invalid entries
      const crossRefsArray = Array.isArray(crossReferences) ? crossReferences.filter(ref => ref && ref.target_rule_id) : [];
      const existingTargetIds = new Set([
        currentRuleForCrossRefs?.id,
        ...crossRefsArray.map(ref => ref.target_rule_id)
      ].filter(id => id != null)); // Remove null/undefined values

      console.log('🔍 Existing target IDs to exclude:', Array.from(existingTargetIds));

      const filteredRules = allRules.filter(rule => {
        if (!rule || !rule.id) return false; // Skip invalid rules
        
        if (existingTargetIds.has(rule.id)) return false; // Skip already referenced rules
        
        const queryLower = query.toLowerCase();
        
        // Check if query matches full_code, title, or content
        const matchesCode = rule.full_code && rule.full_code.toLowerCase().includes(queryLower);
        const matchesTitle = rule.title && rule.title.toLowerCase().includes(queryLower);
        const matchesContent = rule.content && rule.content.toLowerCase().includes(queryLower);
        
        return matchesCode || matchesTitle || matchesContent;
      }).slice(0, 10); // Limit to 10 results

      console.log('🔍 Filtered results:', filteredRules.map(r => ({ id: r.id, full_code: r.full_code, title: r.title })));
      setRuleSearchResults(filteredRules);
    } catch (error) {
      console.error('Error searching rules:', error);
      setRuleSearchResults([]);
    }
  };

  const addCrossReference = async () => {
    if (!newCrossRefData.target_rule_id) {
      showCustomAlert('Error', 'Please select a target rule', 'error');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/rules/${currentRuleForCrossRefs.id}/cross-references`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newCrossRefData)
      });

      if (response.ok) {
        showCustomAlert('Success', 'Cross-reference added successfully', 'success');
        // Reload cross-references
        const reloadResponse = await fetch(`${BASE_URL}/api/rules/${currentRuleForCrossRefs.id}/cross-references`, {
          credentials: 'include'
        });
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setCrossReferences(data);
        }
        
        setNewCrossRefData({
          target_rule_id: '',
          reference_type: 'related',
          reference_context: '',
          is_bidirectional: true
        });
        setRuleSearchQuery('');
        setRuleSearchResults([]);
      } else {
        throw new Error('Failed to add cross-reference');
      }
    } catch (error) {
      console.error('Error adding cross-reference:', error);
      showCustomAlert('Error', 'Failed to add cross-reference', 'error');
    }
  };

  const removeCrossReference = async (crossRefId) => {
    showCustomConfirm(
      'Remove Cross-Reference',
      'Are you sure you want to remove this cross-reference?',
      async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/rules/${currentRuleForCrossRefs.id}/cross-references/${crossRefId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.ok) {
            showCustomAlert('Success', 'Cross-reference removed successfully', 'success');
            // Reload cross-references
            const reloadResponse = await fetch(`${BASE_URL}/api/rules/${currentRuleForCrossRefs.id}/cross-references`, {
              credentials: 'include'
            });
            if (reloadResponse.ok) {
              const data = await reloadResponse.json();
              setCrossReferences(data);
            }
          } else {
            throw new Error('Failed to remove cross-reference');
          }
        } catch (error) {
          console.error('Error removing cross-reference:', error);
          showCustomAlert('Error', 'Failed to remove cross-reference', 'error');
        }
      }
    );
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      content: '',
      categoryId: selectedCategory || '',
      parentRuleId: null
    });
    setRuleImages([]);
    setModalType('create');
    setEditingRule(null);
    setSaveAsDraft(false);
    setSubmissionMode('submit');
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setFormData({
      title: rule.title,
      content: rule.content,
      categoryId: rule.category_id.toString(),
      parentRuleId: rule.parent_rule_id
    });
    
    // Handle images safely - could be array or JSON string
    let images = [];
    try {
      if (rule.images) {
        images = Array.isArray(rule.images) ? rule.images : JSON.parse(rule.images);
      }
    } catch (e) {
      console.error('Error parsing rule images:', e);
      images = [];
    }
    setRuleImages(images);
    
    setModalType('edit');
    setEditingRule(rule);
    
    // Set approval workflow state based on current rule status
    if (rule.status === 'draft') {
      setSaveAsDraft(true);
      setSubmissionMode('draft');
    } else {
      setSaveAsDraft(false);
      setSubmissionMode('submit');
    }
    
    setShowModal(true);
  };

  const openSubRuleModal = (parentRule) => {
    setFormData({
      title: '',
      content: '',
      categoryId: parentRule.category_id.toString(),
      parentRuleId: parentRule.id
    });
    setRuleImages([]);
    setModalType('create-sub');
    setEditingRule(null);
    setSaveAsDraft(false);
    setSubmissionMode('submit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingRule(null);
    setRuleImages([]);
    setSaveAsDraft(false);
    setSubmissionMode('submit');
    setFormData({
      title: '',
      content: '',
      categoryId: '',
      parentRuleId: null
    });
  };

  const saveRule = async () => {
    try {
      // Add validation
      if (!formData.content || !formData.content.trim()) {
        showCustomAlert(
          '⚠️ Missing Content',
          'Rule content is required. Please enter the rule content before saving.',
          'warning'
        );
        return;
      }
      
      if (!formData.categoryId) {
        showCustomAlert(
          '⚠️ Category Required',
          'Please select a category for this rule.',
          'warning'
        );
        return;
      }
      
      // Determine status based on user permission and submission mode
      let status;
      
      if (submissionMode === 'draft') {
        status = 'draft';
      } else if (user.permissionLevel === 'editor') {
        status = 'pending_approval';
      } else {
        status = 'approved';
      }
      
      console.log('Saving rule with data:', {
        ...formData,
        images: ruleImages,
        status: status
      });
      
      const url = modalType === 'edit' 
        ? `${BASE_URL}/api/staff/rules/${editingRule.id}`
        : `${BASE_URL}/api/staff/rules`;
      
      const method = modalType === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          images: ruleImages,
          status: status
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Rule saved successfully:', result);
        await loadRules(); // Refresh the rules list
        await loadPendingApprovals(); // Refresh pending approvals if applicable
        closeModal();
        
        // Show different success messages based on status
        const actionText = modalType === 'edit' ? 'updated' : 'created';
        const ruleTypeText = modalType === 'create-sub' ? 'sub-rule' : 'rule';
        
        let successMessage = '';
        if (status === 'draft') {
          successMessage = `The ${ruleTypeText} has been saved as a draft. You can continue editing or submit it for approval later.`;
        } else if (status === 'pending_approval') {
          successMessage = `The ${ruleTypeText} has been submitted for approval. Moderators will review it before it goes live.`;
        } else {
          successMessage = `The ${ruleTypeText} has been ${actionText} successfully and is now live.`;
        }
        
        showCustomAlert(
          '✅ Rule Saved',
          successMessage,
          'success'
        );
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save rule:', response.status, errorData);
        showCustomAlert(
          '❌ Save Failed',
          `Failed to save rule: ${errorData.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      showCustomAlert(
        '❌ Network Error',
        `Error saving rule: ${error.message}`,
        'error'
      );
    }
  };

  const deleteRule = async (ruleId) => {
    // Get rule info for better confirmation message
    const ruleToDelete = rules.find(rule => rule.id === ruleId);
    const ruleTypeText = ruleToDelete?.parent_rule_id ? 'sub-rule' : 'rule';
    const ruleIdentifier = ruleToDelete?.full_code || `Rule #${ruleId}`;
    
    showCustomConfirm(
      '🗑️ Delete Rule',
      `Are you sure you want to permanently delete ${ruleTypeText} "${ruleIdentifier}"?\n\nThis action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/staff/rules/${ruleId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.ok) {
            await loadRules(); // Refresh the rules list
            showCustomAlert(
              '✅ Rule Deleted',
              `${ruleTypeText} "${ruleIdentifier}" has been successfully deleted.`,
              'success'
            );
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            showCustomAlert(
              '❌ Deletion Failed',
              `Failed to delete rule: ${errorData.error || 'Unknown error'}`,
              'error'
            );
          }
        } catch (error) {
          console.error('Error deleting rule:', error);
          showCustomAlert(
            '❌ Network Error',
            `Error deleting rule: ${error.message || 'Network error occurred'}`,
            'error'
          );
        }
      },
      null,
      'warning'
    );
  };

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${BASE_URL}/api/images/upload`, {
        method: 'POST', 
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return `${BASE_URL}${result.url}`;
      } else {
        console.error('Failed to upload image');
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const uploadRuleImage = async (file) => {
    setUploadingImage(true);
    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showCustomAlert(
          '⚠️ File Too Large',
          'Image file must be smaller than 10MB. Please choose a smaller file.',
          'warning'
        );
        setUploadingImage(false);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showCustomAlert(
          '⚠️ Invalid File Type',
          'Please select a valid image file (JPG, PNG, GIF, etc.).',
          'warning'
        );
        setUploadingImage(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${BASE_URL}/api/images/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setRuleImages(prev => [...prev, {
          id: result.imageId,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          originalName: result.originalName
        }]);
        
        showCustomAlert(
          '✅ Image Uploaded',
          `Image "${file.name}" has been uploaded successfully.`,
          'success'
        );
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showCustomAlert(
          '❌ Upload Failed',
          `Failed to upload image: ${errorData.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showCustomAlert(
        '❌ Network Error',
        `Error uploading image: ${error.message || 'Network error occurred'}`,
        'error'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const removeRuleImage = (imageId) => {
    setRuleImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Toggle expanded state for a rule
  const toggleRuleExpansion = (ruleId) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  // Filter rules based on search query
  const filteredRules = rules.filter(rule => {
    // Only show parent rules (not sub-rules)
    if (rule.parent_rule_id) return false;
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = rule.title && rule.title.toLowerCase().includes(query);
    const contentMatch = rule.content && rule.content.toLowerCase().includes(query);
    const codeMatch = rule.full_code && rule.full_code.toLowerCase().includes(query);
    
    // Also check sub-rules
    const subRuleMatch = rule.sub_rules && rule.sub_rules.some(subRule => 
      (subRule.title && subRule.title.toLowerCase().includes(query)) ||
      (subRule.content && subRule.content.toLowerCase().includes(query)) ||
      (subRule.full_code && subRule.full_code.toLowerCase().includes(query))
    );
    
    return titleMatch || contentMatch || codeMatch || subRuleMatch;
  });

  // Custom image upload command for MDEditor
  const imageCommand = {
    name: 'image',
    keyCommand: 'image',
    buttonProps: { 'aria-label': 'Add image', title: 'Add image (ctrl+k)' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 20 20">
        <path fill="currentColor" d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zM1 3h18v10l-2.5-2.5-4 4-4.5-4.5L1 17V3z"/>
      </svg>
    ),
    execute: async (state, api) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const imageUrl = await handleImageUpload(file);
          if (imageUrl) {
            const imageMarkdown = `![Image](${imageUrl})`;
            api.replaceSelection(imageMarkdown);
          }
        }
      };
      input.click();
    },
  };

  // Custom text color command for MDEditor
  const textColorCommand = {
    name: 'textColor',
    keyCommand: 'textColor',
    buttonProps: { 'aria-label': 'Text color', title: 'Add text color' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M9,2V8H11V22H13V8H15V2H9M12,4H13V6H12V4M5,12V14H7V22H9V14H11V12H5M8,14H9V16H8V14M15,17V19H17V22H19V19H21V17H15M18,19H19V20H18V19Z"/>
        <rect x="0" y="22" width="24" height="2" fill="#f39c12"/>
      </svg>
    ),
    execute: (state, api) => {
      // Create color picker modal
      const colorModal = document.createElement('div');
      colorModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #34495e;
        border: 1px solid #677bae;
        border-radius: 12px;
        padding: 1.5rem;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        min-width: 300px;
      `;

      const title = document.createElement('h3');
      title.textContent = 'Select Text Color';
      title.style.cssText = 'color: #ecf0f1; margin: 0 0 1rem 0; font-size: 1.1rem;';

      const colorsContainer = document.createElement('div');
      colorsContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
      `;

      // Preset colors for text
      const textColors = [
        { name: 'White', value: '#ffffff' },
        { name: 'Light Gray', value: '#bdc3c7' },
        { name: 'Dark Gray', value: '#7f8c8d' },
        { name: 'Black', value: '#2c3e50' },
        { name: 'Blue', value: '#3498db' },
        { name: 'Green', value: '#27ae60' },
        { name: 'Orange', value: '#f39c12' },
        { name: 'Red', value: '#e74c3c' },
        { name: 'Purple', value: '#9b59b6' },
        { name: 'Yellow', value: '#f1c40f' },
        { name: 'Cyan', value: '#1abc9c' },
        { name: 'Pink', value: '#e91e63' }
      ];

      textColors.forEach(color => {
        const colorButton = document.createElement('button');
        colorButton.style.cssText = `
          width: 35px;
          height: 35px;
          border: 2px solid #445566;
          border-radius: 6px;
          background-color: ${color.value};
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color.value === '#ffffff' || color.value === '#f1c40f' ? '#000' : '#fff'};
          font-size: 0.7rem;
          font-weight: bold;
        `;
        colorButton.title = color.name;
        colorButton.textContent = 'A';
        
        colorButton.addEventListener('mouseover', () => {
          colorButton.style.borderColor = '#677bae';
          colorButton.style.transform = 'scale(1.1)';
        });
        
        colorButton.addEventListener('mouseout', () => {
          colorButton.style.borderColor = '#445566';
          colorButton.style.transform = 'scale(1)';
        });

        colorButton.addEventListener('click', () => {
          applyColor(color.value);
          document.body.removeChild(overlay);
        });

        colorsContainer.appendChild(colorButton);
      });

      // Custom color input
      const customContainer = document.createElement('div');
      customContainer.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem;';

      const customLabel = document.createElement('label');
      customLabel.textContent = 'Custom:';
      customLabel.style.cssText = 'color: #bdc3c7; font-size: 0.9rem; min-width: 55px;';

      const customColorInput = document.createElement('input');
      customColorInput.type = 'color';
      customColorInput.value = '#677bae';
      customColorInput.style.cssText = `
        width: 50px;
        height: 35px;
        border: 2px solid #445566;
        border-radius: 6px;
        background: none;
        cursor: pointer;
      `;

      const customColorButton = document.createElement('button');
      customColorButton.textContent = 'Apply Custom';
      customColorButton.style.cssText = `
        background: #677bae;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background-color 0.2s ease;
      `;

      customColorButton.addEventListener('mouseover', () => {
        customColorButton.style.backgroundColor = '#8a9dc9';
      });

      customColorButton.addEventListener('mouseout', () => {
        customColorButton.style.backgroundColor = '#677bae';
      });

      customColorButton.addEventListener('click', () => {
        applyColor(customColorInput.value);
        document.body.removeChild(overlay);
      });

      customContainer.appendChild(customLabel);
      customContainer.appendChild(customColorInput);
      customContainer.appendChild(customColorButton);

      // Buttons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.cssText = 'display: flex; gap: 0.5rem; justify-content: flex-end;';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.cssText = `
        background: #95a5a6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
      `;

      cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });

      buttonsContainer.appendChild(cancelButton);

      colorModal.appendChild(title);
      colorModal.appendChild(colorsContainer);
      colorModal.appendChild(customContainer);
      colorModal.appendChild(buttonsContainer);

      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      overlay.appendChild(colorModal);
      document.body.appendChild(overlay);

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      });

      function applyColor(color) {
        const selectedText = state.selectedText || 'colored text';
        const coloredText = `<span style="color: ${color}">${selectedText}</span>`;
        api.replaceSelection(coloredText);
      }
    },
  };

  // Announcement management functions
  const openCreateAnnouncementModal = () => {
    setAnnouncementFormData({
      title: '',
      content: '',
      priority: 1,
      isActive: true,
      isScheduled: false,
      scheduledFor: '',
      autoExpireHours: ''
    });
    setEditingAnnouncement(null);
    setModalType('create-announcement');
    setSaveAsDraft(false);
    setSubmissionMode('submit');
    setShowModal(true);
  };

  const openEditAnnouncementModal = (announcement) => {
    setAnnouncementFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isActive: announcement.is_active === 1,
      isScheduled: announcement.is_scheduled === 1 || announcement.announcement_type === 'scheduled',
      scheduledFor: announcement.scheduled_for || '',
      autoExpireHours: announcement.auto_expire_hours || ''
    });
    setEditingAnnouncement(announcement);
    setModalType('edit-announcement');
    
    // Set approval workflow state based on current announcement status
    if (announcement.status === 'draft') {
      setSaveAsDraft(true);
      setSubmissionMode('draft');
    } else {
      setSaveAsDraft(false);
      setSubmissionMode('submit');
    }
    
    setShowModal(true);
  };

  const closeAnnouncementModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingAnnouncement(null);
    setSaveAsDraft(false);
    setSubmissionMode('submit');
    setAnnouncementFormData({
      title: '',
      content: '',
      priority: 1,
      isActive: true,
      isScheduled: false,
      scheduledFor: '',
      autoExpireHours: ''
    });
  };

  const publishScheduledAnnouncementNow = async (announcementId, title) => {
    showCustomConfirm(
      '🚀 Publish Now',
      `Are you sure you want to publish the scheduled announcement "${title}" immediately?\n\nThis will make it active on the homepage right now.`,
      async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/staff/scheduled-announcements/${announcementId}/publish-now`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            const result = await response.json();
            await loadAnnouncements();
            showCustomAlert(
              '✅ Published Successfully',
              `Scheduled announcement "${title}" has been published and is now live on the homepage.`,
              'success'
            );
          } else {
            const error = await response.json();
            showCustomAlert(
              '❌ Publication Failed',
              `Error publishing announcement: ${error.error || error.message}`,
              'error'
            );
          }
        } catch (error) {
          console.error('Error publishing scheduled announcement:', error);
          showCustomAlert(
            '❌ Network Error',
            'Error publishing announcement: Network error occurred',
            'error'
          );
        }
      }
    );
  };

  const saveAnnouncement = async () => {
    try {
      if (!announcementFormData.title || !announcementFormData.content) {
        showCustomAlert(
          '⚠️ Missing Information',
          'Please fill in all required fields:\n• Title\n• Content',
          'warning'
        );
        return;
      }

      // Determine status based on user permission and submission mode
      let status;
      
      if (submissionMode === 'draft') {
        status = 'draft';
      } else if (user.permissionLevel === 'editor') {
        status = 'pending_approval';
      } else {
        status = 'approved';
      }

      const url = modalType === 'edit-announcement' 
        ? `${BASE_URL}/api/staff/announcements/${editingAnnouncement.id}`
        : `${BASE_URL}/api/staff/announcements`;
      
      const method = modalType === 'edit-announcement' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: announcementFormData.title,
          content: announcementFormData.content,
          priority: announcementFormData.priority,
          isActive: announcementFormData.isActive,
          isScheduled: announcementFormData.isScheduled,
          scheduledFor: announcementFormData.scheduledFor,
          autoExpireHours: announcementFormData.autoExpireHours,
          status: status
        })
      });

      if (response.ok) {
        const result = await response.json();
        await loadAnnouncements();
        await loadPendingApprovals(); // Refresh pending approvals if applicable
        closeAnnouncementModal();
        
        // Show different success messages based on status
        const actionText = modalType === 'edit-announcement' ? 'updated' : 'created';
        
        let successMessage = '';
        if (status === 'draft') {
          successMessage = `Announcement has been saved as a draft. You can continue editing or submit it for approval later.`;
        } else if (status === 'pending_approval') {
          successMessage = `Announcement has been submitted for approval. Moderators will review it before it goes live.`;
        } else {
          const scheduleText = result.type === 'scheduled' ? ' and scheduled for publication' : '';
          const timeText = result.scheduledFor ? ` on ${new Date(result.scheduledFor).toLocaleString()}` : '';
          successMessage = `Announcement "${announcementFormData.title}" has been ${actionText} successfully${scheduleText}${timeText}.`;
        }
        
        showCustomAlert(
          '✅ Announcement Saved',
          successMessage,
          'success'
        );
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showCustomAlert(
          '❌ Save Failed',
          `Failed to save announcement: ${errorData.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      showCustomAlert(
        '❌ Network Error',
        `Error saving announcement: ${error.message}`,
        'error'
      );
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    // Get announcement info for better confirmation message
    const announcementToDelete = announcements.find(ann => ann.id === announcementId);
    const announcementTitle = announcementToDelete?.title || `Announcement #${announcementId}`;
    
    showCustomConfirm(
      '🗑️ Delete Announcement',
      `Are you sure you want to permanently delete the announcement "${announcementTitle}"?\n\nThis action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/staff/announcements/${announcementId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (response.ok) {
            await loadAnnouncements();
            showCustomAlert(
              '✅ Announcement Deleted',
              `Announcement "${announcementTitle}" has been successfully deleted.`,
              'success'
            );
          } else {
            const error = await response.json();
            showCustomAlert(
              '❌ Deletion Failed',
              `Error deleting announcement: ${error.error || error.message}`,
              'error'
            );
          }
        } catch (error) {
          console.error('Error deleting announcement:', error);
          showCustomAlert(
            '❌ Network Error',
            'Error deleting announcement: Network error occurred',
            'error'
          );
        }
      },
      null,
      'warning'
    );
  };

  const handleCategoryDragStart = (e, index) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) {
      setDraggedCategoryIndex(null);
      return;
    }

    setReorderingCategories(true);
    
    try {
      // Create new order array
      const reorderedCategories = [...categoriesData];
      const draggedCategory = reorderedCategories[draggedCategoryIndex];
      
      // Remove dragged item
      reorderedCategories.splice(draggedCategoryIndex, 1);
      
      // Insert at new position
      reorderedCategories.splice(dropIndex, 0, draggedCategory);
      
      // Create order array for API - backend expects {id, order_index} format
      const categoryOrder = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        order_index: index + 1
      }));
      
      const response = await fetch(`${BASE_URL}/api/staff/categories/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ categoryOrder })
      });

      if (response.ok) {
        await Promise.all([loadCategoriesData(), loadCategories()]);
      } else {
        let errorMessage = 'Unknown error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        showCustomAlert(
          '❌ Reorder Failed',
          `Error reordering categories: ${errorMessage}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
      showCustomAlert(
        '❌ Network Error',
        `Error reordering categories: ${error.message || 'Network error occurred'}`,
        'error'
      );
    } finally {
      setReorderingCategories(false);
      setDraggedCategoryIndex(null);
    }
  };

  // Categories management functions
  const openCreateCategoryModal = () => {
    setCategoryFormData({
      id: null,
      letter_code: '',
      name: '',
      description: '',
      color: '#3498db',
      is_active: true
    });
    setCategoryModalType('create');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setCategoryFormData({
      id: category.id,
      letter_code: category.letter_code,
      name: category.name,
      description: category.description || '',
      color: category.color || '#3498db',
      is_active: category.is_active === 1
    });
    setCategoryModalType('edit');
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setCategoryFormData({
      id: null,
      letter_code: '',
      name: '',
      description: '',
      color: '#3498db',
      is_active: true
    });
  };

  const saveCategory = async () => {
    // Debug logging to see what's in the form data
    console.log('=== SAVE CATEGORY DEBUG ===');
    console.log('categoryFormData:', categoryFormData);
    console.log('name value:', `"${categoryFormData.name}"`);
    console.log('letter_code value:', `"${categoryFormData.letter_code}"`);
    console.log('name trimmed:', `"${categoryFormData.name.trim()}"`);
    console.log('letter_code trimmed:', `"${categoryFormData.letter_code.trim()}"`);
    console.log('name validation:', !categoryFormData.name.trim());
    console.log('letter_code validation:', !categoryFormData.letter_code.trim());
    
    if (!categoryFormData.letter_code.trim() || !categoryFormData.name.trim()) {
      console.log('Validation failed - showing alert');
      showCustomAlert(
        '⚠️ Missing Information',
        'Please fill in all required fields:\n• Letter Code\n• Category Name',
        'warning'
      );
      return;
    }

    console.log('Validation passed - proceeding with save');
    try {
      const url = categoryModalType === 'edit' 
        ? `${BASE_URL}/api/staff/categories/${categoryFormData.id}`
        : `${BASE_URL}/api/staff/categories`;
      
      const method = categoryModalType === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          letter_code: categoryFormData.letter_code.trim().toUpperCase(),
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          color: categoryFormData.color,
          is_active: categoryFormData.is_active
        })
      });

      if (response.ok) {
        // Reload categories data in sequence to avoid race conditions
        try {
          await loadCategoriesData();
          await loadCategories();
        } catch (loadError) {
          console.error('Error reloading categories after save:', loadError);
          // Don't fail the save operation if reload fails
        }
        
        closeCategoryModal();
        showCustomAlert(
          '✅ Category Saved',
          `Category "${categoryFormData.name}" has been ${categoryModalType === 'edit' ? 'updated' : 'created'} successfully.`,
          'success'
        );
      } else {
        const error = await response.json();
        showCustomAlert(
          '❌ Save Failed',
          `Error saving category: ${error.message || error.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showCustomAlert(
        '❌ Network Error',
        `Failed to save category: ${error.message || 'Network error occurred'}`,
        'error'
      );
    }
  };

  const deleteCategory = async (categoryId, categoryName, ruleCount = 0) => {
    // Check if category has rules and show appropriate notification
    if (ruleCount > 0) {
      showCustomAlert(
        '❌ Cannot Delete Category',
        `Category "${categoryName}" contains ${ruleCount} rule${ruleCount > 1 ? 's' : ''}.\n\nPlease delete or move the rules to another category first before deleting this category.`,
        'warning'
      );
      return;
    }

    // Confirm deletion for empty categories
    showCustomConfirm(
      '🗑️ Delete Category',
      `Are you sure you want to permanently delete the category "${categoryName}"?\n\nThis action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/staff/categories/${categoryId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (response.ok) {
            // Reload categories data in sequence to avoid race conditions
            try {
              await loadCategoriesData();
              await loadCategories();
            } catch (loadError) {
              console.error('Error reloading categories after delete:', loadError);
              // Don't fail the delete operation if reload fails
            }
            
            // Success notification
            showCustomAlert(
              '✅ Category Deleted',
              `Category "${categoryName}" has been successfully deleted.`,
              'success'
            );
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            showCustomAlert(
              '❌ Deletion Failed',
              `Error deleting category: ${errorData.error || errorData.message || 'Unknown error occurred'}`,
              'error'
            );
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          showCustomAlert(
            '❌ Network Error',
            `Failed to delete category: ${error.message || 'Network error occurred'}`,
            'error'
          );
        }
      },
      null,
      'warning'
    );
  };

  const loadActivityLog = async () => {
    setLoadingDashboard(true);
    try {
      const response = await fetch(`${BASE_URL}/api/staff/dashboard`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        console.log('=== DASHBOARD API FULL RESPONSE ===');
        console.log('Full data object:', data);
        console.log('Recent Activity array:', data.recentActivity);
        console.log('Recent Activity length:', data.recentActivity?.length);
        console.log('Recent Changes array:', data.recentChanges);
        console.log('Recent Changes length:', data.recentChanges?.length);
        
        if (data.recentActivity?.length > 0) {
          console.log('First activity item:', data.recentActivity[0]);
          console.log('Activity properties:', Object.keys(data.recentActivity[0]));
        }
        
        if (data.recentChanges?.length > 0) {
          console.log('First change item:', data.recentChanges[0]);
          console.log('Change properties:', Object.keys(data.recentChanges[0]));
        }
        
        setRecentActivity(data.recentActivity || []);
        setRecentChanges(data.recentChanges || []);
      } else {
        console.error('Activity log API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load activity log:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Function to navigate to a specific rule
  const navigateToRule = (ruleId, ruleName) => {
    if (!ruleId) return;
    
    // Switch to rules tab
    setActiveTab('rules');
    
    // Clear any existing highlight
    setHighlightedRuleId(null);
    
    // Set highlight after a brief delay to ensure tab switch completes
    setTimeout(() => {
      // Check if this is a sub-rule and expand its parent if needed
      const targetRule = rules.find(rule => rule.id === ruleId);
      const parentRule = rules.find(rule => 
        rule.sub_rules && rule.sub_rules.some(subRule => subRule.id === ruleId)
      );
      
      // If it's a sub-rule, expand the parent rule first
      if (parentRule) {
        setExpandedRules(prev => new Set([...prev, parentRule.id]));
        
        // Add extra delay for expansion animation to complete
        setTimeout(() => {
          setHighlightedRuleId(ruleId);
          
          // Scroll to the rule after highlighting
          setTimeout(() => {
            const ruleElement = document.querySelector(`[data-rule-id="${ruleId}"]`);
            if (ruleElement) {
              ruleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          
          // Clear highlight after 3 seconds
          setTimeout(() => {
            setHighlightedRuleId(null);
          }, 3000);
        }, 200); // Extra delay for expansion
      } else {
        // It's a main rule, proceed normally
        setHighlightedRuleId(ruleId);
        
        // Scroll to the rule after highlighting
        setTimeout(() => {
          const ruleElement = document.querySelector(`[data-rule-id="${ruleId}"]`);
          if (ruleElement) {
            ruleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setHighlightedRuleId(null);
        }, 3000);
      }
    }, 100);
  };

  // User management functions
  const loadStaffUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${BASE_URL}/api/staff/users`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        setStaffUsers(data);
      } else {
        console.error('Failed to load staff users:', response.status, response.statusText);
        showCustomAlert(
          '❌ Load Failed',
          'Failed to load staff users. Please try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('Failed to load staff users:', error);
      showCustomAlert(
        '❌ Network Error',
        `Error loading staff users: ${error.message}`,
        'error'
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const openCreateUserModal = () => {
    setUserFormData({
      id: null,
      steamId: '',
      username: '',
      permissionLevel: 'editor', // Always available as the lowest level
      isActive: true
    });
    setUserModalType('create');
    setShowUserModal(true);
  };

  const openEditUserModal = (staffUser) => {
    // Check if current user can manage this user based on permission hierarchy
    if (user.permissionLevel === 'admin' && (staffUser.permission_level === 'admin' || staffUser.permission_level === 'owner')) {
      showCustomAlert(
        '⚠️ Insufficient Permissions',
        `As an admin, you cannot edit other ${staffUser.permission_level}s. Only owners can manage admins.`,
        'warning'
      );
      return;
    }

    setUserFormData({
      id: staffUser.id,
      steamId: staffUser.steam_id,
      username: staffUser.steam_username,
      permissionLevel: staffUser.permission_level,
      isActive: staffUser.is_active === 1
    });
    setUserModalType('edit');
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setUserFormData({
      id: null,
      steamId: '',
      username: '',
      permissionLevel: 'editor',
      isActive: true
    });
  };

  const saveUser = async () => {
    try {
      if (!userFormData.steamId || !userFormData.username || !userFormData.permissionLevel) {
        showCustomAlert(
          '⚠️ Missing Information',
          'Please fill in all required fields:\n• Steam ID\n• Username\n• Permission Level',
          'warning'
        );
        return;
      }

      // Validate Steam ID format (basic check)
      if (!/^\d{17}$/.test(userFormData.steamId)) {
        showCustomAlert(
          '⚠️ Invalid Steam ID',
          'Steam ID must be a 17-digit number.\n\nExample: 76561198123456789',
          'warning'
        );
        return;
      }

      const url = userModalType === 'edit' 
        ? `${BASE_URL}/api/staff/users/${userFormData.id}`
        : `${BASE_URL}/api/staff/users`;
      
      const method = userModalType === 'edit' ? 'PUT' : 'POST';
      
      const payload = userModalType === 'edit' 
        ? {
            permissionLevel: userFormData.permissionLevel,
            isActive: userFormData.isActive
          }
        : {
            steamId: userFormData.steamId,
            username: userFormData.username,
            permissionLevel: userFormData.permissionLevel
          };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadStaffUsers();
        closeUserModal();
        
        const actionText = userModalType === 'edit' ? 'updated' : 'added';
        showCustomAlert(
          '✅ User Saved',
          `Staff user "${userFormData.username}" has been ${actionText} successfully.`,
          'success'
        );
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showCustomAlert(
          '❌ Save Failed',
          `Failed to save user: ${errorData.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showCustomAlert(
        '❌ Network Error',
        `Error saving user: ${error.message}`,
        'error'
      );
    }
  };

  const deactivateUser = async (userId, username, userPermissionLevel) => {
    // Check if user is trying to deactivate themselves
    if (userId === user.id) {
      showCustomAlert(
        '⚠️ Cannot Deactivate Self',
        'You cannot deactivate your own account for security reasons.',
        'warning'
      );
      return;
    }

    // Check if current user can manage this user based on permission hierarchy
    if (user.permissionLevel === 'admin' && (userPermissionLevel === 'admin' || userPermissionLevel === 'owner')) {
      showCustomAlert(
        '⚠️ Insufficient Permissions',
        `As an admin, you cannot deactivate other ${userPermissionLevel}s. Only owners can manage admins.`,
        'warning'
      );
      return;
    }

    showCustomConfirm(
      '🚫 Deactivate User',
      `Are you sure you want to deactivate staff user "${username}"?\n\nThey will lose access to the staff dashboard immediately. This action can be reversed by editing the user.`,
      async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/staff/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (response.ok) {
            await loadStaffUsers();
            showCustomAlert(
              '✅ User Deactivated',
              `Staff user "${username}" has been deactivated successfully.`,
              'success'
            );
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            showCustomAlert(
              '❌ Deactivation Failed',
              `Failed to deactivate user: ${errorData.error || 'Unknown error'}`,
              'error'
            );
          }
        } catch (error) {
          console.error('Error deactivating user:', error);
          showCustomAlert(
            '❌ Network Error',
            `Error deactivating user: ${error.message}`,
            'error'
          );
        }
      },
      null,
      'warning'
    );
  };

  const openReviewModal = (item, action, type) => {
    setReviewItem({ ...item, type }); // Add type (rule or announcement)
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewItem(null);
    setReviewAction('');
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!reviewItem || !reviewAction) return;

    if (reviewAction === 'reject' && (!reviewNotes || reviewNotes.trim() === '')) {
      showCustomAlert('Review Notes Required', 'Please provide review notes when rejecting content.', 'error');
      return;
    }

    try {
      const endpoint = reviewItem.type === 'rule' 
        ? `${BASE_URL}/api/staff/rules/${reviewItem.id}/${reviewAction}`
        : `${BASE_URL}/api/staff/announcements/${reviewItem.id}/${reviewAction}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reviewNotes: reviewNotes.trim() })
      });

      if (response.ok) {
        showCustomAlert(
          `${reviewItem.type === 'rule' ? 'Rule' : 'Announcement'} ${reviewAction === 'approve' ? 'Approved' : 'Rejected'}`,
          `The ${reviewItem.type} has been ${reviewAction}d successfully.`,
          'success'
        );
        closeReviewModal();
        await loadPendingApprovals(); // Refresh the list
        await loadRules(); // Refresh rules list
        await loadAnnouncements(); // Refresh announcements list
      } else {
        const errorData = await response.json();
        showCustomAlert('Error', errorData.error || `Failed to ${reviewAction} ${reviewItem.type}`, 'error');
      }
    } catch (error) {
      console.error(`Error ${reviewAction}ing ${reviewItem.type}:`, error);
      showCustomAlert('Error', `Failed to ${reviewAction} ${reviewItem.type}`, 'error');
    }
  };

  // Debug function to change permission level quickly
  const changeDebugPermissionLevel = (newLevel) => {
    setUser(prevUser => ({
      ...prevUser,
      permissionLevel: newLevel
    }));
    
    // Reload data to reflect new permissions
    loadDashboardData();
    
    showCustomAlert(
      '🔧 Debug Mode',
      `Permission level changed to: ${newLevel.toUpperCase()}\n\nData refreshed to reflect new permissions.`,
      'success'
    );
  };

  // Discord integration functions
  const loadDiscordSettings = async () => {
    try {
      setLoadingDiscord(true);
      const response = await fetch(`${BASE_URL}/api/discord/settings`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiscordSettings({
          announcementWebhookUrl: data.announcementWebhookUrl || '',
          rulesWebhookUrl: data.rulesWebhookUrl || '',
          announcementsEnabled: data.announcementsEnabled || false,
          rulesEnabled: data.rulesEnabled || false,
          emergencyRoleId: data.emergencyRoleId || '',
          defaultChannelType: data.defaultChannelType || 'announcements',
          embedColor: data.embedColor || '#677bae'
        });
      } else {
        console.error('Failed to load Discord settings');
      }
    } catch (error) {
      console.error('Error loading Discord settings:', error);
    } finally {
      setLoadingDiscord(false);
    }
  };

  const saveDiscordSettings = async () => {
    try {
      setLoadingDiscord(true);
      const response = await fetch(`${BASE_URL}/api/discord/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(discordSettings)
      });

      if (response.ok) {
        showCustomAlert(
          '✅ Settings Saved',
          'Discord integration settings have been updated successfully.',
          'success'
        );
      } else {
        const error = await response.json();
        showCustomAlert(
          '❌ Save Failed',
          `Failed to save Discord settings: ${error.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving Discord settings:', error);
      showCustomAlert(
        '❌ Save Failed',
        `Error saving Discord settings: ${error.message}`,
        'error'
      );
    } finally {
      setLoadingDiscord(false);
    }
  };

  const testDiscordWebhook = async (webhookType) => {
    try {
      setTestingWebhook(true);
      const response = await fetch(`${BASE_URL}/api/discord/webhook/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          webhookType,
          webhookUrl: webhookType === 'announcements' ? discordSettings.announcementWebhookUrl : discordSettings.rulesWebhookUrl
        })
      });

      if (response.ok) {
        showCustomAlert(
          '✅ Webhook Tested',
          `The ${webhookType} webhook was tested successfully.`,
          'success'
        );
      } else {
        const error = await response.json();
        showCustomAlert(
          '❌ Test Failed',
          `Failed to test ${webhookType} webhook: ${error.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error testing Discord webhook:', error);
      showCustomAlert(
        '❌ Test Failed',
        `Error testing Discord webhook: ${error.message}`,
        'error'
      );
    } finally {
      setTestingWebhook(false);
    }
  };

  const sendAnnouncementToDiscord = async (announcementId) => {
    try {
      setSendingToDiscord(true);
      const response = await fetch(`${BASE_URL}/api/discord/announcements/${announcementId}/send`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        showCustomAlert(
          '✅ Announcement Sent',
          'The announcement has been sent to Discord successfully.',
          'success'
        );
      } else {
        const error = await response.json();
        showCustomAlert(
          '❌ Send Failed',
          `Failed to send announcement to Discord: ${error.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending announcement to Discord:', error);
      showCustomAlert(
        '❌ Send Failed',
        `Error sending announcement to Discord: ${error.message}`,
        'error'
      );
    } finally {
      setSendingToDiscord(false);
    }
  };

  const sendRuleToDiscord = async (ruleId, action = 'update') => {
    try {
      setSendingToDiscord(true);
      const response = await fetch(`${BASE_URL}/api/discord/rules/${ruleId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        showCustomAlert(
          '✅ Rule Sent',
          `The rule ${action} has been sent to Discord successfully.`,
          'success'
        );
      } else {
        const error = await response.json();
        showCustomAlert(
          '❌ Send Failed',
          `Failed to send rule to Discord: ${error.error || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending rule to Discord:', error);
      showCustomAlert(
        '❌ Send Failed',
        `Error sending rule to Discord: ${error.message}`,
        'error'
      );
    } finally {
      setSendingToDiscord(false);
    }
  };

  // Note: Rule Discord notifications are now automatic on the backend
  // They trigger when rules are created/edited by moderators+ or when rules get approved

  const loadDiscordMessages = async () => {
    try {
      setLoadingDiscordMessages(true);
      const response = await fetch(`${BASE_URL}/api/discord/messages?filter=${discordMessageFilter}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDiscordMessages(data);
      } else {
        console.error('Failed to load Discord messages');
      }
    } catch (error) {
      console.error('Error loading Discord messages:', error);
    } finally {
      setLoadingDiscordMessages(false);
    }
  };

  const handleColorChange = (color) => {
    setDiscordSettings(prevSettings => ({
      ...prevSettings,
      embedColor: color.hex
    }));
  };

  const handleColorInputChange = (e) => {
    const newColor = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      setDiscordSettings(prevSettings => ({
        ...prevSettings,
        embedColor: newColor
      }));
    }
  };

  const handleColorClick = (color) => {
    setDiscordSettings(prevSettings => ({
      ...prevSettings,
      embedColor: color
    }));
  };

  if (loading && !user) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#bdc3c7' }}>
          Loading staff dashboard...
        </div>
      </DashboardContainer>
    );
  }

  if (!user) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
          Authentication required. Redirecting...
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <FloatingParticles />
      <Header>
        <HeaderTitle>Staff Management Dashboard</HeaderTitle>
        <UserInfo>
          <UserName>{user.steam_username || user.username}</UserName>
          <UserRole>{user.permissionLevel}</UserRole>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button 
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              style={{ 
                backgroundColor: showDebugPanel ? '#e74c3c' : '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {showDebugPanel ? '🔴 Debug' : '🔧 Debug'}
            </button>
            <button 
              onClick={logout}
              style={{ 
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </UserInfo>
      </Header>

      {/* Debug Panel */}
      {showDebugPanel && (
        <DebugPanel>
          <DebugHeader>
            <DebugTitle>
              🔧 Debug Panel
            </DebugTitle>
            <DebugToggle onClick={() => setShowDebugPanel(false)}>
              ×
            </DebugToggle>
          </DebugHeader>
          <DebugContent show={showDebugPanel}>
            <DebugCurrentLevel>
              Current: {user.permissionLevel.toUpperCase()}
            </DebugCurrentLevel>
            <DebugLevelGrid>
              <DebugLevelButton 
                active={user.permissionLevel === 'editor'}
                onClick={() => changeDebugPermissionLevel('editor')}
                disabled={user.permissionLevel === 'editor'}
              >
                Editor
              </DebugLevelButton>
              <DebugLevelButton 
                active={user.permissionLevel === 'moderator'}
                onClick={() => changeDebugPermissionLevel('moderator')}
                disabled={user.permissionLevel === 'moderator'}
              >
                Moderator
              </DebugLevelButton>
              <DebugLevelButton 
                active={user.permissionLevel === 'admin'}
                onClick={() => changeDebugPermissionLevel('admin')}
                disabled={user.permissionLevel === 'admin'}
              >
                Admin
              </DebugLevelButton>
              <DebugLevelButton 
                active={user.permissionLevel === 'owner'}
                onClick={() => changeDebugPermissionLevel('owner')}
                disabled={user.permissionLevel === 'owner'}
              >
                Owner
              </DebugLevelButton>
            </DebugLevelGrid>
            <DebugFeatureList>
              <h5>Available Features:</h5>
              <ul>
                {user.permissionLevel === 'editor' && (
                  <>
                    <li>✅ View Rules (approved + own drafts)</li>
                    <li>✅ Create Rules (pending approval)</li>
                    <li>✅ View Announcements (approved only)</li>
                    <li>✅ Create Announcements (pending approval)</li>
                    <li>❌ Approval Dashboard</li>
                    <li>❌ User Management</li>
                  </>
                )}
                {user.permissionLevel === 'moderator' && (
                  <>
                    <li>✅ View All Rules</li>
                    <li>✅ Create Rules (auto-approved)</li>
                    <li>✅ View All Announcements</li>
                    <li>✅ Create Announcements (auto-approved)</li>
                    <li>✅ Approval Dashboard</li>
                    <li>❌ User Management</li>
                  </>
                )}
                {(user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                  <>
                    <li>✅ Full Rule Management</li>
                    <li>✅ Full Announcement Management</li>
                    <li>✅ Approval Dashboard</li>
                    <li>✅ User Management</li>
                    <li>✅ Category Management</li>
                  </>
                )}
              </ul>
            </DebugFeatureList>
          </DebugContent>
        </DebugPanel>
      )}

      <TabContainer>
        <TabNavigation>
          <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>
            Activity Log
          </TabButton>
          <TabButton active={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
            Rules Management
          </TabButton>
          <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')}>
          Announcements
          </TabButton>
          {(user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
            <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>
              Categories
            </TabButton>
          )}
          {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
            <TabButton active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')}>
              Approvals
            </TabButton>
          )}
          {(user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              User Management
            </TabButton>
          )}
          {(user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
            <TabButton active={activeTab === 'discord'} onClick={() => setActiveTab('discord')}>
              Discord Integration
            </TabButton>
          )}
        </TabNavigation>
        
        <TabContent>
          {activeTab === 'log' && (
            <div>
              <RulesHeader>
                <h2>Activity Log</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <RefreshButton onClick={loadActivityLog} disabled={loadingDashboard}>
                    {loadingDashboard ? '🔄 Refreshing...' : '🔄 Refresh Log'}
                  </RefreshButton>
                </div>
              </RulesHeader>

              {loadingDashboard ? (
                <LoadingSpinner>
                  <div>🔄 Loading activity log...</div>
                </LoadingSpinner>
              ) : (
                <DashboardCard style={{ maxWidth: 'none' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#ecf0f1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📈 Recent Changes
                  </h3>
                  
                  {(() => {
                    // Combine and sort all changes/activities by date
                    const allChanges = [];
                    
                    // Add rule changes (from rule_changes table) - these have more detail
                    recentChanges.forEach(change => {
                      allChanges.push({
                        type: 'rule_change',
                        date: new Date(change.created_at),
                        data: change
                      });
                    });
                    
                    // Add meaningful activities (from activity logs) - these catch other actions
                    const meaningfulActivity = recentActivity.filter(activity => 
                      ['create', 'update', 'delete', 'upload', 'publish', 'schedule'].includes(activity.action_type)
                    );
                    
                    meaningfulActivity.forEach(activity => {
                      // Only add if we don't already have a rule_change for this action
                      const existingRuleChange = recentChanges.find(change => 
                        change.rule_id === activity.resource_id && 
                        Math.abs(new Date(change.created_at) - new Date(activity.created_at)) < 10000 // within 10 seconds
                      );
                      
                      if (!existingRuleChange) {
                        allChanges.push({
                          type: 'activity',
                          date: new Date(activity.created_at),
                          data: activity
                        });
                      }
                    });
                    
                    // Sort by date (newest first)
                    allChanges.sort((a, b) => b.date - a.date);
                    
                    // Take the most recent 20 items
                    const combinedChanges = allChanges.slice(0, 20);
                    
                    if (combinedChanges.length > 0) {
                      return (
                        <ChangesList>
                          {combinedChanges.map((item, index) => {
                            if (item.type === 'rule_change') {
                              const change = item.data;
                              return (
                                <ChangeItem key={`change-${index}`} type={change.change_type || 'update'}>
                                  <ChangeHeader>
                                    <ChangeAction type={change.change_type || 'update'}>
                                      {(change.change_type || 'RULE UPDATE').toUpperCase()}
                                    </ChangeAction>
                                    <ChangeTime>
                                      {new Date(change.created_at).toLocaleDateString()}
                                    </ChangeTime>
                                  </ChangeHeader>
                                  <ChangeTarget>
                                    {change.full_code ? (
                                      <RuleLink onClick={() => navigateToRule(change.rule_id, change.full_code)}>
                                        {change.full_code}
                                      </RuleLink>
                                    ) : (
                                      <RuleLink onClick={() => navigateToRule(change.rule_id, `Rule #${change.rule_id}`)}>
                                        Rule #{change.rule_id}
                                      </RuleLink>
                                    )}
                                    {change.rule_title && (
                                      <span style={{ color: '#8a9dc9', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                                        - {change.rule_title}
                                      </span>
                                    )}
                                  </ChangeTarget>
                                  <div style={{ color: '#bdc3c7', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    Category: {change.category_name || 'Unknown'} • By: {change.steam_username || 'Unknown Staff'}
                                  </div>
                                  
                                  {/* Show detailed changes */}
                                  {change.change_type === 'created' && (
                                    <div style={{ 
                                      color: '#27ae60', 
                                      fontSize: '0.85rem', 
                                      marginTop: '0.5rem',
                                      backgroundColor: 'rgba(39, 174, 96, 0.1)',
                                      padding: '0.5rem',
                                      borderRadius: '4px',
                                      borderLeft: '3px solid #27ae60'
                                    }}>
                                      ✅ <strong>New rule created</strong>
                                      {change.new_content && (
                                        <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                                          "{change.new_content.substring(0, 100).replace(/<[^>]*>/g, '')}..."
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {change.change_type === 'updated' && (
                                    <div style={{ 
                                      color: '#f39c12', 
                                      fontSize: '0.85rem', 
                                      marginTop: '0.5rem',
                                      backgroundColor: 'rgba(243, 156, 18, 0.1)',
                                      padding: '0.5rem',
                                      borderRadius: '4px',
                                      borderLeft: '3px solid #f39c12'
                                    }}>
                                      ✏️ <strong>Rule content updated</strong>
                                      {change.old_content && change.new_content && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                          <div style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Before:</span>
                                            <div style={{ fontStyle: 'italic', color: '#bdc3c7' }}>
                                              "{change.old_content.substring(0, 80).replace(/<[^>]*>/g, '')}..."
                                            </div>
                                          </div>
                                          <div>
                                            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>After:</span>
                                            <div style={{ fontStyle: 'italic', color: '#bdc3c7' }}>
                                              "{change.new_content.substring(0, 80).replace(/<[^>]*>/g, '')}..."
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {change.change_description && change.change_description !== 'Rule updated' && (
                                        <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                                          Note: {change.change_description}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {change.change_type === 'deleted' && (
                                    <div style={{ 
                                      color: '#e74c3c', 
                                      fontSize: '0.85rem', 
                                      marginTop: '0.5rem',
                                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                                      padding: '0.5rem',
                                      borderRadius: '4px',
                                      borderLeft: '3px solid #e74c3c'
                                    }}>
                                      🗑️ <strong>Rule deleted</strong>
                                      {change.old_content && (
                                        <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                                          Previous content: "{change.old_content.substring(0, 100).replace(/<[^>]*>/g, '')}..."
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {change.description && change.description !== 'Rule created' && change.description !== 'Rule updated' && change.description !== 'Rule deleted' && (
                                    <div style={{ color: '#bdc3c7', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                      {change.description}
                                    </div>
                                  )}
                                </ChangeItem>
                              );
                            } else {
                              const activity = item.data;
                              return (
                                <ChangeItem key={`activity-${index}`} type={activity.action_type}>
                                  <ChangeHeader>
                                    <ChangeAction type={activity.action_type}>
                                      {activity.action_type.toUpperCase()}
                                    </ChangeAction>
                                    <ChangeTime>
                                      {new Date(activity.created_at).toLocaleDateString()}
                                    </ChangeTime>
                                  </ChangeHeader>
                                  <ChangeTarget>
                                    {activity.steam_username || 'Staff'} {activity.action_type}d {activity.resource_type}
                                    {activity.resource_name && `: ${activity.resource_name}`}
                                  </ChangeTarget>
                                  <div style={{ color: '#bdc3c7', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    {activity.action_type === 'create' && 'New content created'}
                                    {activity.action_type === 'update' && 'Content updated'}
                                    {activity.action_type === 'delete' && 'Content deleted'}
                                    {activity.action_type === 'upload' && 'Media uploaded'}
                                    {activity.action_type === 'publish' && 'Published to homepage'}
                                    {activity.action_type === 'schedule' && 'Scheduled for later'}
                                  </div>
                                </ChangeItem>
                              );
                            }
                          })}
                        </ChangesList>
                      );
                    } else {
                      return (
                        <EmptyState>
                          No recent changes to display
                          <br />
                          <small style={{ color: '#8a9dc9', marginTop: '0.5rem', display: 'block' }}>
                            Create, edit, or delete content to see changes here.
                          </small>
                        </EmptyState>
                      );
                    }
                  })()}
                </DashboardCard>
              )}
            </div>
          )}
          
          {activeTab === 'rules' && (
            <div>
              <RulesHeader>
                <h2>Rules Management</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.letter_code} - {cat.name}
                      </option>
                    ))}
                  </Select>
                  <Button onClick={openCreateModal}>Add New Rule</Button>
                </div>
              </RulesHeader>
              
              {/* Search Bar */}
              <SearchContainer>
                <SearchIcon>🔍</SearchIcon>
                <SearchInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rules by title, content, or rule code..."
                  style={{ 
                    width: '100%',
                    maxWidth: '500px',
                  }}
                />
              </SearchContainer>
              
              {/* Search Results Count */}
              {searchQuery.trim() && (
                <SearchResultsCount>
                  Found {filteredRules.filter(rule => !selectedCategory || rule.category_id == selectedCategory).length} rule(s) matching "{searchQuery}"
                </SearchResultsCount>
              )}
              
              <RulesList>
                {filteredRules
                  .filter(rule => !selectedCategory || rule.category_id == selectedCategory)
                  .map(rule => (
                    <div key={rule.id}>
                      <RuleCard 
                        data-rule-id={rule.id}
                        highlighted={highlightedRuleId === rule.id}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <RuleCode>{rule.full_code}</RuleCode>
                            
                            {/* Status Indicator */}
                            {rule.status && (
                              <RuleCode style={{ 
                                backgroundColor: rule.status === 'approved' ? '#27ae60' : 
                                                rule.status === 'pending_approval' ? '#f39c12' : 
                                                rule.status === 'draft' ? '#3498db' : 
                                                rule.status === 'rejected' ? '#e74c3c' : '#95a5a6',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}>
                                {rule.status === 'approved' && '✅ Live'}
                                {rule.status === 'pending_approval' && '⏳ Pending'}
                                {rule.status === 'draft' && '📝 Draft'}
                                {rule.status === 'rejected' && '❌ Rejected'}
                              </RuleCode>
                            )}
                            
                            {/* Review Notes Indicator */}
                            {rule.review_notes && (
                              <RuleCode style={{ 
                                backgroundColor: '#8a9dc9',
                                color: 'white',
                                fontSize: '0.7rem',
                                cursor: 'help'
                              }}
                              title={`Review Notes: ${rule.review_notes}`}>
                                💬 Notes
                              </RuleCode>
                            )}
                          </div>
                          
                          {rule.title && (
                            <RuleTitle>{rule.title}</RuleTitle>
                          )}
                          
                          {/* Review Notes Display */}
                          {rule.review_notes && (
                            <div style={{ 
                              backgroundColor: 'rgba(138, 157, 201, 0.1)',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              marginBottom: '1rem',
                              borderLeft: '3px solid #8a9dc9'
                            }}>
                              <div style={{ color: '#8a9dc9', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                💬 Review Notes:
                              </div>
                              <div style={{ color: '#bdc3c7', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                {rule.review_notes}
                              </div>
                              {rule.reviewed_at && (
                                <div style={{ color: '#8a9dc9', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                  Reviewed: {new Date(rule.reviewed_at).toLocaleDateString()}
                                  {rule.reviewed_by_username && ` by ${rule.reviewed_by_username}`}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <RuleContent 
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(rule.content) }}
                        />
                        
                        {(() => {
                          let images = [];
                          try {
                            if (rule.images) {
                              images = Array.isArray(rule.images) ? rule.images : JSON.parse(rule.images);
                            }
                          } catch (e) {
                            console.error('Error parsing rule images:', e, 'Raw images:', rule.images);
                            images = [];
                          }
                          
                          return images && images.length > 0 && (
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                              gap: '0.5rem',
                              marginTop: '1rem',
                              marginBottom: '1rem'
                            }}>
                              {images.map((image, index) => (
                                <img 
                                  key={index}
                                  src={`${BASE_URL}${image.thumbnailUrl}`}
                                  alt={image.originalName}
                                  style={{ 
                                    width: '100%', 
                                    height: '80px', 
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid #445566',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(`${BASE_URL}${image.url}`, '_blank')}
                                />
                              ))}
                            </div>
                          );
                        })()}
                        
                        <RuleActions>
                          <ActionButton onClick={() => openEditModal(rule)}>Edit</ActionButton>
                          {rule.sub_rules && rule.sub_rules.length > 0 ? (
                            <ExpandButton 
                              onClick={() => toggleRuleExpansion(rule.id)}
                              $expanded={expandedRules.has(rule.id)}
                            >
                              {expandedRules.has(rule.id) ? 'Hide Sub-Rules' : `Show Sub-Rules (${rule.sub_rules.length})`}
                            </ExpandButton>
                          ) : (
                            <ActionButton onClick={() => openSubRuleModal(rule)}>Add Sub-Rule</ActionButton>
                          )}
                          <ActionButton onClick={() => openCrossReferencesModal(rule)}>Cross-References ({rule.cross_references_count || 0})</ActionButton>
                          {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                            <ActionButton danger onClick={() => deleteRule(rule.id)}>Delete</ActionButton>
                          )}
                        </RuleActions>
                      </RuleCard>
                      
                      {/* Display sub-rules - only when expanded */}
                      {rule.sub_rules && rule.sub_rules.length > 0 && expandedRules.has(rule.id) && (
                        <SubRuleContainer>
                          {rule.sub_rules.map(subRule => (
                            <SubRuleCard 
                              key={subRule.id}
                              data-rule-id={subRule.id}
                              highlighted={highlightedRuleId === subRule.id}
                            >
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'flex-start',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    <RuleCode style={{ backgroundColor: '#5a6c7d', fontSize: '0.8rem' }}>
                                      {subRule.full_code}
                                    </RuleCode>
                                    
                                    {/* Status Indicator for Sub-Rule */}
                                    {subRule.status && (
                                      <RuleCode style={{ 
                                        backgroundColor: subRule.status === 'approved' ? '#27ae60' : 
                                                        subRule.status === 'pending_approval' ? '#f39c12' : 
                                                        subRule.status === 'draft' ? '#3498db' : 
                                                        subRule.status === 'rejected' ? '#e74c3c' : '#95a5a6',
                                        color: 'white',
                                        fontSize: '0.6rem'
                                      }}>
                                        {subRule.status === 'approved' && '✅ Live'}
                                        {subRule.status === 'pending_approval' && '⏳ Pending'}
                                        {subRule.status === 'draft' && '📝 Draft'}
                                        {subRule.status === 'rejected' && '❌ Rejected'}
                                      </RuleCode>
                                    )}
                                    
                                    {/* Review Notes Indicator for Sub-Rule */}
                                    {subRule.review_notes && (
                                      <RuleCode style={{ 
                                        backgroundColor: '#8a9dc9',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        cursor: 'help'
                                      }}
                                      title={`Review Notes: ${subRule.review_notes}`}>
                                        💬 Notes
                                      </RuleCode>
                                    )}
                                  </div>
                                  
                                  {subRule.title && (
                                    <RuleTitle style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                                      {subRule.title}
                                    </RuleTitle>
                                  )}
                                  
                                  {/* Review Notes Display for Sub-Rule */}
                                  {subRule.review_notes && (
                                    <div style={{ 
                                      backgroundColor: 'rgba(138, 157, 201, 0.1)',
                                      padding: '0.75rem',
                                      borderRadius: '6px',
                                      marginBottom: '1rem',
                                      borderLeft: '3px solid #8a9dc9'
                                    }}>
                                      <div style={{ color: '#8a9dc9', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        💬 Review Notes:
                                      </div>
                                      <div style={{ color: '#bdc3c7', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        {subRule.review_notes}
                                      </div>
                                      {subRule.reviewed_at && (
                                        <div style={{ color: '#8a9dc9', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                          Reviewed: {new Date(subRule.reviewed_at).toLocaleDateString()}
                                          {subRule.reviewed_by_username && ` by ${subRule.reviewed_by_username}`}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <RuleContent 
                                dangerouslySetInnerHTML={{ __html: markdownToHtml(subRule.content) }}
                              />
                              
                              {(() => {
                                let subImages = [];
                                try {
                                  if (subRule.images) {
                                    subImages = Array.isArray(subRule.images) ? subRule.images : JSON.parse(subRule.images);
                                  }
                                } catch (e) {
                                  console.error('Error parsing sub-rule images:', e);
                                  subImages = [];
                                }
                                
                                return subImages && subImages.length > 0 && (
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                                    gap: '0.5rem',
                                    marginTop: '1rem',
                                    marginBottom: '1rem'
                                  }}>
                                    {subImages.map((image, index) => (
                                      <img 
                                        key={index}
                                        src={`${BASE_URL}${image.thumbnailUrl}`}
                                        alt={image.originalName}
                                        style={{ 
                                          width: '100%', 
                                          height: '80px', 
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                          border: '1px solid #445566',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => window.open(`${BASE_URL}${image.url}`, '_blank')}
                                      />
                                    ))}
                                  </div>
                                );
                              })()}
                              
                              <RuleActions>
                                <ActionButton onClick={() => openEditModal(subRule)}>Edit</ActionButton>
                                <ActionButton onClick={() => openCrossReferencesModal(subRule)}>Cross-References</ActionButton>
                                {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                                  <ActionButton danger onClick={() => deleteRule(subRule.id)}>Delete</ActionButton>
                                )}
                              </RuleActions>
                            </SubRuleCard>
                          ))}
                          <div style={{ marginTop: '1rem' }}>
                            <ActionButton 
                              onClick={() => openSubRuleModal(rule)}
                              style={{ backgroundColor: '#27ae60' }}
                            >
                              + Add Another Sub-Rule
                            </ActionButton>
                          </div>
                        </SubRuleContainer>
                      )}
                    </div>
                  ))
                }
              </RulesList>
              
              {rules.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                  No rules found. Click "Add New Rule" to get started.
                </div>
              )}
              
              {rules.length > 0 && filteredRules.filter(rule => !selectedCategory || rule.category_id == selectedCategory).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                  {searchQuery.trim() 
                    ? `No rules match your search "${searchQuery}".`
                    : selectedCategory 
                      ? 'No rules found in the selected category.'
                      : 'No rules found.'
                  }
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'announcements' && (
            <div>
              <RulesHeader>
                <h2>Announcements Management</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Select 
                    value=""
                    onChange={(e) => {
                      // Could add filtering by priority here
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="5">Emergency (5)</option>
                    <option value="4">Critical (4)</option>
                    <option value="3">High (3)</option>
                    <option value="2">Normal (2)</option>
                    <option value="1">Low (1)</option>
                  </Select>
                  <Button onClick={openCreateAnnouncementModal}>Add New Announcement</Button>
                </div>
              </RulesHeader>

              {/* Toggle between Published and Scheduled */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '2rem',
                backgroundColor: '#2c3e50',
                padding: '0.5rem',
                borderRadius: '8px',
                width: 'fit-content'
              }}>
                <Button 
                  onClick={() => {/* Toggle to published */}}
                  style={{ 
                    backgroundColor: '#677bae',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  📢 Published ({announcements.length})
                </Button>
                <Button 
                  onClick={() => {/* Toggle to scheduled */}}
                  style={{ 
                    backgroundColor: '#34495e',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  ⏰ Scheduled (0)
                </Button>
              </div>

              <RulesList>
                {announcements.map(announcement => (
                  <RuleCard key={announcement.id}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <RuleTitle>{announcement.title}</RuleTitle>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <RuleCode>Priority: {announcement.priority}</RuleCode>
                            
                            {/* Status Indicator */}
                            {announcement.status && (
                              <RuleCode style={{ 
                                backgroundColor: announcement.status === 'approved' ? '#27ae60' : 
                                                announcement.status === 'pending_approval' ? '#f39c12' : 
                                                announcement.status === 'draft' ? '#3498db' : 
                                                announcement.status === 'rejected' ? '#e74c3c' : '#95a5a6',
                                color: 'white'
                              }}>
                                {announcement.status === 'approved' && '✅ Live'}
                                {announcement.status === 'pending_approval' && '⏳ Pending'}
                                {announcement.status === 'draft' && '📝 Draft'}
                                {announcement.status === 'rejected' && '❌ Rejected'}
                              </RuleCode>
                            )}
                            
                            <RuleCode style={{ 
                              backgroundColor: announcement.is_active ? '#27ae60' : '#e74c3c',
                              color: 'white'
                            }}>
                              {announcement.is_active ? 'Active' : 'Inactive'}
                            </RuleCode>
                            
                            {/* Review Notes Indicator */}
                            {announcement.review_notes && (
                              <RuleCode style={{ 
                                backgroundColor: '#8a9dc9',
                                color: 'white',
                                fontSize: '0.8rem',
                                cursor: 'help'
                              }}
                              title={`Review Notes: ${announcement.review_notes}`}>
                                💬 Notes
                              </RuleCode>
                            )}
                            
                            {announcement.announcement_type === 'scheduled' && (
                              <RuleCode style={{ 
                                backgroundColor: '#f39c12',
                                color: 'white'
                              }}>
                                📅 Scheduled
                              </RuleCode>
                            )}
                            {announcement.is_scheduled === 1 && (
                              <RuleCode style={{ 
                                backgroundColor: '#9b59b6',
                                color: 'white'
                              }}>
                                ⏰ {announcement.is_published ? 'Published' : 'Pending'}
                              </RuleCode>
                            )}
                          </div>
                          
                          {/* Review Notes Display */}
                          {announcement.review_notes && (
                            <div style={{ 
                              backgroundColor: 'rgba(138, 157, 201, 0.1)',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              marginTop: '1rem',
                              borderLeft: '3px solid #8a9dc9'
                            }}>
                              <div style={{ color: '#8a9dc9', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                💬 Review Notes:
                              </div>
                              <div style={{ color: '#bdc3c7', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                {announcement.review_notes}
                              </div>
                              {announcement.reviewed_at && (
                                <div style={{ color: '#8a9dc9', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                  Reviewed: {new Date(announcement.reviewed_at).toLocaleDateString()}
                                  {announcement.reviewed_by_username && ` by ${announcement.reviewed_by_username}`}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {announcement.scheduled_for && (
                            <div style={{ 
                              color: '#8a9dc9', 
                              fontSize: '0.9rem', 
                              marginTop: '0.5rem',
                              fontStyle: 'italic'
                            }}>
                              📅 Scheduled for: {new Date(announcement.scheduled_for).toLocaleString()}
                            </div>
                          )}
                          {announcement.auto_expire_hours && (
                            <div style={{ 
                              color: '#8a9dc9', 
                              fontSize: '0.9rem', 
                              marginTop: '0.25rem',
                              fontStyle: 'italic'
                            }}>
                              ⏱️ Auto-expires after: {announcement.auto_expire_hours} hours
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <RuleContent 
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(announcement.content) }}
                      />
                      
                      <div style={{ 
                        color: '#8a9dc9', 
                        fontSize: '0.8rem', 
                        marginTop: '1rem',
                        borderTop: '1px solid #445566',
                        paddingTop: '0.5rem'
                      }}>
                        Created: {new Date(announcement.created_at).toLocaleDateString()}
                        {announcement.updated_at !== announcement.created_at && (
                          <span> • Updated: {new Date(announcement.updated_at).toLocaleDateString()}</span>
                        )}
                        {announcement.published_at && (
                          <span> • Published: {new Date(announcement.published_at).toLocaleDateString()}</span>
                        )}
                        {announcement.created_by_username && (
                          <span> • Created by: {announcement.created_by_username}</span>
                        )}
                      </div>
                    </div>
                    
                    <RuleActions>
                      {announcement.announcement_type === 'scheduled' && !announcement.is_published && (
                        <ActionButton 
                          onClick={() => publishScheduledAnnouncementNow(announcement.id, announcement.title)}
                          style={{ backgroundColor: '#27ae60' }}
                        >
                          Publish Now
                        </ActionButton>
                      )}
                      
                      {/* Send to Discord Button - Only for approved/live announcements and moderators+ */}
                      {(announcement.status === 'approved' || !announcement.status) && announcement.is_active && 
                       discordSettings.announcementsEnabled && discordSettings.announcementWebhookUrl &&
                       (user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                        <ActionButton 
                          onClick={() => sendAnnouncementToDiscord(announcement.id)}
                          disabled={sendingToDiscord}
                          style={{ backgroundColor: '#5865F2' }}
                          title="Send this announcement to Discord"
                        >
                          {sendingToDiscord ? '📤 Sending...' : '📢 Send to Discord'}
                        </ActionButton>
                      )}
                      
                      <ActionButton onClick={() => openEditAnnouncementModal(announcement)}>Edit</ActionButton>
                      <ActionButton onClick={() => sendAnnouncementToDiscord(announcement.id)}>Send to Discord</ActionButton>
                      {announcement.scheduled_for && !announcement.is_published && (
                        <ActionButton 
                          onClick={() => publishScheduledAnnouncementNow(announcement.id, announcement.title)}
                          style={{ backgroundColor: '#f39c12' }}
                        >
                          Publish Now
                        </ActionButton>
                      )}
                      {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                        <ActionButton danger onClick={() => deleteAnnouncement(announcement.id)}>Delete</ActionButton>
                      )}
                    </RuleActions>
                  </RuleCard>
                ))}
              </RulesList>
              
              {announcements.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                  No announcements found. Click "Add New Announcement" to get started.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'categories' && (
            <div>
              <RulesHeader>
                <h2>Categories Management</h2>
                {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                  <Button onClick={openCreateCategoryModal}>Add New Category</Button>
                )}
              </RulesHeader>

              {/* Search Bar */}
              <SearchContainer>
                <SearchIcon>🔍</SearchIcon>
                <SearchInput
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Search categories by letter code, name, or description..."
                  style={{ 
                    width: '100%',
                    maxWidth: '500px',
                  }}
                />
              </SearchContainer>

              {/* Categories List */}
              <RulesList>
                {categoriesData
                  .filter(category => 
                    !categorySearchQuery.trim() || 
                    category.letter_code.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                    category.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                    (category.description && category.description.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                  )
                  .map((category, index) => (
                    <CategoryCard 
                      key={category.id}
                      isDraggable={true}
                      isDragging={draggedCategoryIndex === index}
                      draggable={true}
                      onDragStart={(e) => handleCategoryDragStart(e, index)}
                      onDragOver={handleCategoryDragOver}
                      onDrop={(e) => handleCategoryDrop(e, index)}
                    >
                      <CategoryHeader>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <DragHandle title="Drag to reorder">⋮⋮</DragHandle>
                          <CategoryCode>{category.letter_code}</CategoryCode>
                          <CategoryInfo>
                            <CategoryName>{category.name}</CategoryName>
                            {category.description && (
                              <CategoryDescription>{category.description}</CategoryDescription>
                            )}
                            <CategoryStats>
                              <span>📋 {category.rule_count || 0} rules</span>
                              <span>📅 Created: {new Date(category.created_at).toLocaleDateString()}</span>
                              {category.updated_at !== category.created_at && (
                                <span>📝 Updated: {new Date(category.updated_at).toLocaleDateString()}</span>
                              )}
                            </CategoryStats>
                          </CategoryInfo>
                        </div>
                        <CategoryActions>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <ActionButton onClick={() => openEditCategoryModal(category)}>Edit</ActionButton>
                            {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                              <ActionButton 
                                danger 
                                onClick={() => deleteCategory(category.id, category.name, category.rule_count)}
                                disabled={category.rule_count > 0}
                                title={category.rule_count > 0 ? 'Cannot delete category with rules' : 'Delete category'}
                              >
                                Delete
                              </ActionButton>
                            )}
                          </div>
                        </CategoryActions>
                      </CategoryHeader>
                    </CategoryCard>
                  ))}
              </RulesList>
              
              {/* Empty State */}
              {categoriesData.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                  No categories found. Click "Add New Category" to get started.
                </div>
              )}

              {/* Filtered Empty State */}
              {categoriesData.length > 0 && categorySearchQuery.trim() && 
                categoriesData.filter(category => 
                  category.letter_code.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                  category.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                  (category.description && category.description.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                ).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                  No categories match your search for "{categorySearchQuery}".
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'users' && (
            <div>
              <RulesHeader>
                <h2>User Management</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <RefreshButton onClick={loadStaffUsers} disabled={loadingUsers}>
                    {loadingUsers ? '🔄 Refreshing...' : '🔄 Refresh Users'}
                  </RefreshButton>
                  {(user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                    <Button onClick={openCreateUserModal}>Add Staff User</Button>
                  )}
                </div>
              </RulesHeader>

              {loadingUsers ? (
                <LoadingSpinner>
                  <div>🔄 Loading staff users...</div>
                </LoadingSpinner>
              ) : (
                <RulesList>
                  {staffUsers.map(staffUser => (
                    <RuleCard key={staffUser.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <RuleTitle style={{ margin: 0 }}>{staffUser.steam_username}</RuleTitle>
                            <RuleCode style={{ 
                              backgroundColor: staffUser.permission_level === 'owner' ? '#9b59b6' :
                                              staffUser.permission_level === 'admin' ? '#e74c3c' : 
                                              staffUser.permission_level === 'moderator' ? '#f39c12' : '#27ae60',
                              color: 'white',
                              textTransform: 'capitalize'
                            }}>
                              {staffUser.permission_level}
                            </RuleCode>
                            <RuleCode style={{ 
                              backgroundColor: staffUser.is_active ? '#27ae60' : '#95a5a6',
                              color: 'white'
                            }}>
                              {staffUser.is_active ? 'Active' : 'Inactive'}
                            </RuleCode>
                          </div>
                          
                          <div style={{ color: '#bdc3c7', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <strong>Steam ID:</strong> {staffUser.steam_id}
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '1rem',
                            color: '#8a9dc9',
                            fontSize: '0.85rem'
                          }}>
                            <div>
                              📅 <strong>Joined:</strong> {new Date(staffUser.created_at).toLocaleDateString()}
                            </div>
                            <div>
                              🕒 <strong>Last Login:</strong> {staffUser.last_login ? new Date(staffUser.last_login).toLocaleDateString() : 'Never'}
                            </div>
                            <div>
                              📊 <strong>Total Actions:</strong> {staffUser.total_actions || 0}
                            </div>
                            <div>
                              ⚡ <strong>Recent Actions:</strong> {staffUser.recent_actions || 0} (7 days)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <RuleActions>
                        <ActionButton 
                          onClick={() => openEditUserModal(staffUser)}
                          disabled={user.permissionLevel === 'admin' && (staffUser.permission_level === 'admin' || staffUser.permission_level === 'owner')}
                          title={
                            user.permissionLevel === 'admin' && (staffUser.permission_level === 'admin' || staffUser.permission_level === 'owner')
                              ? `Cannot edit ${staffUser.permission_level}s - insufficient permissions`
                              : 'Edit user permissions and status'
                          }
                        >
                          Edit Permissions
                        </ActionButton>
                        {staffUser.id !== user.id && (user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                          <ActionButton 
                            danger 
                            onClick={() => deactivateUser(staffUser.id, staffUser.steam_username, staffUser.permission_level)}
                            disabled={
                              !staffUser.is_active || 
                              (user.permissionLevel === 'admin' && (staffUser.permission_level === 'admin' || staffUser.permission_level === 'owner'))
                            }
                            title={
                              !staffUser.is_active ? 'User already inactive' :
                              user.permissionLevel === 'admin' && (staffUser.permission_level === 'admin' || staffUser.permission_level === 'owner') ?
                              `Cannot deactivate ${staffUser.permission_level}s - insufficient permissions` :
                              'Deactivate user access'
                            }
                          >
                            {staffUser.is_active ? 'Deactivate' : 'Inactive'}
                          </ActionButton>
                        )}
                        {staffUser.id === user.id && (
                          <RuleCode style={{ 
                            backgroundColor: '#677bae',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem'
                          }}>
                            👤 This is you
                          </RuleCode>
                        )}
                      </RuleActions>
                    </RuleCard>
                  ))}
                </RulesList>
              )}
              
              {!loadingUsers && staffUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                  No staff users found. Click "Add Staff User" to get started.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'approvals' && (
            <div>
              <RulesHeader>
                <h2>Approval Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <RefreshButton onClick={loadPendingApprovals} disabled={loadingApprovals}>
                    {loadingApprovals ? '🔄 Refreshing...' : '🔄 Refresh Pending'}
                  </RefreshButton>
                  <div style={{ 
                    backgroundColor: pendingApprovals.totalPending > 0 ? '#e74c3c' : '#27ae60',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {pendingApprovals.totalPending} Pending
                  </div>
                </div>
              </RulesHeader>

              {loadingApprovals ? (
                <LoadingSpinner>
                  <div>🔄 Loading pending approvals...</div>
                </LoadingSpinner>
              ) : (
                <>
                  {/* Pending Rules Section */}
                  {pendingApprovals.rules.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ color: '#ecf0f1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📋 Pending Rules ({pendingApprovals.rules.length})
                      </h3>
                      <RulesList>
                        {pendingApprovals.rules.map(rule => (
                          <RuleCard key={`rule-${rule.id}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                  <RuleCode>{rule.full_code || `Rule #${rule.id}`}</RuleCode>
                                  <RuleCode style={{ 
                                    backgroundColor: '#f39c12',
                                    color: 'white'
                                  }}>
                                    {rule.status}
                                  </RuleCode>
                                  {rule.title && <RuleTitle style={{ margin: 0 }}>{rule.title}</RuleTitle>}
                                </div>
                                
                                <div style={{ color: '#bdc3c7', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                  <strong>Category:</strong> {rule.category_name || 'Unknown'} • 
                                  <strong> Submitted by:</strong> {rule.submitted_by_username || 'Unknown'} • 
                                  <strong> Submitted:</strong> {rule.submitted_at ? new Date(rule.submitted_at).toLocaleDateString() : 'Unknown'}
                                </div>
                                
                                <RuleContent 
                                  dangerouslySetInnerHTML={{ 
                                    __html: markdownToHtml(rule.content ? rule.content.substring(0, 300) + (rule.content.length > 300 ? '...' : '') : '') 
                                  }}
                                />
                              </div>
                            </div>
                            
                            <RuleActions>
                              <ActionButton 
                                onClick={() => openReviewModal(rule, 'approve', 'rule')}
                                style={{ backgroundColor: '#27ae60' }}
                              >
                                ✅ Approve
                              </ActionButton>
                              <ActionButton 
                                danger
                                onClick={() => openReviewModal(rule, 'reject', 'rule')}
                              >
                                ❌ Reject
                              </ActionButton>
                            </RuleActions>
                          </RuleCard>
                        ))}
                      </RulesList>
                    </div>
                  )}

                  {/* Pending Announcements Section */}
                  {pendingApprovals.announcements.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ color: '#ecf0f1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📢 Pending Announcements ({pendingApprovals.announcements.length})
                      </h3>
                      <RulesList>
                        {pendingApprovals.announcements.map(announcement => (
                          <RuleCard key={`announcement-${announcement.id}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                  <RuleTitle style={{ margin: 0 }}>{announcement.title}</RuleTitle>
                                  <RuleCode style={{ 
                                    backgroundColor: '#f39c12',
                                    color: 'white'
                                  }}>
                                    {announcement.status}
                                  </RuleCode>
                                  <RuleCode style={{ 
                                    backgroundColor: announcement.priority >= 4 ? '#e74c3c' : 
                                                    announcement.priority >= 3 ? '#f39c12' : 
                                                    announcement.priority >= 2 ? '#677bae' : '#27ae60',
                                    color: 'white'
                                  }}>
                                    Priority {announcement.priority}
                                  </RuleCode>
                                </div>
                                
                                <div style={{ color: '#bdc3c7', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                  <strong>Submitted by:</strong> {announcement.submitted_by_username || 'Unknown'} • 
                                  <strong> Submitted:</strong> {announcement.submitted_at ? new Date(announcement.submitted_at).toLocaleDateString() : 'Unknown'}
                                </div>
                                
                                <RuleContent 
                                  dangerouslySetInnerHTML={{ 
                                    __html: markdownToHtml(announcement.content ? announcement.content.substring(0, 300) + (announcement.content.length > 300 ? '...' : '') : '') 
                                  }}
                                />
                              </div>
                            </div>
                            
                            <RuleActions>
                              <ActionButton 
                                onClick={() => openReviewModal(announcement, 'approve', 'announcement')}
                                style={{ backgroundColor: '#27ae60' }}
                              >
                                ✅ Approve
                              </ActionButton>
                              <ActionButton 
                                danger
                                onClick={() => openReviewModal(announcement, 'reject', 'announcement')}
                              >
                                ❌ Reject
                              </ActionButton>
                            </RuleActions>
                          </RuleCard>
                        ))}
                      </RulesList>
                    </div>
                  )}

                  {/* No Pending Items */}
                  {pendingApprovals.totalPending === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#bdc3c7' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                      <h3 style={{ color: '#ecf0f1', marginBottom: '0.5rem' }}>All Caught Up!</h3>
                      <p>No pending submissions require your approval at this time.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'discord' && (
            <div>
              <RulesHeader>
                <h2>Discord Integration</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Button onClick={loadDiscordSettings} disabled={loadingDiscord}>
                    {loadingDiscord ? '🔄 Loading...' : '🔄 Refresh Settings'}
                  </Button>
                </div>
              </RulesHeader>

              {/* Settings Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#ecf0f1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚙️ Discord Settings
                </h3>
                
                <RuleCard>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Master Enable Toggle */}
                    <div>
                      <h4 style={{ color: '#ecf0f1', marginBottom: '1rem' }}>Master Controls</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={discordSettings.announcementsEnabled}
                            onChange={(e) => setDiscordSettings({...discordSettings, announcementsEnabled: e.target.checked})}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span style={{ color: '#ecf0f1', fontWeight: '500' }}>Enable Announcements</span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={discordSettings.rulesEnabled}
                            onChange={(e) => setDiscordSettings({...discordSettings, rulesEnabled: e.target.checked})}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span style={{ color: '#ecf0f1', fontWeight: '500' }}>Enable Rules Updates</span>
                        </label>
                      </div>
                    </div>

                    {/* Webhook URLs */}
                    <div>
                      <h4 style={{ color: '#ecf0f1', marginBottom: '1rem' }}>Webhook Configuration</h4>
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                          <Label>Announcements Webhook URL</Label>
                          <Input
                            type="text"
                            value={discordSettings.announcementWebhookUrl}
                            onChange={(e) => setDiscordSettings({...discordSettings, announcementWebhookUrl: e.target.value})}
                            placeholder="https://discord.com/api/webhooks/..."
                          />
                        </div>
                        
                        <div>
                          <Label>Rules Webhook URL</Label>
                          <Input
                            type="text"
                            value={discordSettings.rulesWebhookUrl}
                            onChange={(e) => setDiscordSettings({...discordSettings, rulesWebhookUrl: e.target.value})}
                            placeholder="https://discord.com/api/webhooks/..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div>
                      <h4 style={{ color: '#ecf0f1', marginBottom: '1rem' }}>Advanced Settings</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <Label>Emergency Role ID (Priority 5)</Label>
                          <Input
                            type="text"
                            value={discordSettings.emergencyRoleId}
                            onChange={(e) => setDiscordSettings({...discordSettings, emergencyRoleId: e.target.value})}
                            placeholder="Role ID for emergency notifications"
                          />
                        </div>
                        
                        <div>
                          <Label>Default Channel Type</Label>
                          <Select
                            value={discordSettings.defaultChannelType}
                            onChange={(e) => setDiscordSettings({...discordSettings, defaultChannelType: e.target.value})}
                          >
                            <option value="announcements">Announcements</option>
                            <option value="rules">Rules</option>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Embed Color Picker */}
                    <div>
                      <Label>Embed Color</Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 1fr)',
                          gap: '0.5rem',
                          padding: '1rem',
                          backgroundColor: '#2c3e50',
                          borderRadius: '8px',
                          border: '1px solid #445566'
                        }}>
                          {presetColors.map((color) => (
                            <div
                              key={color}
                              onClick={() => handleColorClick(color)}
                              onMouseEnter={() => setColorHover(color)}
                              onMouseLeave={() => setColorHover(null)}
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: color,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: discordSettings.embedColor === color ? '3px solid #677bae' : 
                                        colorHover === color ? '2px solid #8a9dc9' : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                              }}
                              title={color}
                            >
                              {discordSettings.embedColor === color && (
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '1.2rem'
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>Custom:</span>
                          <input
                            type="color"
                            value={discordSettings.embedColor}
                            onChange={(e) => setDiscordSettings({...discordSettings, embedColor: e.target.value})}
                            style={{
                              width: '50px',
                              height: '40px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          />
                          <Input
                            type="text"
                            value={discordSettings.embedColor}
                            onChange={handleColorInputChange}
                            onFocus={() => setColorInputFocused(true)}
                            onBlur={() => setColorInputFocused(false)}
                            style={{
                              width: '100px',
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              border: colorInputFocused ? '2px solid #677bae' : '1px solid #445566'
                            }}
                            placeholder="#677bae"
                          />
                        </div>
                      </div>
                      
                      {/* Color Preview */}
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#2c3e50',
                        borderRadius: '8px',
                        border: '1px solid #445566',
                        borderLeft: `4px solid ${discordSettings.embedColor}`
                      }}>
                        <div style={{ color: '#ecf0f1', fontWeight: '600', marginBottom: '0.5rem' }}>
                          📢 Preview Embed
                        </div>
                        <div style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>
                          This is how your Discord embeds will appear with the selected color.
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #445566' }}>
                      <Button onClick={saveDiscordSettings} disabled={loadingDiscord}>
                        {loadingDiscord ? 'Saving...' : '💾 Save Settings'}
                      </Button>
                      
                      <Button 
                        onClick={() => testDiscordWebhook('announcements')} 
                        disabled={testingWebhook || !discordSettings.announcementWebhookUrl}
                        style={{ backgroundColor: '#3498db' }}
                      >
                        {testingWebhook ? 'Testing...' : '🧪 Test Announcements Webhook'}
                      </Button>
                      
                      <Button 
                        onClick={() => testDiscordWebhook('rules')} 
                        disabled={testingWebhook || !discordSettings.rulesWebhookUrl}
                        style={{ backgroundColor: '#9b59b6' }}
                      >
                        {testingWebhook ? 'Testing...' : '🧪 Test Rules Webhook'}
                      </Button>
                    </div>
                  </div>
                </RuleCard>
              </div>

              {/* Message History Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#ecf0f1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📋 Discord Message History
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <Select
                    value={discordMessageFilter}
                    onChange={(e) => setDiscordMessageFilter(e.target.value)}
                  >
                    <option value="all">All Messages</option>
                    <option value="announcements">Announcements Only</option>
                    <option value="rules">Rules Only</option>
                  </Select>
                  
                  <Button onClick={loadDiscordMessages} disabled={loadingDiscordMessages}>
                    {loadingDiscordMessages ? '🔄 Loading...' : '🔄 Refresh Messages'}
                  </Button>
                </div>

                {loadingDiscordMessages ? (
                  <LoadingSpinner>
                    <div>🔄 Loading Discord messages...</div>
                  </LoadingSpinner>
                ) : (
                  <RulesList>
                    {discordMessages.length > 0 ? (
                      discordMessages.map((message, index) => (
                        <RuleCard key={index}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <RuleCode style={{ 
                                  backgroundColor: message.message_type === 'announcement' ? '#677bae' : '#9b59b6'
                                }}>
                                  {message.message_type === 'announcement' ? '📢 Announcement' : '📋 Rule Update'}
                                </RuleCode>
                                
                                <RuleCode style={{
                                  backgroundColor: message.delivery_status === 'sent' ? '#27ae60' : 
                                                  message.delivery_status === 'failed' ? '#e74c3c' : '#f39c12'
                                }}>
                                  {message.delivery_status === 'sent' ? '✅ Sent' : 
                                   message.delivery_status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                                </RuleCode>
                              </div>
                              
                              <div style={{ color: '#ecf0f1', fontWeight: '500', marginBottom: '0.5rem' }}>
                                {message.title || message.content?.substring(0, 50) + '...'}
                              </div>
                              
                              <div style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>
                                <strong>Sent by:</strong> {message.sender_username} • 
                                <strong> Date:</strong> {new Date(message.created_at).toLocaleString()}
                                {message.webhook_url && (
                                  <>
                                    <br />
                                    <strong>Webhook:</strong> {message.webhook_url.substring(0, 50)}...
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {message.error_message && (
                            <div style={{
                              backgroundColor: 'rgba(231, 76, 60, 0.1)',
                              color: '#e74c3c',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              marginTop: '1rem',
                              borderLeft: '3px solid #e74c3c'
                            }}>
                              <strong>Error:</strong> {message.error_message}
                            </div>
                          )}
                        </RuleCard>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#bdc3c7' }}>
                        No Discord messages found. Messages will appear here after sending announcements or rules to Discord.
                      </div>
                    )}
                  </RulesList>
                )}
              </div>
            </div>
          )}
        </TabContent>
      </TabContainer>

      {showModal && (
        <ModalBackdrop onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {modalType === 'edit' ? 'Edit Rule' : 
                 modalType === 'create-sub' ? 'Add Sub-Rule' : 
                 modalType === 'create-announcement' ? 'Add New Announcement' :
                 modalType === 'edit-announcement' ? 'Edit Announcement' : 'Add New Rule'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>
            
            {/* Rule Form */}
            {(modalType === 'create' || modalType === 'edit' || modalType === 'create-sub') && (
              <>
                <FormGroup>
                  <Label>Category</Label>
                  <Select 
                    value={formData.categoryId} 
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    disabled={modalType === 'create-sub'}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.letter_code} - {cat.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Rule Title (Optional)</Label>
                  <Input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter rule title (optional)"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Rule Content</Label>
                  <EditorContainer>
                    <MDEditor
                      value={formData.content}
                      onChange={(content) => setFormData({...formData, content: content || ''})}
                      preview="edit"
                      hideToolbar={false}
                      data-color-mode="dark"
                      commands={[
                        commands.bold,
                        commands.italic,
                        commands.strikethrough,
                        commands.hr,
                        commands.title,
                        commands.divider,
                        commands.link,
                        imageCommand,
                        textColorCommand,
                        commands.code,
                        commands.codeBlock,
                        commands.divider,
                        commands.quote,
                        commands.unorderedListCommand,
                        commands.orderedListCommand,
                        commands.checkedListCommand,
                      ]}
                    />
                  </EditorContainer>
                </FormGroup>

                {/* Image Upload Section */}
                <FormGroup>
                  <Label>Rule Images</Label>
                  <div style={{ 
                    border: '2px dashed #445566', 
                    borderRadius: '8px', 
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          uploadRuleImage(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload" 
                      style={{ 
                        cursor: 'pointer',
                        color: '#677bae',
                        textDecoration: 'underline'
                      }}
                    >
                      {uploadingImage ? '⏳ Uploading...' : '📁 Click to upload image'}
                    </label>
                    <div style={{ color: '#8a9dc9', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Supported formats: JPG, PNG, GIF (Max 10MB)
                    </div>
                  </div>
                  
                  {/* Image Previews */}
                  {ruleImages.length > 0 && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      {ruleImages.map((image, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img 
                            src={`${BASE_URL}${image.thumbnailUrl || image.url}`}
                            alt={image.originalName}
                            style={{ 
                              width: '100%', 
                              height: '80px', 
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #445566'
                            }}
                          />
                          <button
                            onClick={() => removeRuleImage(image.id)}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#8a9dc9', 
                            marginTop: '0.25rem',
                            textAlign: 'center'
                          }}>
                            {image.originalName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </FormGroup>

                {/* Approval Workflow Section - Available for all staff levels */}
                <FormGroup>
                  <Label>Submission Type</Label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    backgroundColor: '#2c3e50',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #445566'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="submissionMode"
                        value="draft"
                        checked={submissionMode === 'draft'}
                        onChange={(e) => {
                          setSubmissionMode(e.target.value);
                          setSaveAsDraft(true);
                        }}
                      />
                      <span style={{ color: '#3498db', fontWeight: '500' }}>
                        📝 Save as Draft
                      </span>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="submissionMode"
                        value="submit"
                        checked={submissionMode === 'submit'}
                        onChange={(e) => {
                          setSubmissionMode(e.target.value);
                          setSaveAsDraft(false);
                        }}
                      />
                      <span style={{ color: user.permissionLevel === 'editor' ? '#f39c12' : '#27ae60', fontWeight: '500' }}>
                        {user.permissionLevel === 'editor' ? '⏳ Submit for Approval' : '✅ Publish Live'}
                      </span>
                    </label>
                  </div>
                  
                  <div style={{ 
                    color: '#8a9dc9', 
                    fontSize: '0.85rem', 
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    {submissionMode === 'draft' ? 
                      '📝 Save as draft to continue editing later. Drafts are not visible to players.' :
                      user.permissionLevel === 'editor' ? 
                        '⏳ Submit for approval by moderators. Rule will be reviewed before going live.' :
                        '✅ Publish immediately. Rule will be live and visible to players right away.'
                    }
                  </div>
                </FormGroup>

                {/* Status Information for Moderators+ */}
                {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                  <div style={{ 
                    backgroundColor: 'rgba(103, 123, 174, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #677bae',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ color: '#677bae', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      ℹ️ Moderator Information
                    </div>
                    <div style={{ color: '#bdc3c7', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      As a {user.permissionLevel}, your rules are automatically approved and will be live immediately upon saving.
                      You can also save drafts for work-in-progress that you want to continue editing later.
                      {modalType === 'edit' && editingRule?.status && (
                        <>
                          <br />
                          <strong>Current Status:</strong> {editingRule.status}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Announcement Form */}
            {(modalType === 'create-announcement' || modalType === 'edit-announcement') && (
              <>
                <FormGroup>
                  <Label>Announcement Title</Label>
                  <Input 
                    type="text"
                    value={announcementFormData.title}
                    onChange={(e) => setAnnouncementFormData({...announcementFormData, title: e.target.value})}
                    placeholder="Enter announcement title"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Content</Label>
                  <EditorContainer>
                    <MDEditor
                      value={announcementFormData.content}
                      onChange={(content) => setAnnouncementFormData({...announcementFormData, content: content || ''})}
                      preview="edit"
                      hideToolbar={false}
                      data-color-mode="dark"
                      commands={[
                        commands.bold,
                        commands.italic,
                        commands.strikethrough,
                        commands.hr,
                        commands.title,
                        commands.divider,
                        commands.link,
                        imageCommand,
                        textColorCommand,
                        commands.code,
                        commands.codeBlock,
                        commands.divider,
                        commands.quote,
                        commands.unorderedListCommand,
                        commands.orderedListCommand,
                        commands.checkedListCommand,
                      ]}
                    />
                  </EditorContainer>
                </FormGroup>
                
                <FormGroup>
                  <Label>Priority Level</Label>
                  <Select
                    value={announcementFormData.priority}
                    onChange={(e) => setAnnouncementFormData({...announcementFormData, priority: parseInt(e.target.value)})}
                  >
                    <option value={1}>Low Priority (1)</option>
                    <option value={2}>Normal Priority (2)</option>
                    <option value={3}>High Priority (3)</option>
                    <option value={4}>Critical Priority (4)</option>
                    <option value={5}>Emergency Priority (5)</option>
                  </Select>
                </FormGroup>

                {/* Approval Workflow Section for Announcements - Available for all staff levels */}
                <FormGroup>
                  <Label>Submission Type</Label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    backgroundColor: '#2c3e50',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #445566'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="announcementSubmissionMode"
                        value="draft"
                        checked={submissionMode === 'draft'}
                        onChange={(e) => {
                          setSubmissionMode(e.target.value);
                          setSaveAsDraft(true);
                        }}
                      />
                      <span style={{ color: '#3498db', fontWeight: '500' }}>
                        📝 Save as Draft
                      </span>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="announcementSubmissionMode"
                        value="submit"
                        checked={submissionMode === 'submit'}
                        onChange={(e) => {
                          setSubmissionMode(e.target.value);
                          setSaveAsDraft(false);
                        }}
                      />
                      <span style={{ color: user.permissionLevel === 'editor' ? '#f39c12' : '#27ae60', fontWeight: '500' }}>
                        {user.permissionLevel === 'editor' ? '⏳ Submit for Approval' : '✅ Publish Live'}
                      </span>
                    </label>
                  </div>
                  
                  <div style={{ 
                    color: '#8a9dc9', 
                    fontSize: '0.85rem', 
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    {submissionMode === 'draft' ? 
                      '📝 Save as draft to continue editing later. Drafts are not visible to players.' :
                      user.permissionLevel === 'editor' ? 
                        '⏳ Submit for approval by moderators. Announcement will be reviewed before going live.' :
                        '✅ Publish immediately. Announcement will be live and visible to players right away.'
                    }
                  </div>
                </FormGroup>

                {/* Status Information for Moderators+ */}
                {(user.permissionLevel === 'moderator' || user.permissionLevel === 'admin' || user.permissionLevel === 'owner') && (
                  <div style={{ 
                    backgroundColor: 'rgba(103, 123, 174, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #677bae',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ color: '#677bae', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      ℹ️ Moderator Information
                    </div>
                    <div style={{ color: '#bdc3c7', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      As a {user.permissionLevel}, your announcements are automatically approved and will be live immediately upon saving.
                      {modalType === 'edit-announcement' && editingAnnouncement?.status && (
                        <>
                          <br />
                          <strong>Current Status:</strong> {editingAnnouncement.status}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <ModalActions>
              <Button onClick={(modalType === 'create-announcement' || modalType === 'edit-announcement') ? closeAnnouncementModal : closeModal} style={{ backgroundColor: '#95a5a6' }}>
                Cancel
              </Button>
              <Button onClick={(modalType === 'create-announcement' || modalType === 'edit-announcement') ? saveAnnouncement : saveRule}>
                {modalType === 'edit' ? 'Update Rule' : 
                 modalType === 'edit-announcement' ? 'Update Announcement' :
                 modalType === 'create-announcement' ? 'Save Announcement' : 'Save Rule'}
              </Button>
            </ModalActions>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModalBackdrop onClick={(e) => e.target === e.currentTarget && closeNotificationModal()}>
          <NotificationModalContainer type={notificationConfig.type} onClick={(e) => e.stopPropagation()}>
            <NotificationHeader>
              <NotificationIcon type={notificationConfig.type}>
                {getNotificationIcon(notificationConfig.type)}
              </NotificationIcon>
              <NotificationTitle>{notificationConfig.title}</NotificationTitle>
            </NotificationHeader>
            <NotificationMessage>{notificationConfig.message}</NotificationMessage>
            <NotificationActions>
              {notificationConfig.showCancel && (
                <NotificationButton 
                  variant="secondary" 
                  onClick={() => {
                    if (notificationConfig.onCancel) notificationConfig.onCancel();
                    setShowNotificationModal(false);
                  }}
                >
                  {notificationConfig.cancelText}
                </NotificationButton>
              )}
              <NotificationButton 
                variant="primary" 
                type={notificationConfig.type}
                onClick={() => {
                  if (notificationConfig.onConfirm) notificationConfig.onConfirm();
                  setShowNotificationModal(false);
                }}
              >
                {notificationConfig.confirmText}
              </NotificationButton>
            </NotificationActions>
          </NotificationModalContainer>
        </NotificationModalBackdrop>
      )}

      {/* Review Modal for Approvals */}
      {showReviewModal && (
        <ModalBackdrop onClick={(e) => e.target === e.currentTarget && closeReviewModal()}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {reviewAction === 'approve' ? '✅ Approve' : '❌ Reject'} {reviewItem?.type === 'rule' ? 'Rule' : 'Announcement'}
              </ModalTitle>
              <CloseButton onClick={closeReviewModal}>&times;</CloseButton>
            </ModalHeader>
            
            {reviewItem && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#ecf0f1', marginBottom: '0.5rem' }}>
                    {reviewItem.type === 'rule' ? 'Rule:' : 'Announcement:'} {reviewItem.title || reviewItem.full_code || `#${reviewItem.id}`}
                  </h4>
                  <div style={{ 
                    color: '#bdc3c7', 
                    fontSize: '0.9rem',
                    backgroundColor: '#2c3e50',
                    padding: '1rem',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {reviewItem.content?.substring(0, 300)}
                    {reviewItem.content?.length > 300 && '...'}
                  </div>
                </div>
                
                <FormGroup>
                  <Label>
                    Review Notes {reviewAction === 'reject' ? '(Required)' : '(Optional)'}
                  </Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'approve' 
                        ? 'Optional notes about this approval...' 
                        : 'Please explain why this is being rejected...'
                    }
                    style={{ minHeight: '120px' }}
                  />
                </FormGroup>
              </>
            )}
            
            <ModalActions>
              <Button onClick={closeReviewModal} style={{ backgroundColor: '#95a5a6' }}>
                Cancel
              </Button>
              <Button 
                onClick={submitReview}
                style={{ 
                  backgroundColor: reviewAction === 'approve' ? '#27ae60' : '#e74c3c' 
                }}
              >
                {reviewAction === 'approve' ? '✅ Approve' : '❌ Reject'}
              </Button>
            </ModalActions>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Cross-References Modal */}
      {showCrossReferencesModal && (
        <ModalBackdrop onClick={(e) => e.target === e.currentTarget && closeCrossReferencesModal()}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                🔗 Cross-References for {currentRuleForCrossRefs?.full_code} - {currentRuleForCrossRefs?.title || 'Untitled'}
              </ModalTitle>
              <CloseButton onClick={closeCrossReferencesModal}>&times;</CloseButton>
            </ModalHeader>
            
            {/* Existing Cross-References */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#ecf0f1', marginBottom: '1rem' }}>Existing Cross-References</h4>
              {loadingCrossRefs ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#8a9dc9' }}>
                  🔄 Loading cross-references...
                </div>
              ) : crossReferences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {crossReferences.map((crossRef) => (
                    <div key={crossRef.id} style={{
                      backgroundColor: '#2c3e50',
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid #445566',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ color: '#ecf0f1', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {crossRef.target_full_code} - {crossRef.target_title || 'Untitled'}
                        </div>
                        <div style={{ color: '#8a9dc9', fontSize: '0.85rem' }}>
                          Type: {crossRef.reference_type} 
                          {crossRef.is_bidirectional && ' (Bidirectional)'}
                        </div>
                        {crossRef.reference_context && (
                          <div style={{ color: '#bdc3c7', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Context: {crossRef.reference_context}
                          </div>
                        )}
                      </div>
                      <ActionButton 
                        danger 
                        onClick={() => removeCrossReference(crossRef.id)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Remove
                      </ActionButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#bdc3c7', fontStyle: 'italic' }}>
                  No cross-references found for this rule.
                </div>
              )}
            </div>

            {/* Add New Cross-Reference */}
            <div>
              <h4 style={{ color: '#ecf0f1', marginBottom: '1rem' }}>Add New Cross-Reference</h4>
              
              <FormGroup>
                <Label>Search for Rule to Link</Label>
                <Input
                  type="text"
                  value={ruleSearchQuery}
                  onChange={(e) => {
                    setRuleSearchQuery(e.target.value);
                    searchRulesForCrossRef(e.target.value);
                  }}
                  placeholder="Search by rule code, title, or content..."
                />
                
                {/* Search Results */}
                {ruleSearchResults.length > 0 && (
                  <div style={{
                    marginTop: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #445566',
                    borderRadius: '4px',
                    backgroundColor: '#2c3e50'
                  }}>
                    {ruleSearchResults.map((rule) => (
                      <div
                        key={rule.id}
                        onClick={() => {
                          setNewCrossRefData({...newCrossRefData, target_rule_id: rule.id});
                          setRuleSearchQuery(`${rule.full_code} - ${rule.title || 'Untitled'}`);
                          setRuleSearchResults([]);
                        }}
                        style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid #445566',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ color: '#ecf0f1', fontWeight: '500' }}>
                          {rule.full_code} - {rule.title || 'Untitled'}
                        </div>
                        <div style={{ color: '#8a9dc9', fontSize: '0.8rem' }}>
                          {rule.content?.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FormGroup>

              <FormGroup>
                <Label>Reference Type</Label>
                <Select
                  value={newCrossRefData.reference_type}
                  onChange={(e) => setNewCrossRefData({...newCrossRefData, reference_type: e.target.value})}
                >
                  <option value="related">Related</option>
                  <option value="clarifies">Clarifies</option>
                  <option value="supersedes">Supersedes</option>
                  <option value="superseded_by">Superseded By</option>
                  <option value="conflicts_with">Conflicts With</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Context (Optional)</Label>
                <Input
                  type="text"
                  value={newCrossRefData.reference_context}
                  onChange={(e) => setNewCrossRefData({...newCrossRefData, reference_context: e.target.value})}
                  placeholder="Additional context for this relationship..."
                />
              </FormGroup>

              <FormGroup>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newCrossRefData.is_bidirectional}
                    onChange={(e) => setNewCrossRefData({...newCrossRefData, is_bidirectional: e.target.checked})}
                  />
                  <span style={{ color: '#ecf0f1' }}>Bidirectional (show on both rules)</span>
                </label>
              </FormGroup>
            </div>

            <ModalActions>
              <Button onClick={closeCrossReferencesModal} style={{ backgroundColor: '#95a5a6' }}>
                Close
              </Button>
              <Button 
                onClick={addCrossReference}
                disabled={!newCrossRefData.target_rule_id}
                style={{ 
                  backgroundColor: newCrossRefData.target_rule_id ? '#27ae60' : '#95a5a6',
                  opacity: newCrossRefData.target_rule_id ? 1 : 0.6
                }}
              >
                Add Cross-Reference
              </Button>
            </ModalActions>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <ModalBackdrop onClick={(e) => e.target === e.currentTarget && closeCategoryModal()}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {categoryModalType === 'create' ? '📁 Create New Category' : '📝 Edit Category'}
              </ModalTitle>
              <CloseButton onClick={closeCategoryModal}>&times;</CloseButton>
            </ModalHeader>
            
            <FormGroup>
              <Label>Category Name *</Label>
              <Input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => {
                  console.log('Name input changed:', e.target.value);
                  setCategoryFormData({...categoryFormData, name: e.target.value});
                }}
                placeholder="Enter category name..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Category Code *</Label>
              <Input
                type="text"
                value={categoryFormData.letter_code}
                onChange={(e) => {
                  console.log('Letter code input changed:', e.target.value);
                  setCategoryFormData({...categoryFormData, letter_code: e.target.value.toUpperCase()});
                }}
                placeholder="Enter category code (e.g., A, B, C)..."
                maxLength="3"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <Textarea
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                placeholder="Enter category description..."
                style={{ minHeight: '120px' }}
              />
            </FormGroup>

            <FormGroup>
              <Label>Category Color</Label>
              <Input
                type="color"
                value={categoryFormData.color || '#3498db'}
                onChange={(e) => setCategoryFormData({...categoryFormData, color: e.target.value})}
              />
            </FormGroup>

            <FormGroup>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={categoryFormData.is_active}
                  onChange={(e) => setCategoryFormData({...categoryFormData, is_active: e.target.checked})}
                />
                <span style={{ color: '#ecf0f1' }}>Active</span>
              </label>
            </FormGroup>
            
            <ModalActions>
              <Button onClick={closeCategoryModal} style={{ backgroundColor: '#95a5a6' }}>
                Cancel
              </Button>
              <Button 
                onClick={saveCategory}
                disabled={!categoryFormData.name.trim() || !categoryFormData.letter_code.trim()}
                style={{ 
                  backgroundColor: categoryFormData.name.trim() && categoryFormData.letter_code.trim() ? '#27ae60' : '#95a5a6',
                  opacity: categoryFormData.name.trim() && categoryFormData.letter_code.trim() ? 1 : 0.6
                }}
              >
                {categoryModalType === 'create' ? '✅ Create Category' : '💾 Update Category'}
              </Button>
            </ModalActions>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* User Modal */}
      {showUserModal && (
        <ModalBackdrop onClick={(e) => e.target === e.currentTarget && closeUserModal()}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {userModalType === 'create' ? '👤 Add Staff User' : '✏️ Edit Staff User'}
              </ModalTitle>
              <CloseButton onClick={closeUserModal}>&times;</CloseButton>
            </ModalHeader>
            
            {userModalType === 'create' && (
              <>
                <FormGroup>
                  <Label>Steam ID *</Label>
                  <Input
                    type="text"
                    value={userFormData.steamId}
                    onChange={(e) => setUserFormData({...userFormData, steamId: e.target.value})}
                    placeholder="Enter 17-digit Steam ID (e.g., 76561198123456789)"
                    maxLength="17"
                  />
                  <small style={{ color: '#8a9dc9', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                    You can find Steam IDs using tools like steamid.io or Steam profile URLs
                  </small>
                </FormGroup>

                <FormGroup>
                  <Label>Username *</Label>
                  <Input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                    placeholder="Enter Steam username"
                  />
                </FormGroup>
              </>
            )}

            <FormGroup>
              <Label>Permission Level *</Label>
              <Select
                value={userFormData.permissionLevel}
                onChange={(e) => setUserFormData({...userFormData, permissionLevel: e.target.value})}
              >
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
                {user.permissionLevel === 'owner' && (
                  <>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </>
                )}
                {user.permissionLevel === 'admin' && (
                  <option value="admin" disabled>Admin (Owner only)</option>
                )}
              </Select>
              <small style={{ color: '#8a9dc9', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Editor: Create content (needs approval) • Moderator: Approve content • Admin: User management • Owner: Full access
              </small>
            </FormGroup>

            {userModalType === 'edit' && (
              <FormGroup>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={userFormData.isActive}
                    onChange={(e) => setUserFormData({...userFormData, isActive: e.target.checked})}
                  />
                  <span style={{ color: '#ecf0f1' }}>Active User</span>
                </label>
                <small style={{ color: '#8a9dc9', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Inactive users cannot access the staff dashboard
                </small>
              </FormGroup>
            )}
            
            <ModalActions>
              <Button onClick={closeUserModal} style={{ backgroundColor: '#95a5a6' }}>
                Cancel
              </Button>
              <Button 
                onClick={saveUser}
                disabled={
                  !userFormData.permissionLevel || 
                  (userModalType === 'create' && (!userFormData.steamId || !userFormData.username))
                }
                style={{ 
                  backgroundColor: (userFormData.permissionLevel && 
                    (userModalType === 'edit' || (userFormData.steamId && userFormData.username))) ? '#27ae60' : '#95a5a6',
                  opacity: (userFormData.permissionLevel && 
                    (userModalType === 'edit' || (userFormData.steamId && userFormData.username))) ? 1 : 0.6
                }}
              >
                {userModalType === 'create' ? '✅ Add User' : '💾 Update User'}
              </Button>
            </ModalActions>
          </ModalContainer>
        </ModalBackdrop>
      )}
    </DashboardContainer>
  );
}

export default StaffDashboard; 

