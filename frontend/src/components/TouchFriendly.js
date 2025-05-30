import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

// Touch-friendly button with larger touch targets
const TouchButton = styled.button`
  min-height: 44px; /* iOS recommended minimum */
  min-width: 44px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: ${props => props.$variant === 'primary' ? '#677bae' : '#34495e'};
  color: #ecf0f1;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  /* Touch-specific styles */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  
  /* Ripple effect container */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }
  
  &.ripple::before {
    width: 300px;
    height: 300px;
  }
  
  &:hover:not(:disabled) {
    background-color: ${props => props.$variant === 'primary' ? '#8a9dc9' : '#455a75'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Focus styles for accessibility */
  &:focus-visible {
    outline: 3px solid #677bae;
    outline-offset: 2px;
  }
`;

// Swipeable container for cards
const SwipeContainer = styled.div`
  overflow: hidden;
  touch-action: pan-y pinch-zoom;
  position: relative;
  
  &.swiping {
    user-select: none;
  }
`;

const SwipeContent = styled.div`
  transform: translateX(${props => props.$translateX}px);
  transition: transform ${props => props.$isAnimating ? '0.3s ease-out' : '0ms'};
  will-change: transform;
`;

// Touch-friendly card with better interactions
const TouchCard = styled.div`
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  
  /* Touch optimization */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  
  /* Minimum touch target */
  min-height: 64px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border-color: #677bae;
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
  
  /* Focus styles */
  &:focus-visible {
    outline: 3px solid #677bae;
    outline-offset: 2px;
  }
`;

// Hook for touch gestures
export const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500
  } = options;

  const touchRef = useRef(null);
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isTouch: false,
    startTime: 0
  });

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isTouch: true,
      startTime: Date.now()
    });

    // Start long press timer
    if (onLongPress) {
      setTimeout(() => {
        if (touchState.isTouch) {
          const deltaX = Math.abs(touchState.currentX - touchState.startX);
          const deltaY = Math.abs(touchState.currentY - touchState.startY);
          if (deltaX < 10 && deltaY < 10) {
            onLongPress();
            // Haptic feedback if available
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }
          }
        }
      }, longPressDelay);
    }
  };

  const handleTouchMove = (e) => {
    if (!touchState.isTouch) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
  };

  const handleTouchEnd = () => {
    if (!touchState.isTouch) return;

    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine gesture type
    if (absDeltaX < 10 && absDeltaY < 10 && deltaTime < 300) {
      // Tap
      if (onTap) {
        onTap();
        // Light haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    } else if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
      // Swipe
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
      
      // Medium haptic feedback for swipes
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }

    setTouchState(prev => ({ ...prev, isTouch: false }));
  };

  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchState]);

  return { touchRef, touchState };
};

// Ripple effect for buttons
export const useRippleEffect = () => {
  const addRipple = (e) => {
    const button = e.currentTarget;
    button.classList.add('ripple');
    
    setTimeout(() => {
      button.classList.remove('ripple');
    }, 300);
  };

  return { addRipple };
};

// Main touch-friendly components
export const TouchFriendlyButton = ({ 
  children, 
  onClick, 
  variant = 'secondary', 
  disabled = false,
  ...props 
}) => {
  const { addRipple } = useRippleEffect();

  const handleClick = (e) => {
    if (!disabled) {
      addRipple(e);
      if (onClick) onClick(e);
    }
  };

  return (
    <TouchButton
      $variant={variant}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </TouchButton>
  );
};

export const TouchFriendlyCard = ({ 
  children, 
  onClick, 
  onSwipeLeft, 
  onSwipeRight,
  className,
  ...props 
}) => {
  const { touchRef } = useTouchGestures({
    onTap: onClick,
    onSwipeLeft,
    onSwipeRight
  });

  return (
    <TouchCard
      ref={touchRef}
      className={className}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
      {...props}
    >
      {children}
    </TouchCard>
  );
};

export const SwipeableContainer = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  threshold = 100 
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { touchRef, touchState } = useTouchGestures({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: threshold
  });

  useEffect(() => {
    if (touchState.isTouch) {
      const deltaX = touchState.currentX - touchState.startX;
      setTranslateX(deltaX * 0.3); // Reduced movement for resistance
    } else {
      // Snap back
      setIsAnimating(true);
      setTranslateX(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [touchState]);

  return (
    <SwipeContainer
      ref={touchRef}
      className={touchState.isTouch ? 'swiping' : ''}
    >
      <SwipeContent $translateX={translateX} $isAnimating={isAnimating}>
        {children}
      </SwipeContent>
    </SwipeContainer>
  );
};

// Export all components
export { TouchButton, TouchCard, SwipeContainer, SwipeContent }; 