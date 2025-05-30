import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #34495e;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #2c3e50;
`;

const ModalTitle = styled.h2`
  color: #ecf0f1;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2c3e50;
    color: #ecf0f1;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #ecf0f1;
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 6px;
  padding: 0.75rem;
  color: #ecf0f1;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #677bae;
    box-shadow: 0 0 0 2px rgba(103, 123, 174, 0.2);
  }
  
  &::placeholder {
    color: #95a5a6;
  }
`;

const Select = styled.select`
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 6px;
  padding: 0.75rem;
  color: #ecf0f1;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #677bae;
    box-shadow: 0 0 0 2px rgba(103, 123, 174, 0.2);
  }
  
  option {
    background-color: #2c3e50;
    color: #ecf0f1;
  }
`;

const TextArea = styled.textarea`
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 6px;
  padding: 0.75rem;
  color: #ecf0f1;
  font-size: 1rem;
  min-height: 200px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  
  &:focus {
    outline: none;
    border-color: #677bae;
    box-shadow: 0 0 0 2px rgba(103, 123, 174, 0.2);
  }
  
  &::placeholder {
    color: #95a5a6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #677bae;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #8a9dc9;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #95a5a6;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #7f8c8d;
  }
`;

const ErrorMessage = styled.div`
  background-color: #e74c3c;
  color: white;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const HelpText = styled.div`
  color: #95a5a6;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const PreviewSection = styled.div`
  background-color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
`;

const PreviewTitle = styled.h4`
  color: #ecf0f1;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const PreviewContent = styled.div`
  color: #e9ecef;
  line-height: 1.6;
  white-space: pre-wrap;
`;

function RuleEditor({ isOpen, onClose, onSave, rule = null, categories = [], parentRules = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    parentRuleId: '',
    ruleType: 'main'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize form data when rule changes
  useEffect(() => {
    if (rule) {
      setFormData({
        title: rule.title || '',
        content: rule.content || '',
        categoryId: rule.category_id || '',
        parentRuleId: rule.parent_rule_id || '',
        ruleType: rule.rule_type || 'main'
      });
    } else {
      setFormData({
        title: '',
        content: '',
        categoryId: '',
        parentRuleId: '',
        ruleType: 'main'
      });
    }
    setError(null);
  }, [rule, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear parent rule if switching to main rule
    if (name === 'ruleType' && value === 'main') {
      setFormData(prev => ({
        ...prev,
        parentRuleId: ''
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Rule title is required');
      return false;
    }
    
    if (!formData.content.trim()) {
      setError('Rule content is required');
      return false;
    }
    
    if (!formData.categoryId) {
      setError('Please select a category');
      return false;
    }
    
    if (formData.ruleType === 'sub' && !formData.parentRuleId) {
      setError('Please select a parent rule for sub-rules');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category_id: parseInt(formData.categoryId),
        parent_rule_id: formData.parentRuleId ? parseInt(formData.parentRuleId) : null,
        rule_type: formData.ruleType
      };
      
      await onSave(submitData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const formatPreviewContent = (content) => {
    // Convert newlines to paragraphs and handle bullet points
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim().startsWith('•')) {
        // Handle bullet points
        const items = paragraph.split('\n').filter(item => item.trim());
        return (
          <ul key={index} style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>{item.replace('•', '').trim()}</li>
            ))}
          </ul>
        );
      } else if (paragraph.match(/^\d+\./)) {
        // Handle numbered lists
        const items = paragraph.split('\n').filter(item => item.trim());
        return (
          <ol key={index} style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>{item.replace(/^\d+\./, '').trim()}</li>
            ))}
          </ol>
        );
      } else {
        return <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>;
      }
    });
  };

  if (!isOpen) return null;

  const availableParentRules = parentRules.filter(r => 
    r.category_id === parseInt(formData.categoryId) && 
    r.rule_type === 'main' &&
    r.id !== rule?.id // Don't allow selecting self as parent
  );

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {rule ? 'Edit Rule' : 'Add New Rule'}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Rule Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter rule title..."
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="categoryId">Category *</Label>
            <Select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.letter_code}: {category.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="ruleType">Rule Type *</Label>
            <Select
              id="ruleType"
              name="ruleType"
              value={formData.ruleType}
              onChange={handleInputChange}
              required
            >
              <option value="main">Main Rule</option>
              <option value="sub">Sub-rule</option>
            </Select>
            <HelpText>
              Main rules get their own number (e.g., A.1). Sub-rules are nested under main rules (e.g., A.1.1).
            </HelpText>
          </FormGroup>

          {formData.ruleType === 'sub' && (
            <FormGroup>
              <Label htmlFor="parentRuleId">Parent Rule *</Label>
              <Select
                id="parentRuleId"
                name="parentRuleId"
                value={formData.parentRuleId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select parent rule...</option>
                {availableParentRules.map(parentRule => (
                  <option key={parentRule.id} value={parentRule.id}>
                    {parentRule.letter_code}.{parentRule.rule_number}: {parentRule.title}
                  </option>
                ))}
              </Select>
              <HelpText>
                Sub-rules will be numbered automatically (e.g., if parent is A.1, this will be A.1.1, A.1.2, etc.)
              </HelpText>
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="content">Rule Content *</Label>
            <TextArea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter rule content...

You can use:
• Bullet points with •
• Numbered lists with 1., 2., etc.
• Multiple paragraphs separated by blank lines"
              required
            />
            <HelpText>
              Use bullet points (•) for lists, numbered lists (1., 2.), and separate paragraphs with blank lines.
            </HelpText>
          </FormGroup>

          {formData.content && (
            <FormGroup>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Label>Preview</Label>
                <Button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  style={{ 
                    background: 'none', 
                    border: '1px solid #677bae', 
                    color: '#677bae',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem'
                  }}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
              {showPreview && (
                <PreviewSection>
                  <PreviewTitle>{formData.title || 'Rule Title'}</PreviewTitle>
                  <PreviewContent>
                    {formatPreviewContent(formData.content)}
                  </PreviewContent>
                </PreviewSection>
              )}
            </FormGroup>
          )}

          <ButtonGroup>
            <SecondaryButton type="button" onClick={onClose} disabled={loading}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
            </PrimaryButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default RuleEditor; 