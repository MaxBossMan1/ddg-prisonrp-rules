import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import LazyImage from './LazyImage';

const ImageWrapper = styled.div`
  position: relative;
  display: inline-block;
  max-width: 300px;
  max-height: 200px;
  margin: 0.5rem 0.5rem 0.5rem 0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

const StyledLazyImage = styled(LazyImage)`
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  border-radius: 6px;
`;

const HoverPreview = styled.div`
  position: fixed;
  z-index: 9999;
  max-width: 600px;
  max-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  background-color: #2c3e50;
  border: 2px solid #677bae;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.95)'};
  transition: all 0.2s ease;
  pointer-events: none;
  
  /* Ensure it appears above everything */
  transform-origin: center;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  transform: ${props => props.$visible ? 'scale(1)' : 'scale(0.9)'};
  transition: transform 0.3s ease;
`;

const ModalImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 95vw;
  max-height: 95vh;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  z-index: 10001;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
`;

const ImageCaption = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 1rem;
  font-size: 0.9rem;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? 0 : '100%'});
  transition: all 0.3s ease 0.1s;
`;

function RuleImage({ src, alt, caption, className }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const previewRef = useRef(null);
  const timeoutRef = useRef(null);

  // Handle mouse enter with delay
  const handleMouseEnter = (e) => {
    timeoutRef.current = setTimeout(() => {
      if (imageLoaded) {
        updatePreviewPosition(e);
        setShowPreview(true);
      }
    }, 300); // 300ms delay for hover
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPreview(false);
  };

  // Update preview position based on mouse
  const updatePreviewPosition = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const previewWidth = 600;
    const previewHeight = 400;
    
    let newX = x + 20;
    let newY = y + 20;
    
    // Keep preview within viewport
    if (newX + previewWidth > windowWidth) {
      newX = x - previewWidth - 20;
    }
    if (newY + previewHeight > windowHeight) {
      newY = y - previewHeight - 20;
    }
    
    // Ensure preview doesn't go off-screen
    newX = Math.max(10, Math.min(newX, windowWidth - previewWidth - 10));
    newY = Math.max(10, Math.min(newY, windowHeight - previewHeight - 10));
    
    setPreviewPosition({ x: newX, y: newY });
  };

  // Handle mouse move for preview following
  const handleMouseMove = (e) => {
    if (showPreview) {
      updatePreviewPosition(e);
    }
  };

  // Handle click to open modal
  const handleClick = () => {
    if (imageLoaded) {
      setShowModal(true);
      setShowPreview(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <ImageWrapper
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        <StyledLazyImage
          src={src}
          alt={alt}
          onLoad={() => setImageLoaded(true)}
          placeholder="Loading image..."
        />
      </ImageWrapper>

      {/* Hover Preview */}
      {showPreview && imageLoaded && (
        <HoverPreview
          ref={previewRef}
          $visible={showPreview}
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
          }}
        >
          <PreviewImage src={src} alt={alt} />
          {caption && (
            <ImageCaption $visible={showPreview}>
              {caption}
            </ImageCaption>
          )}
        </HoverPreview>
      )}

      {/* Full Screen Modal */}
      <Modal $visible={showModal} onClick={handleCloseModal}>
        <ModalContent $visible={showModal} onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={handleCloseModal}>×</CloseButton>
          <ModalImage src={src} alt={alt} />
          {caption && (
            <ImageCaption $visible={showModal}>
              {caption}
            </ImageCaption>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default RuleImage; 