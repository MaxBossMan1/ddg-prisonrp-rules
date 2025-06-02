import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';
import SearchBar from '../components/SearchBar';
import AnnouncementCard from '../components/AnnouncementCard';
import RecentChanges from '../components/RecentChanges';
import CategoryGrid from '../components/CategoryGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import { CategoryGridSkeleton, AnnouncementCardSkeleton, ContentSkeleton } from '../components/SkeletonLoader';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 1rem;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const FullWidthLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    width: 100%;
    margin-left: 0;
  }
`;

const AnnouncementsWrapper = styled.div`
  padding: 0 2rem 0 2rem;
  
  @media (max-width: 1024px) {
    padding: 0 1rem;
  }
`;

const CategoriesWrapper = styled.div`
  padding: 0 2rem 0 1rem;
  
  @media (max-width: 1024px) {
    padding: 0 1rem;
  }
`;

const FullWidthContentWrapper = styled.div`
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: 0;
`;

const Section = styled.section`
  margin-bottom: 4rem;
  
  &:last-child {
    margin-bottom: 2rem;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #ecf0f1;
  margin-bottom: 2rem;
  position: relative;
  padding-left: 2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.2;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
    border-radius: 3px;
    box-shadow: 0 2px 8px rgba(103, 123, 174, 0.3);
  }
  
  &::after {
    content: '';
    position: absolute;
    left: 2rem;
    bottom: -0.5rem;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #677bae, transparent);
    border-radius: 2px;
  }
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
    
    &::after {
      left: 1.5rem;
      width: 40px;
      height: 2px;
    }
  }
`;

const SearchSection = styled(Section)`
  text-align: center;
  padding: 2rem 0;
  background: linear-gradient(135deg, rgba(103, 123, 174, 0.05) 0%, rgba(103, 123, 174, 0.02) 100%);
  border-radius: 20px;
  margin-bottom: 4rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(135deg, rgba(103, 123, 174, 0.1), transparent);
    border-radius: 20px;
    z-index: -1;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
    margin-bottom: 3rem;
  }
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
  color: #ecf0f1;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(231, 76, 60, 0.3);
  margin-bottom: 2rem;
  box-shadow: 
    0 8px 24px rgba(192, 57, 43, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  font-weight: 500;
  
  &::before {
    content: '⚠';
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    font-size: 1.25rem;
    opacity: 0.8;
  }
  
  padding-left: 3.5rem;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.25rem;
  box-shadow: 
    0 2px 8px rgba(103, 123, 174, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    background: linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%);
    transform: translateY(-2px);
    box-shadow: 
      0 4px 16px rgba(103, 123, 174, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  
  &::before {
    content: '';
    position: absolute;
    top: -1rem;
    left: -1rem;
    right: -1rem;
    bottom: -1rem;
    background: linear-gradient(135deg, rgba(103, 123, 174, 0.02) 0%, transparent 70%);
    border-radius: 16px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const AnnouncementsSection = styled(Section)`
  margin-bottom: 0;
`;

const CategoriesSection = styled(Section)`
  margin-bottom: 0;
`;

function HomePage() {
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    categories: true,
    announcements: true,
    recentChanges: true
  });
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingStates({
        categories: true,
        announcements: true,
        recentChanges: true
      });

      // Fetch data with individual loading states
      const fetchCategories = apiService.getCategories().then(res => {
        setCategories(res.data);
        setLoadingStates(prev => ({ ...prev, categories: false }));
      });

      const fetchAnnouncements = apiService.getAnnouncements().then(res => {
        setAnnouncements(res.data);
        setLoadingStates(prev => ({ ...prev, announcements: false }));
      });

      // Try to fetch recent changes (optional)
      // TODO: Implement this feature later
      // const fetchRecentChanges = apiService.getRecentChanges().then(res => {
      //   setRecentChanges(res.data);
      //   setLoadingStates(prev => ({ ...prev, recentChanges: false }));
      // }).catch(error => {
      //   console.log('Recent changes not available yet:', error);
      //   setRecentChanges([]);
      //   setLoadingStates(prev => ({ ...prev, recentChanges: false }));
      // });

      // For now, just set recent changes as empty and not loading
      setRecentChanges([]);
      setLoadingStates(prev => ({ ...prev, recentChanges: false }));

      await Promise.all([fetchCategories, fetchAnnouncements]);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          {error}
          <RetryButton onClick={fetchData}>Try Again</RetryButton>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      {/* Search Section */}
      <SearchSection>
        <SearchBar />
      </SearchSection>

      <FullWidthLayout>
        <AnnouncementsWrapper>
          <Section>
            <SectionTitle>Announcements</SectionTitle>
            {loadingStates.announcements ? (
              <>
                <AnnouncementCardSkeleton />
                <AnnouncementCardSkeleton />
              </>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))
            ) : (
              <p style={{ color: '#bdc3c7', textAlign: 'center', padding: '2rem' }}>
                No announcements available at this time.
              </p>
            )}
          </Section>
        </AnnouncementsWrapper>

        <CategoriesWrapper>
          <Section>
            <SectionTitle>Rule Categories</SectionTitle>
            {loadingStates.categories ? (
              <CategoryGridSkeleton />
            ) : (
              <CategoryGrid categories={categories} />
            )}
          </Section>
        </CategoriesWrapper>
      </FullWidthLayout>

      {/* Recent Changes Section - Full Width Below */}
      {(recentChanges.length > 0 || loadingStates.recentChanges) && (
        <Section>
          <SectionTitle>Recent Changes</SectionTitle>
          {loadingStates.recentChanges ? (
            <ContentSkeleton lines={3} showTitle={false} />
          ) : (
            <RecentChanges changes={recentChanges} />
          )}
        </Section>
      )}
    </Container>
  );
}

export default HomePage; 