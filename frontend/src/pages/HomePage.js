import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';
import SearchBar from '../components/SearchBar';
import AnnouncementCard from '../components/AnnouncementCard';
import RecentChanges from '../components/RecentChanges';
import CategoryGrid from '../components/CategoryGrid';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ecf0f1;
  margin-bottom: 1rem;
  position: relative;
  padding-left: 1rem;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 1.5rem;
    background-color: #677bae;
    border-radius: 2px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #95a5a6;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background-color: #c0392b;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e74c3c;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

function HomePage() {
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [categoriesRes, announcementsRes] = await Promise.all([
          apiService.getCategories(),
          apiService.getAnnouncements(),
        ]);

        setCategories(categoriesRes.data);
        setAnnouncements(announcementsRes.data);

        // Try to fetch recent changes (might not be implemented yet)
        try {
          const changesRes = await apiService.getRecentChanges();
          setRecentChanges(changesRes.data);
        } catch (changesError) {
          console.log('Recent changes not available yet:', changesError);
          setRecentChanges([]);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please check if the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading DigitalDeltaGaming PrisonRP rules...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      {/* Search Section */}
      <Section>
        <SearchBar />
      </Section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <Section>
          <SectionTitle>
            Announcements
          </SectionTitle>
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </Section>
      )}

      {/* Recent Changes Section */}
      {recentChanges.length > 0 && (
        <Section>
          <SectionTitle>
            Recent Changes
          </SectionTitle>
          <RecentChanges changes={recentChanges} />
        </Section>
      )}

      {/* Rule Categories Section */}
      <Section>
        <SectionTitle>
          Rule Categories
        </SectionTitle>
        <CategoryGrid categories={categories} />
      </Section>
    </Container>
  );
}

export default HomePage; 