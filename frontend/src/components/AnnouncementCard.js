import React from 'react';
import styled from 'styled-components';
import { markdownToHtml } from '../utils/markdownUtils';

const Card = styled.div`
  background: linear-gradient(135deg, #34495e 0%, #3d566e 100%);
  border: 1px solid rgba(103, 123, 174, 0.3);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border-color: rgba(103, 123, 174, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ecf0f1;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Content = styled.div`
  color: #bdc3c7;
  line-height: 1.6;
  margin-bottom: 1rem;
  
  p {
    margin: 0 0 1rem 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #ecf0f1;
    margin: 1.5rem 0 1rem 0;
    font-weight: 600;
  }
  
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.2rem; }
  h3 { font-size: 1.1rem; }
  h4 { font-size: 1rem; }
  
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
    font-size: 0.9em;
  }
  
  pre {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
    border-left: 4px solid #677bae;
    
    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }
  
  blockquote {
    border-left: 4px solid #677bae;
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
      text-decoration: underline;
      color: #8a9dc9;
    }
  }
  
  hr {
    border: none;
    height: 1px;
    background-color: #445566;
    margin: 2rem 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    
    th, td {
      border: 1px solid #445566;
      padding: 0.75rem;
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
    border-radius: 8px;
    margin: 1rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const MediaContainer = styled.div`
  margin: 1rem 0;
`;

const Image = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Video = styled.video`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const LinkPreview = styled.a`
  display: block;
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 8px;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  
  &:hover {
    border-color: #677bae;
    box-shadow: 0 2px 8px rgba(103, 123, 174, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const LinkTitle = styled.div`
  font-weight: 600;
  color: #677bae;
  margin-bottom: 0.25rem;
`;

const LinkDescription = styled.div`
  color: #95a5a6;
  font-size: 0.9rem;
`;

const Timestamp = styled.div`
  color: #95a5a6;
  font-size: 0.875rem;
  text-align: right;
  margin-top: 1.5rem;
  font-style: italic;
  position: relative;
  padding-top: 1rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #677bae, transparent);
  }
`;

const PriorityBadge = styled.span`
  background: ${props => {
    if (props.priority >= 5) return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    if (props.priority >= 3) return 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
    return 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';
  }};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.8;
  }
`;

function AnnouncementCard({ announcement }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderContent = (content) => {
    // Convert Markdown to HTML and render
    const htmlContent = markdownToHtml(content);
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 5) return 'High';
    if (priority >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <Card>
      <Title>
        {announcement.title}
        {announcement.priority > 1 && (
          <PriorityBadge priority={announcement.priority}>
            {getPriorityLabel(announcement.priority)}
          </PriorityBadge>
        )}
      </Title>
      
      <Content>
        {renderContent(announcement.content)}
      </Content>
      
      <Timestamp>
        {formatDate(announcement.created_at)}
      </Timestamp>
    </Card>
  );
}

export default AnnouncementCard; 