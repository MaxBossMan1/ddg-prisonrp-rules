import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const CategoryCard = styled(Link)`
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  display: block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    transform: translateY(-3px);
    border-color: #677bae;
    text-decoration: none;
    color: inherit;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CategoryLetter = styled.div`
  background-color: #677bae;
  color: #ecf0f1;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const RuleCount = styled.div`
  background-color: #2c3e50;
  color: #bdc3c7;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #34495e;
`;

const CategoryTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ecf0f1;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
`;

const CategoryDescription = styled.p`
  color: #bdc3c7;
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #95a5a6;
  font-style: italic;
`;

function CategoryGrid({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <EmptyState>
        No rule categories available. Please check if the backend server is running.
      </EmptyState>
    );
  }

  return (
    <Grid>
      {categories.map((category) => (
        <CategoryCard 
          key={category.id} 
          to={`/rules/${category.letter_code.toLowerCase()}`}
        >
          <CategoryHeader>
            <CategoryLetter>
              {category.letter_code}
            </CategoryLetter>
            <RuleCount>
              {category.rule_count || 0} rules
            </RuleCount>
          </CategoryHeader>
          
          <CategoryTitle>
            {category.name}
          </CategoryTitle>
          
          <CategoryDescription>
            {category.description || 'No description available.'}
          </CategoryDescription>
        </CategoryCard>
      ))}
    </Grid>
  );
}

export default CategoryGrid; 