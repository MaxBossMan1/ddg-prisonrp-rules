import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/api';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #677bae;
  text-decoration: none;
  margin-bottom: 2rem;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
    color: #8a9dc9;
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #ecf0f1;
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #bdc3c7;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background-color: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
`;

const InvalidCategoryError = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
`;

const ErrorCode = styled.div`
  font-size: 6rem;
  font-weight: 700;
  color: #677bae;
  line-height: 1;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #ecf0f1;
  margin-bottom: 1rem;
`;

const ErrorText = styled.p`
  font-size: 1.1rem;
  color: #bdc3c7;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #677bae;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #8a9dc9;
    text-decoration: none;
    color: white;
  }
`;

const RuleContainer = styled.div`
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  ${props => props.$highlighted && `
    animation: highlightPulse 3s ease-in-out;
    box-shadow: 0 0 20px rgba(103, 123, 174, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3);
  `}
  
  @keyframes highlightPulse {
    0% {
      box-shadow: 0 0 20px rgba(103, 123, 174, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3);
      border-color: #677bae;
    }
    50% {
      box-shadow: 0 0 30px rgba(103, 123, 174, 1), 0 2px 4px rgba(0, 0, 0, 0.3);
      border-color: #8a9dc9;
    }
    100% {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      border-color: #2c3e50;
    }
  }
`;

const RuleHeader = styled.div`
  background-color: #2c3e50;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #34495e;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RuleCode = styled.span`
  position: relative;
  background-color: #677bae;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #8a9dc9;
  }
`;

const RuleTitle = styled.h3`
  color: #ecf0f1;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const RuleContent = styled.div`
  padding: 1.5rem;
  color: #e9ecef;
  line-height: 1.6;
  
  p {
    margin-bottom: 1rem;
  }
  
  ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const SubRuleContainer = styled.div`
  margin-left: 2rem;
  margin-top: 1rem;
  border-left: 3px solid #677bae;
  padding-left: 1rem;
`;

const SubRule = styled.div`
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${props => props.$highlighted && `
    animation: highlightPulse 3s ease-in-out;
    box-shadow: 0 0 15px rgba(103, 123, 174, 0.6);
  `}
  
  @keyframes highlightPulse {
    0% {
      box-shadow: 0 0 15px rgba(103, 123, 174, 0.8);
      border-color: #677bae;
    }
    50% {
      box-shadow: 0 0 25px rgba(103, 123, 174, 1);
      border-color: #8a9dc9;
    }
    100% {
      box-shadow: none;
      border-color: #34495e;
    }
  }
`;

const SubRuleHeader = styled.div`
  background-color: #34495e;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubRuleCode = styled.span`
  position: relative;
  background-color: #5a6c7d;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #677bae;
  }
`;

const SubRuleTitle = styled.h4`
  color: #ecf0f1;
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
`;

const SubRuleContent = styled.div`
  padding: 1rem;
  color: #e9ecef;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const CopyNotification = styled.div`
  position: absolute;
  top: -3rem;
  right: 0;
  background-color: #27ae60;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  animation: copyNotificationShow 2s ease-out forwards;
  
  /* Speech bubble arrow pointing down */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #27ae60;
  }
  
  @keyframes copyNotificationShow {
    0% {
      opacity: 0;
      transform: translateY(-10px) scale(0.8);
    }
    10% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    90% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-10px) scale(0.8);
    }
  }
