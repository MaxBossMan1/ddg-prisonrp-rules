import React from 'react';
import styled from 'styled-components';

const ChangesContainer = styled.div`
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ChangeItem = styled.div`
  padding: 0.75rem 0;
  border-bottom: 1px solid #2c3e50;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-child {
    padding-top: 0;
  }
`;

const ChangeText = styled.div`
  color: #bdc3c7;
  margin-bottom: 0.25rem;
`;

const ChangeDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #95a5a6;
`;

const ChangeType = styled.span`
  background-color: ${props => {
    switch (props.type) {
      case 'created': return '#28a745';
      case 'updated': return '#007bff';
      case 'deleted': return '#dc3545';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #95a5a6;
  font-style: italic;
  padding: 1rem;
`;

function RecentChanges({ changes }) {
  if (!changes || changes.length === 0) {
    return (
      <ChangesContainer>
        <EmptyState>
          No recent changes to display.
        </EmptyState>
      </ChangesContainer>
    );
  }

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

  return (
    <ChangesContainer>
      {changes.map((change, index) => (
        <ChangeItem key={index}>
          <ChangeText>
            • {change.description || `Rule ${change.rule_code} was ${change.change_type}`}
          </ChangeText>
          <ChangeDetails>
            <ChangeType type={change.change_type}>
              {change.change_type}
            </ChangeType>
            <span>{formatDate(change.created_at)}</span>
          </ChangeDetails>
        </ChangeItem>
      ))}
    </ChangesContainer>
  );
}

export default RecentChanges; 