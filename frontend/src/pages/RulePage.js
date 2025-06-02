import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/api';
import RuleImage from '../components/RuleImage';
import ImageModal from '../components/ImageModal';
import { resolveImagesInContent, extractImagesFromContent } from '../utils/imageUtils';
import { markdownToHtml } from '../utils/markdownUtils';

// Dynamic API configuration - Auto-detect environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If we're running on localhost or 127.0.0.1, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If we're on the server IP or any other domain, use the same host with port 3001
  return `http://${hostname}:3001`;
};

const BASE_URL = getApiBaseUrl();

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
  position: relative;
  background: linear-gradient(135deg, #34495e 0%, #3d566e 100%);
  border: 1px solid rgba(103, 123, 174, 0.3);
  border-radius: 16px;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  ${props => props.$highlighted && `
    animation: highlightPulse 3s ease-in-out;
    box-shadow: 0 0 20px rgba(103, 123, 174, 0.6), 0 8px 24px rgba(0, 0, 0, 0.3);
  `}
  
  @keyframes highlightPulse {
    0% {
      box-shadow: 0 0 20px rgba(103, 123, 174, 0.8), 0 8px 24px rgba(0, 0, 0, 0.3);
      border-color: #677bae;
    }
    50% {
      box-shadow: 0 0 30px rgba(103, 123, 174, 1), 0 12px 32px rgba(0, 0, 0, 0.4);
      border-color: #8a9dc9;
    }
    100% {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      border-color: rgba(103, 123, 174, 0.3);
    }
  }
`;

const RuleHeader = styled.div`
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(103, 123, 174, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #677bae, #8a9dc9);
  }
`;

const RuleCode = styled.span`
  position: relative;
  background: linear-gradient(135deg, #677bae 0%, #8a9dc9 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 8px rgba(103, 123, 174, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: linear-gradient(135deg, #8a9dc9 0%, #a8b9d6 100%);
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(103, 123, 174, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const RuleTitle = styled.h3`
  color: #ecf0f1;
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.2;
`;

const SubRuleContainer = styled.div`
  margin-left: 2rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-left: 3px solid #677bae;
  padding-left: 1rem;
`;

const SubRule = styled.div`
  position: relative;
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

const CopyNotification = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  background-color: #27ae60;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 9999;
  animation: copyNotificationShow 2s ease-out forwards;
  
  /* Add a subtle icon */
  &::before {
    content: '✓';
    margin-right: 0.5rem;
    font-weight: bold;
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

const StyledRuleContent = styled.div`
  padding: 2rem;
  color: #e9ecef;
  line-height: 1.7;
  
  p {
    margin-bottom: 1.25rem;
    font-size: 1rem;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #ecf0f1;
    margin: 2rem 0 1.25rem 0;
    font-weight: 700;
    line-height: 1.3;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.3rem; }
  h4 { font-size: 1.1rem; }
  
  strong, b {
    font-weight: 700;
    color: #ecf0f1;
  }
  
  em, i {
    font-style: italic;
    color: #f8f9fa;
  }
  
  code {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: #8a9dc9;
    padding: 0.375rem 0.625rem;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    font-weight: 600;
    border: 1px solid rgba(103, 123, 174, 0.2);
  }
  
  pre {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: #ecf0f1;
    padding: 1.5rem;
    border-radius: 12px;
    overflow-x: auto;
    margin: 1.5rem 0;
    border-left: 4px solid #677bae;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    
    code {
      background: none;
      padding: 0;
      color: inherit;
      border: none;
    }
  }
  
  blockquote {
    border-left: 4px solid #677bae;
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
    background: linear-gradient(135deg, rgba(103, 123, 174, 0.1) 0%, rgba(103, 123, 174, 0.05) 100%);
    font-style: italic;
    color: #bdc3c7;
    border-radius: 0 8px 8px 0;
    position: relative;
    
    &::before {
      content: '"';
      position: absolute;
      top: -0.5rem;
      left: 1rem;
      font-size: 2rem;
      color: #677bae;
      font-weight: bold;
    }
  }
  
  ul, ol {
    margin-left: 2rem;
    margin-bottom: 1.25rem;
  }
  
  li {
    margin-bottom: 0.75rem;
  }
  
  a {
    color: #677bae;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &:hover {
      color: #8a9dc9;
      text-decoration: underline;
    }
  }
  
  hr {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent, #677bae, transparent);
    margin: 2.5rem 0;
    border-radius: 1px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    
    th, td {
      border: 1px solid rgba(103, 123, 174, 0.2);
      padding: 1rem;
      text-align: left;
    }
    
    th {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      font-weight: 700;
      color: #ecf0f1;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    tr:hover {
      background-color: rgba(103, 123, 174, 0.05);
    }
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 1.5rem 0;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    
    &:hover {
      transform: scale(1.02);
      border-color: #677bae;
      box-shadow: 0 8px 24px rgba(103, 123, 174, 0.3);
    }
  }
`;

const CopyLinkButton = styled.button`
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  background: none;
  border: none;
  color: #8a9dc9;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
  
  &:hover {
    color: #677bae;
  }
  
  &:focus {
    outline: none;
    color: #677bae;
  }
`;

// Cross-references styled components
const CrossReferencesContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #2c3e50;
  background-color: rgba(44, 62, 80, 0.3);
`;

const CrossReferencesTitle = styled.h4`
  color: #8a9dc9;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CrossReferencesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
`;

const CrossReferenceItem = styled.div`
  background-color: #34495e;
  border: 1px solid #445566;
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #677bae;
    background-color: #3d566e;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const CrossReferenceType = styled.div`
  background-color: ${props => {
    switch(props.type) {
      case 'related': return '#3498db';
      case 'clarifies': return '#27ae60';
      case 'supersedes': return '#f39c12';
      case 'superseded_by': return '#e74c3c';
      case 'conflicts_with': return '#9b59b6';
      default: return '#95a5a6';
    }
  }};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  margin-bottom: 0.5rem;
`;

const CrossReferenceCode = styled.div`
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #677bae;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const CrossReferenceTitle = styled.div`
  color: #ecf0f1;
  font-weight: 500;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  line-height: 1.3;
`;

const CrossReferenceContext = styled.div`
  color: #bdc3c7;
  font-size: 0.75rem;
  line-height: 1.4;
  font-style: italic;
`;

function RulePage() {
  const { category, rule, subrule } = useParams();
  const location = useLocation();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [copiedRuleCode, setCopiedRuleCode] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [highlightedRuleId, setHighlightedRuleId] = useState(null);
  const [modalImage, setModalImage] = useState({ isOpen: false, url: '', alt: '', images: [], currentIndex: 0 });
  const [crossReferences, setCrossReferences] = useState({});
  const ruleRefs = useRef({});

  const openImageModal = (imageUrl, altText, images = [], currentIndex = 0) => {
    setModalImage({
      isOpen: true,
      url: imageUrl,
      alt: altText,
      images,
      currentIndex
    });
  };

  const closeImageModal = () => {
    setModalImage({ isOpen: false, url: '', alt: '', images: [], currentIndex: 0 });
  };

  const navigateImage = (newIndex) => {
    if (modalImage.images[newIndex]) {
      const newImage = modalImage.images[newIndex];
      setModalImage(prev => ({
        ...prev,
        url: `${BASE_URL}${newImage.url}`,
        alt: newImage.originalName || `Image ${newIndex + 1}`,
        currentIndex: newIndex
      }));
    }
  };

  // Load cross-references for all rules
  const loadCrossReferences = useCallback(async () => {
    if (rules.length === 0) return;
    
    const crossRefsData = {};
    
    // Load cross-references for all rules (main rules and sub-rules)
    const allRules = [];
    rules.forEach(rule => {
      allRules.push(rule);
      if (rule.sub_rules) {
        allRules.push(...rule.sub_rules);
      }
    });
    
    for (const rule of allRules) {
      try {
        const response = await fetch(`${BASE_URL}/api/rules/${rule.id}/cross-references`);
        if (response.ok) {
          const data = await response.json();
          crossRefsData[rule.id] = data;
        }
      } catch (error) {
        console.error(`Error loading cross-references for rule ${rule.id}:`, error);
      }
    }
    
    setCrossReferences(crossRefsData);
  }, [rules]);

  // Navigate to a cross-referenced rule
  const navigateToCrossReference = (relatedRule) => {
    // Extract category from rule code (e.g., "A.1" -> "A")
    const categoryLetter = relatedRule.full_code.split('.')[0].toLowerCase();
    
    if (categoryLetter === category.toLowerCase()) {
      // Same category - scroll to the rule
      setHighlightedRuleId(relatedRule.id);
      
      setTimeout(() => {
        const ruleElement = ruleRefs.current[relatedRule.id];
        if (ruleElement) {
          ruleElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      // Remove highlight after animation
      setTimeout(() => {
        setHighlightedRuleId(null);
      }, 3500);
    } else {
      // Different category - navigate to new page
      window.location.href = `/rules/${categoryLetter}#${relatedRule.full_code}`;
    }
  };

  // Render cross-references for a rule
  const renderCrossReferences = (ruleId) => {
    const ruleCrossRefs = crossReferences[ruleId];
    if (!ruleCrossRefs || Object.keys(ruleCrossRefs).length === 0) {
      return null;
    }

    const totalRefs = Object.values(ruleCrossRefs).reduce((sum, refs) => sum + refs.length, 0);
    
    return (
      <CrossReferencesContainer>
        <CrossReferencesTitle>
          🔗 Related Rules ({totalRefs})
        </CrossReferencesTitle>
        <CrossReferencesGrid>
          {Object.entries(ruleCrossRefs).map(([type, refs]) =>
            refs.map((ref, index) => (
              <CrossReferenceItem
                key={`${type}-${index}`}
                onClick={() => navigateToCrossReference(ref.related_rule)}
              >
                <CrossReferenceType type={type}>
                  {type.replace('_', ' ')}
                </CrossReferenceType>
                <CrossReferenceCode>
                  {ref.related_rule.full_code}
                </CrossReferenceCode>
                <CrossReferenceTitle>
                  {ref.related_rule.title || 'Untitled Rule'}
                </CrossReferenceTitle>
                {ref.reference_context && (
                  <CrossReferenceContext>
                    {ref.reference_context}
                  </CrossReferenceContext>
                )}
              </CrossReferenceItem>
            ))
          )}
        </CrossReferencesGrid>
      </CrossReferencesContainer>
    );
  };

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate category parameter exists
      if (!category) {
        setError('invalid_category');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching rules for category: ${category}`);
      
      // Fetch rules for the category
      const response = await apiService.getRules(category?.toUpperCase());
      console.log(`Received ${response.data.length} rules:`, response.data);
      
      // Log rules with images
      response.data.forEach(rule => {
        if (rule.content && rule.content.includes('<img')) {
          console.log(`Rule ${rule.full_code} has image:`, rule.content);
        }
      });
      
      setRules(response.data);
      
      // Get category info from the first rule
      if (response.data.length > 0) {
        setCategoryInfo({
          name: response.data[0].category_name,
          letter: response.data[0].category_letter
        });
      } else {
        // If no rules found, try to get category info from categories API
        try {
          const categoriesResponse = await fetch('/api/categories');
          const categories = await categoriesResponse.json();
          const categoryData = categories.find(cat => cat.letter_code.toLowerCase() === category.toLowerCase());
          
          if (categoryData) {
            setCategoryInfo({
              name: categoryData.name,
              letter: categoryData.letter_code
            });
          }
        } catch (catErr) {
          console.error('Error fetching category info:', catErr);
        }
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

  // Load cross-references when rules are loaded
  useEffect(() => {
    loadCrossReferences();
  }, [loadCrossReferences]);

  // Add global function for rule navigation from HTML links
  useEffect(() => {
    window.navigateToRule = (ruleCode) => {
      // Find the rule with this code
      const targetRule = rules.find(rule => 
        rule.full_code === ruleCode || 
        (rule.sub_rules && rule.sub_rules.some(sub => sub.full_code === ruleCode))
      );
      
      if (targetRule) {
        // If it's a sub-rule, find the sub-rule ID
        const subRule = targetRule.sub_rules?.find(sub => sub.full_code === ruleCode);
        const ruleId = subRule ? subRule.id : targetRule.id;
        
        setHighlightedRuleId(ruleId);
        
        // Scroll to the rule
        setTimeout(() => {
          const ruleElement = ruleRefs.current[ruleId];
          if (ruleElement) {
            ruleElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 100);
        
        // Remove highlight after animation
        setTimeout(() => {
          setHighlightedRuleId(null);
        }, 3500);
      } else {
        // If rule not found in current category, try to navigate to the correct category
        const categoryLetter = ruleCode.split('.')[0].toLowerCase();
        if (categoryLetter !== category) {
          window.location.href = `/rules/${categoryLetter}`;
        }
      }
    };

    // Cleanup function
    return () => {
      delete window.navigateToRule;
    };
  }, [rules, category]);

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

  // Handle rule highlighting from URL parameters (Discord links, direct navigation)
  useEffect(() => {
    if (rule && rules.length > 0) {
      // Construct the full rule code based on URL parameters
      let targetRuleCode;
      if (subrule) {
        // Sub-rule like C.7.1
        targetRuleCode = `${category.toUpperCase()}.${rule}.${subrule}`;
      } else {
        // Main rule like C.7
        targetRuleCode = `${category.toUpperCase()}.${rule}`;
      }
      
      console.log(`Looking for rule with code: ${targetRuleCode}`);
      
      // Find the rule with this code
      const targetRule = rules.find(rule => 
        rule.full_code === targetRuleCode || 
        (rule.sub_rules && rule.sub_rules.some(sub => sub.full_code === targetRuleCode))
      );
      
      if (targetRule) {
        // If it's a sub-rule, find the sub-rule ID
        const subRule = targetRule.sub_rules?.find(sub => sub.full_code === targetRuleCode);
        const ruleId = subRule ? subRule.id : targetRule.id;
        
        console.log(`Found target rule with ID: ${ruleId}`);
        
        setHighlightedRuleId(ruleId);
        
        // Scroll to the rule after a delay to ensure rendering is complete
        setTimeout(() => {
          const ruleElement = ruleRefs.current[ruleId];
          if (ruleElement) {
            console.log(`Scrolling to rule element:`, ruleElement);
            ruleElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          } else {
            console.log(`Rule element not found in refs for ID: ${ruleId}`);
          }
        }, 500); // Slightly longer delay for URL navigation
        
        // Remove highlight after animation completes
        setTimeout(() => {
          setHighlightedRuleId(null);
        }, 4000); // Slightly longer highlight for URL navigation
      } else {
        console.log(`Target rule not found with code: ${targetRuleCode}`);
      }
    }
  }, [category, rule, subrule, rules]);

  const copyToClipboard = async (text) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedRuleCode(text);
        setTimeout(() => setCopiedRuleCode(null), 2000);
        return;
      }
      
      // Fallback for HTTP or older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiedRuleCode(text);
        setTimeout(() => setCopiedRuleCode(null), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        // Show user-friendly message
        alert(`Please copy this rule code manually: ${text}`);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Show user-friendly message as last resort
      alert(`Please copy this rule code manually: ${text}`);
    }
  };

  const copyRuleLink = async (ruleCode, ruleId) => {
    try {
      // Parse rule code to create proper URL
      const parts = ruleCode.split('.');
      let url;
      if (parts.length >= 3) {
        // Sub-rule like C.7.1 -> /rules/C/7/1
        url = `${window.location.origin}/rules/${parts[0]}/${parts[1]}/${parts[2]}`;
      } else if (parts.length >= 2) {
        // Main rule like C.7 -> /rules/C/7
        url = `${window.location.origin}/rules/${parts[0]}/${parts[1]}`;
      } else {
        // Fallback
        url = `${window.location.origin}/rules/${category}`;
      }
      
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setCopiedLinkId(ruleId);
        setTimeout(() => setCopiedLinkId(null), 2000);
        return;
      }
      
      // Fallback for HTTP or older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiedLinkId(ruleId);
        setTimeout(() => setCopiedLinkId(null), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        // Show user-friendly message
        alert(`Please copy this link manually: ${url}`);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy link to clipboard:', err);
      // Show user-friendly message as last resort
      const parts = ruleCode.split('.');
      let url;
      if (parts.length >= 3) {
        url = `${window.location.origin}/rules/${parts[0]}/${parts[1]}/${parts[2]}`;
      } else if (parts.length >= 2) {
        url = `${window.location.origin}/rules/${parts[0]}/${parts[1]}`;
      } else {
        url = `${window.location.origin}/rules/${category}`;
      }
      alert(`Please copy this link manually: ${url}`);
    }
  };

  const formatContent = (content) => {
    // Convert Markdown to HTML and render
    const htmlContent = markdownToHtml(content);
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
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
              {rule.title && <RuleTitle>{rule.title}</RuleTitle>}
              <RuleCode onClick={() => copyToClipboard(rule.full_code)}>
                {rule.full_code}
                {copiedRuleCode === rule.full_code && (
                  <CopyNotification>
                    Copied!
                  </CopyNotification>
                )}
              </RuleCode>
            </RuleHeader>
            
            {/* Main rule content wrapper with conditional padding */}
            <div style={{ 
              paddingBottom: rule.sub_rules && rule.sub_rules.length > 0 ? '3rem' : '2.5rem'
            }}>
              <StyledRuleContent>
                {formatContent(rule.content)}
              </StyledRuleContent>
              
              {/* Display separate images array */}
              {(() => {
                let images = [];
                try {
                  if (rule.images) {
                    images = Array.isArray(rule.images) ? rule.images : JSON.parse(rule.images);
                  }
                } catch (e) {
                  console.error('Error parsing rule images:', e, 'Raw images:', rule.images);
                  images = [];
                }
                
                return images && images.length > 0 && (
                  <div style={{ 
                    padding: '0 1.5rem 1.5rem 1.5rem',
                    borderTop: '1px solid #2c3e50',
                    marginTop: '1rem'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      {images.map((image, index) => (
                        <img 
                          key={index}
                          src={`${BASE_URL}${image.thumbnailUrl}`}
                          alt={image.originalName || `Rule image ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '120px', 
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #445566',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => openImageModal(`${BASE_URL}${image.url}`, image.originalName || `Rule image ${index + 1}`, images, index)}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.02)';
                            e.target.style.borderColor = '#677bae';
                            e.target.style.boxShadow = '0 4px 12px rgba(103, 123, 174, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.borderColor = '#445566';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Cross-references section */}
            {renderCrossReferences(rule.id)}
            
            {/* Copy Link Button - positioned at container level */}
            <CopyLinkButton
              onClick={() => copyRuleLink(rule.full_code, rule.id)}
              title="Copy direct link to this rule"
            >
              {copiedLinkId === rule.id ? 'Link Copied!' : 'Copy Link'}
            </CopyLinkButton>
            
            {rule.sub_rules && rule.sub_rules.length > 0 && (
              <SubRuleContainer>
                {rule.sub_rules.map((subRule) => (
                  <SubRule 
                    key={subRule.id}
                    ref={el => ruleRefs.current[subRule.id] = el}
                    $highlighted={highlightedRuleId === subRule.id}
                  >
                    <SubRuleHeader>
                      {subRule.title && <SubRuleTitle>{subRule.title}</SubRuleTitle>}
                      <SubRuleCode onClick={() => copyToClipboard(subRule.full_code)}>
                        {subRule.full_code}
                        {copiedRuleCode === subRule.full_code && (
                          <CopyNotification>
                            Copied!
                          </CopyNotification>
                        )}
                      </SubRuleCode>
                    </SubRuleHeader>
                    <StyledRuleContent>
                      {formatContent(subRule.content)}
                    </StyledRuleContent>
                    
                    {/* Cross-references section for sub-rule */}
                    {renderCrossReferences(subRule.id)}
                    
                    {/* Copy Link Button for Sub-rule */}
                    <CopyLinkButton
                      onClick={() => copyRuleLink(subRule.full_code, subRule.id)}
                      title="Copy direct link to this sub-rule"
                    >
                      {copiedLinkId === subRule.id ? 'Link Copied!' : 'Copy Link'}
                    </CopyLinkButton>
                    
                    {/* Display separate images array for sub-rules */}
                    {(() => {
                      let images = [];
                      try {
                        if (subRule.images) {
                          images = Array.isArray(subRule.images) ? subRule.images : JSON.parse(subRule.images);
                        }
                      } catch (e) {
                        console.error('Error parsing sub-rule images:', e, 'Raw images:', subRule.images);
                        images = [];
                      }
                      
                      return images && images.length > 0 && (
                        <div style={{ 
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          borderTop: '1px solid #34495e',
                          marginTop: '1rem'
                        }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                            gap: '1rem',
                            marginTop: '1rem'
                          }}>
                            {images.map((image, index) => (
                              <img 
                                key={index}
                                src={`${BASE_URL}${image.thumbnailUrl}`}
                                alt={image.originalName || `Sub-rule image ${index + 1}`}
                                style={{ 
                                  width: '100%', 
                                  height: '120px', 
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '2px solid #445566',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => openImageModal(`${BASE_URL}${image.url}`, image.originalName || `Sub-rule image ${index + 1}`, images, index)}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.02)';
                                  e.target.style.borderColor = '#677bae';
                                  e.target.style.boxShadow = '0 4px 12px rgba(103, 123, 174, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.borderColor = '#445566';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </SubRule>
                ))}
              </SubRuleContainer>
            )}
          </RuleContainer>
        ))
      )}

      <ImageModal
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
        imageUrl={modalImage.url}
        altText={modalImage.alt}
        images={modalImage.images}
        currentIndex={modalImage.currentIndex}
        onNavigate={modalImage.images.length > 1 ? navigateImage : null}
      />
    </Container>
  );
}

export default RulePage; 