`;

function RulePage() {
  const { category } = useParams();
  const location = useLocation();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [copiedRuleCode, setCopiedRuleCode] = useState(null);
  const [highlightedRuleId, setHighlightedRuleId] = useState(null);
  const ruleRefs = useRef({});

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate category parameter
      const validCategories = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      if (!category || !validCategories.includes(category.toLowerCase())) {
        setError('invalid_category');
        setLoading(false);
        return;
      }
      
      // Fetch rules for the category
      const response = await apiService.getRules(category?.toUpperCase());
      setRules(response.data);
      
      // Get category info from the first rule
      if (response.data.length > 0) {
        setCategoryInfo({
          name: response.data[0].category_name,
          letter: response.data[0].category_letter
        });
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
      if (err.response?.status === 404) {
        setError('invalid_category');
      } else {
        setError('Failed to load rules. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchRules();
  }, [category, fetchRules]);

  // Handle rule highlighting from search navigation
  useEffect(() => {
    if (location.state?.highlightRuleId && rules.length > 0) {
      const ruleId = location.state.highlightRuleId;
      setHighlightedRuleId(ruleId);
      
      // Scroll to the rule after a short delay to ensure rendering is complete
      setTimeout(() => {
        const ruleElement = ruleRefs.current[ruleId];
        if (ruleElement) {
          ruleElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300);
      
      // Remove highlight after animation completes
      setTimeout(() => {
        setHighlightedRuleId(null);
      }, 3500);
      
      // Clear the navigation state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, rules]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRuleCode(text);
      setTimeout(() => setCopiedRuleCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatContent = (content) => {
    // Convert newlines to paragraphs and handle bullet points
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim().startsWith('•')) {
        // Handle bullet points
        const items = paragraph.split('\n').filter(item => item.trim());
        return (
          <ul key={index}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>{item.replace('•', '').trim()}</li>
            ))}
          </ul>
        );
      } else if (paragraph.match(/^\d+\./)) {
        // Handle numbered lists
        const items = paragraph.split('\n').filter(item => item.trim());
        return (
          <ol key={index}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>{item.replace(/^\d+\./, '').trim()}</li>
            ))}
          </ol>
        );
      } else {
        return <p key={index}>{paragraph}</p>;
      }
    });
  };

  const getPageTitle = () => {
    if (categoryInfo) {
      return `Section ${categoryInfo.letter}: ${categoryInfo.name}`;
    }
    return `Section ${category?.toUpperCase()}`;
  };

  if (loading) {
    return (
      <Container>
        <BackLink to="/">← Back to Home</BackLink>
        <LoadingMessage>Loading rules...</LoadingMessage>
      </Container>
    );
  }

  if (error === 'invalid_category') {
    return (
      <InvalidCategoryError>
        <ErrorCode>404</ErrorCode>
        <ErrorTitle>Invalid Rule Category</ErrorTitle>
        <ErrorText>
          The rule category "{category?.toUpperCase()}" doesn't exist.
          <br />
          Please choose from the available rule categories below.
        </ErrorText>
        <BackButton to="/">← View All Categories</BackButton>
      </InvalidCategoryError>
    );
  }

  if (error) {
    return (
      <Container>
        <BackLink to="/">← Back to Home</BackLink>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <BackLink to="/">← Back to Home</BackLink>
      
      <PageTitle>{getPageTitle()}</PageTitle>
      
      {rules.length === 0 ? (
        <LoadingMessage>No rules found for this category.</LoadingMessage>
      ) : (
        rules.map((rule) => (
          <RuleContainer 
            key={rule.id}
            ref={el => ruleRefs.current[rule.id] = el}
            $highlighted={highlightedRuleId === rule.id}
          >
            <RuleHeader>
              <RuleTitle>{rule.title}</RuleTitle>
              <RuleCode onClick={() => copyToClipboard(rule.full_code)}>
                {rule.full_code}
                {copiedRuleCode === rule.full_code && (
                  <CopyNotification>
                    Copied!
                  </CopyNotification>
                )}
              </RuleCode>
            </RuleHeader>
            <RuleContent>
              {formatContent(rule.content)}
            </RuleContent>
            
            {rule.sub_rules && rule.sub_rules.length > 0 && (
              <SubRuleContainer>
                {rule.sub_rules.map((subRule) => (
                  <SubRule 
                    key={subRule.id}
                    ref={el => ruleRefs.current[subRule.id] = el}
                    $highlighted={highlightedRuleId === subRule.id}
                  >
                    <SubRuleHeader>
                      <SubRuleTitle>{subRule.title}</SubRuleTitle>
                      <SubRuleCode onClick={() => copyToClipboard(subRule.full_code)}>
                        {subRule.full_code}
                        {copiedRuleCode === subRule.full_code && (
                          <CopyNotification>
                            Copied!
                          </CopyNotification>
                        )}
                      </SubRuleCode>
                    </SubRuleHeader>
                    <SubRuleContent>
                      {formatContent(subRule.content)}
                    </SubRuleContent>
                  </SubRule>
                ))}
              </SubRuleContainer>
            )}
          </RuleContainer>
        ))
      )}

    </Container>
  );
}

export default RulePage; 