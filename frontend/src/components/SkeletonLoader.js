import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #34495e 25%, #455a75 37%, #34495e 63%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 4px;
`;

const SkeletonCard = styled(SkeletonBase)`
  height: 120px;
  margin-bottom: 1rem;
  border-radius: 8px;
`;

const SkeletonTitle = styled(SkeletonBase)`
  height: 24px;
  width: 70%;
  margin-bottom: 0.5rem;
`;

const SkeletonText = styled(SkeletonBase)`
  height: 16px;
  width: ${props => props.$width || '100%'};
  margin-bottom: 0.5rem;
`;

const SkeletonButton = styled(SkeletonBase)`
  height: 40px;
  width: 120px;
  border-radius: 6px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SkeletonCardContent = styled.div`
  padding: 1.5rem;
`;

// Category Card Skeleton
export const CategoryCardSkeleton = () => (
  <SkeletonCard>
    <SkeletonCardContent>
      <SkeletonTitle />
      <SkeletonText $width="90%" />
      <SkeletonText $width="60%" />
    </SkeletonCardContent>
  </SkeletonCard>
);

// Announcement Card Skeleton
export const AnnouncementCardSkeleton = () => (
  <SkeletonCard style={{ height: '150px' }}>
    <SkeletonCardContent>
      <SkeletonTitle $width="80%" />
      <SkeletonText $width="100%" />
      <SkeletonText $width="85%" />
      <SkeletonText $width="40%" />
    </SkeletonCardContent>
  </SkeletonCard>
);

// Rule Item Skeleton
export const RuleItemSkeleton = () => (
  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#34495e', borderRadius: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
      <SkeletonText $width="60px" style={{ marginRight: '1rem', marginBottom: 0 }} />
      <SkeletonTitle style={{ marginBottom: 0 }} />
    </div>
    <SkeletonText $width="95%" />
    <SkeletonText $width="80%" />
  </div>
);

// Search Results Skeleton
export const SearchResultsSkeleton = () => (
  <div>
    {[...Array(3)].map((_, index) => (
      <div key={index} style={{ padding: '1rem', borderBottom: '1px solid #2c3e50' }}>
        <SkeletonText $width="80px" style={{ marginBottom: '0.25rem' }} />
        <SkeletonText $width="90%" />
      </div>
    ))}
  </div>
);

// Grid Loading
export const CategoryGridSkeleton = () => (
  <SkeletonGrid>
    {[...Array(6)].map((_, index) => (
      <CategoryCardSkeleton key={index} />
    ))}
  </SkeletonGrid>
);

// Generic content skeleton
export const ContentSkeleton = ({ lines = 3, showTitle = true }) => (
  <div>
    {showTitle && <SkeletonTitle />}
    {[...Array(lines)].map((_, index) => (
      <SkeletonText key={index} $width={`${Math.random() * 30 + 70}%`} />
    ))}
  </div>
);

export default SkeletonBase; 