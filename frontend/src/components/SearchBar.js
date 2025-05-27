import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/api';

const SearchContainer = styled.div`
  position: relative;
  max-width: 600px;
  margin: 0 auto;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1.5rem 1rem 3rem;
  font-size: 1rem;
  border: 2px solid #34495e;
  border-radius: 12px;
  background-color: #2c3e50;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%2395a5a6' viewBox='0 0 16 16'%3e%3cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: 1rem center;
  background-size: 1rem;
  color: #ecf0f1;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &:hover {
    border-color: #677bae;
    background-color: #34495e;
  }
  
  &:focus {
    border-color: #677bae;
    background-color: #34495e;
    box-shadow: 0 0 0 3px rgba(103, 123, 174, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &::placeholder {
    color: #95a5a6;
    font-weight: 400;
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.5rem;
`;

const SearchResult = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #2c3e50;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #2c3e50;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const RuleCode = styled.span`
  font-weight: 600;
  color: #677bae;
  font-size: 0.9rem;
`;

const RuleDescription = styled.div`
  color: #bdc3c7;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const NoResults = styled.div`
  padding: 1rem;
  text-align: center;
  color: #95a5a6;
  font-style: italic;
`;

function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length >= 2) {
      timeoutRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          const response = await apiService.searchRules(query);
          setResults(response.data || []);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
          setShowResults(false);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleResultClick = (result) => {
    // Close search results
    setShowResults(false);
    setQuery('');
    
    // Navigate to the rule's category page with rule highlighting
    // Extract category letter from the rule code (e.g., "A.1" -> "A")
    if (result.code) {
      const categoryLetter = result.code.split('.')[0].toLowerCase();
      // Include the rule ID in the URL state for highlighting
      navigate(`/rules/${categoryLetter}`, { 
        state: { 
          highlightRuleId: result.id,
          highlightRuleCode: result.code 
        } 
      });
    } else if (result.category_letter) {
      // Fallback to category letter if available
      navigate(`/rules/${result.category_letter.toLowerCase()}`);
    }
  };

  return (
    <SearchContainer ref={searchRef}>
      <SearchInput
        type="text"
        placeholder="Search rules and guidelines..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim().length >= 2 && setShowResults(true)}
      />
      
      {showResults && (
        <SearchResults>
          {loading ? (
            <NoResults>Searching...</NoResults>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <SearchResult key={index} onClick={() => handleResultClick(result)}>
                <RuleCode>{result.code || 'N/A'}</RuleCode>
                <RuleDescription>
                  {result.description || result.title || 'No description available'}
                </RuleDescription>
              </SearchResult>
            ))
          ) : query.trim().length >= 2 ? (
            <NoResults>No rules found matching "{query}"</NoResults>
          ) : null}
        </SearchResults>
      )}
    </SearchContainer>
  );
}

export default SearchBar; 