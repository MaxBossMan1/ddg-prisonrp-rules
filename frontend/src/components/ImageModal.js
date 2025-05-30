import React, { useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  cursor: default;
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
`;

const CloseButton = styled.button`
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
`;

const ImageInfo = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  font-size: 0.9rem;
  backdrop-filter: blur(4px);
  text-align: center;
  max-width: 80vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NavigationButton = styled.button`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  
  ${props => props.direction === 'prev' ? 'left: 2rem;' : 'right: 2rem;'}
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-50%) scale(1.1);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    
    &:hover {
      transform: translateY(-50%) scale(1);
      background: rgba(0, 0, 0, 0.7);
    }
  }
`;

function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText, 
  images = [], 
  currentIndex = 0, 
  onNavigate 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (onNavigate && currentIndex > 0) {
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (onNavigate && currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onNavigate, currentIndex, images.length]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const showNavigation = images.length > 1 && onNavigate;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalImage 
          src={imageUrl} 
          alt={altText || 'Full size image'} 
          draggable={false}
        />
      </ModalContent>
      
      <CloseButton onClick={onClose} title="Close (Esc)">
        ×
      </CloseButton>
      
      {showNavigation && (
        <>
          <NavigationButton
            direction="prev"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex <= 0}
            title="Previous image (←)"
          >
            ‹
          </NavigationButton>
          <NavigationButton
            direction="next"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex >= images.length - 1}
            title="Next image (→)"
          >
            ›
          </NavigationButton>
        </>
      )}
      
      {altText && (
        <ImageInfo>
          {showNavigation && `${currentIndex + 1} / ${images.length} • `}
          {altText}
        </ImageInfo>
      )}
    </ModalOverlay>
  );
}

export default ImageModal; 