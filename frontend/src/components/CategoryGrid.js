import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { StaggeredAnimation, ScrollAnimation } from './PageTransition';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const CategoryCard = styled.div`
  background: linear-gradient(135deg, #34495e 0%, #3d566e 100%);
  border: 1px solid rgba(103, 123, 174, 0.3);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  
  /* Touch optimization */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  
  /* Minimum touch target */
  min-height: 64px;
  
  /* Subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(103, 123, 174, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border-color: rgba(103, 123, 174, 0.6);
  }
  
  /* Touch feedback for mobile */
  &:active {
    transform: translateY(-4px) scale(1.01);
    transition: transform 0.1s ease;
  }
  
  /* Focus styles */
  &:focus-visible {
    outline: 3px solid #677bae;
    outline-offset: 2px;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const CategoryLetter = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(103, 123, 174, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  ${CategoryCard}:hover & {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 
      0 6px 18px rgba(103, 123, 174, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const RuleCount = styled.div`
  background: linear-gradient(135deg, rgba(103, 123, 174, 0.2) 0%, rgba(103, 123, 174, 0.1) 100%);
  border: 1px solid rgba(103, 123, 174, 0.3);
  color: #8a9dc9;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.3s ease;
  
  ${CategoryCard}:hover & {
    background: linear-gradient(135deg, rgba(103, 123, 174, 0.3) 0%, rgba(103, 123, 174, 0.2) 100%);
    border-color: rgba(103, 123, 174, 0.5);
    color: #ecf0f1;
    transform: translateX(2px);
  }
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
    opacity: 0.8;
  }
`;

const CategoryName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #ecf0f1;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  transition: all 0.3s ease;
  
  ${CategoryCard}:hover & {
    color: #fff;
    transform: translateX(4px);
  }
`;

const CategoryDescription = styled.p`
  color: #bdc3c7;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  transition: all 0.3s ease;
  
  ${CategoryCard}:hover & {
    color: #ecf0f1;
    transform: translateX(2px);
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  color: #95a5a6;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #bdc3c7;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

// Touch gesture handler for mobile swipe navigation
const handleCategorySwipe = (category, navigate) => ({
  onSwipeLeft: () => {
    // Could implement next/previous category navigation
    console.log(`Swiped left on ${category.letter_code}`);
  },
  onSwipeRight: () => {
    // Could implement quick actions or back navigation
    console.log(`Swiped right on ${category.letter_code}`);
  }
});

function CategoryGrid({ categories }) {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    if (category && category.letter_code) {
      navigate(`/rules/${category.letter_code.toLowerCase()}`);
    } else {
      console.error('CategoryGrid: Invalid category data for click:', category);
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <ScrollAnimation>
        <EmptyState>
          <h3>No Rule Categories Found</h3>
          <p>It looks like no rule categories have been created yet. Check back later or contact an administrator.</p>
        </EmptyState>
      </ScrollAnimation>
    );
  }

  // Filter out any invalid categories and log issues
  const validCategories = categories.filter(category => {
    const isValid = category && 
      category.id && 
      category.letter_code && 
      category.name;
    
    if (!isValid) {
      console.warn('CategoryGrid: Filtering out invalid category:', category);
    }
    
    return isValid;
  });

  if (validCategories.length === 0) {
    return (
      <ScrollAnimation>
        <EmptyState>
          <h3>Invalid Category Data</h3>
          <p>There seems to be an issue with the category data. Please check the browser console and contact an administrator.</p>
        </EmptyState>
      </ScrollAnimation>
    );
  }

  return (
    <StaggeredAnimation stagger={true} delay={150}>
      <Grid>
        {validCategories.map((category) => (
          <CategoryCard
            key={category.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCategoryClick(category);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCategoryClick(category);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View ${category.name} rules`}
          >
            <CategoryHeader>
              <CategoryLetter>
                {(category.letter_code || '?').toUpperCase()}
              </CategoryLetter>
              <RuleCount>
                {category.rule_count || 0}
              </RuleCount>
            </CategoryHeader>
            
            <CategoryName>{category.name}</CategoryName>
            <CategoryDescription>
              {category.description || `Rules and guidelines for ${category.name.toLowerCase()}`}
            </CategoryDescription>
          </CategoryCard>
        ))}
      </Grid>
    </StaggeredAnimation>
  );
}

export default CategoryGrid; 