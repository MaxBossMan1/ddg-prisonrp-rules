import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
    border-color: #677bae;
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
  
  a {
    color: #677bae;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
      color: #8a9dc9;
    }
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
  margin-top: 1rem;
  font-style: italic;
`;

const PriorityBadge = styled.span`
  background-color: ${props => {
    if (props.priority >= 5) return '#dc3545';
    if (props.priority >= 3) return '#ffc107';
    return '#28a745';
  }};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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
    // Simple content rendering - in a real app, you'd use a proper markdown/rich text renderer
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Check for image URLs
      if (line.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return (
          <MediaContainer key={index}>
            <Image src={line} alt="Announcement image" />
          </MediaContainer>
        );
      }
      
      // Check for video URLs
      if (line.match(/\.(mp4|webm|ogg)$/i)) {
        return (
          <MediaContainer key={index}>
            <Video controls>
              <source src={line} type="video/mp4" />
              Your browser does not support the video tag.
            </Video>
          </MediaContainer>
        );
      }
      
      // Check for Discord links or other special links
      if (line.includes('discord.gg/') || line.includes('http')) {
        const url = line.trim();
        return (
          <MediaContainer key={index}>
            <LinkPreview href={url} target="_blank" rel="noopener noreferrer">
              <LinkTitle>
                {url.includes('discord.gg/') ? 'Join our Discord' : 'External Link'}
              </LinkTitle>
              <LinkDescription>{url}</LinkDescription>
            </LinkPreview>
          </MediaContainer>
        );
      }
      
      // Regular text
      return line.trim() ? <p key={index}>{line}</p> : null;
    });
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