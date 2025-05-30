import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';

const FooterContainer = styled.footer`
  background: linear-gradient(135deg, #1a1d23 0%, #2c3e50 50%, #1a1d23 100%);
  color: #e9ecef;
  padding: 3rem 2rem 2rem 2rem;
  margin-top: 4rem;
  position: relative;
  overflow: hidden;
  border-top: 3px solid rgba(103, 123, 174, 0.5);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(103, 123, 174, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(138, 157, 201, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const FooterContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 4rem;
  align-items: start;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }
`;

const DiscordSection = styled.div`
  background: linear-gradient(135deg, #34495e 0%, #3d566e 100%);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(103, 123, 174, 0.3);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border-color: rgba(103, 123, 174, 0.5);
  }
`;

const DiscordHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  text-align: center;
  width: 100%;
  
  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #ffffff 0%, #e9ecef 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    width: 100%;
  }
`;

const DiscordLogo = styled.img`
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
`;

const DiscordWidget = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  background: #2f3136;
  border: 1px solid rgba(103, 123, 174, 0.2);
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 12px;
  }
`;

const CompanySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const CompanyInfo = styled.div`
  h2 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ffffff 0%, #e9ecef 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #bdc3c7;
    margin-bottom: 2rem;
  }
`;

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const LinkGroup = styled.div`
  h4 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #677bae;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.8rem;
  }
  
  a {
    color: #bdc3c7;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #ffffff;
    }
  }
`;

const BottomSection = styled.div`
  grid-column: 1 / -1;
  border-top: 1px solid rgba(103, 123, 174, 0.3);
  padding-top: 2rem;
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const CompanyLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  img {
    height: 40px;
  }
  
  span {
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
  }
`;

const Copyright = styled.div`
  color: #95a5a6;
  font-size: 0.9rem;
`;

const Footer = () => {
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Set a small delay to ensure the widget loads properly
    const timer = setTimeout(() => {
      setWidgetLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch categories for dynamic links
    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategories();
        setCategories(response.data.filter(cat => cat.rule_count > 0)); // Only show categories that have rules
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <FooterContainer>
      <FooterContent>
        <CompanySection>
          <CompanyInfo>
            <h2>DigitalDeltaGaming</h2>
            <p>
              Welcome to the premier PrisonRP experience! Join our community for 
              intense roleplay, custom features, and an active player base. 
              Read our rules carefully and have fun!
            </p>
          </CompanyInfo>
          
          <QuickLinks>
            <LinkGroup>
              <h4>Server Rules</h4>
              <ul>
                {categories.length > 0 ? (
                  categories.map(category => (
                    <li key={category.id}>
                      <a href={`/rules/${category.letter_code.toLowerCase()}`}>{category.name}</a>
                    </li>
                  ))
                ) : (
                  <li>Loading...</li>
                )}
              </ul>
            </LinkGroup>
            
            <LinkGroup>
              <h4>Community</h4>
              <ul>
                <li><a href="https://digitaldeltagaming.net/" target="_blank" rel="noopener noreferrer">Main Website</a></li>
                <li><a href="https://discord.gg/your-invite" target="_blank" rel="noopener noreferrer">Discord Server</a></li>
              </ul>
            </LinkGroup>
          </QuickLinks>
        </CompanySection>
        
        <DiscordSection>
          <DiscordHeader>
            <h3>JOIN OUR COMMUNITY</h3>
          </DiscordHeader>
          
          <DiscordWidget>
            {widgetLoaded && (
              <iframe
                src="https://discord.com/widget?id=929440166991527946&theme=dark"
                allowtransparency="true"
                frameBorder="0"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                title="Discord Widget"
              />
            )}
          </DiscordWidget>
        </DiscordSection>
        
        <BottomSection>
          <CompanyLogo>
            <img src="/ddg-logo.png" alt="DigitalDeltaGaming" />
            <span>DigitalDeltaGaming</span>
          </CompanyLogo>
          
          <Copyright>
            © 2025 DigitalDeltaGaming. All rights reserved. | 
            <a href="https://digitaldeltagaming.net/tos" target="_blank" rel="noopener noreferrer" style={{ color: '#677bae', marginLeft: '0.5rem' }}>Terms of Service</a>
          </Copyright>
        </BottomSection>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer; 