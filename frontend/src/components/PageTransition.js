import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useLocation } from 'react-router-dom';

// Page transition animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInFromLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(103, 123, 174, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(103, 123, 174, 0.8), 0 0 30px rgba(103, 123, 174, 0.4);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Page transition container
const PageContainer = styled.div`
  animation: ${props => {
    switch(props.$animation) {
      case 'fadeInUp': return css`${fadeInUp} 0.6s ease-out`;
      case 'fadeInDown': return css`${fadeInDown} 0.6s ease-out`;
      case 'slideInLeft': return css`${slideInFromLeft} 0.6s ease-out`;
      case 'slideInRight': return css`${slideInFromRight} 0.6s ease-out`;
      case 'scaleIn': return css`${scaleIn} 0.5s ease-out`;
      default: return css`${fadeInUp} 0.6s ease-out`;
    }
  }};
  
  /* Stagger child animations */
  > * {
    animation-delay: ${props => props.$delay || '0s'};
  }
`;

// Staggered animation container
const StaggerContainer = styled.div`
  > * {
    opacity: 0;
    animation: ${fadeInUp} 0.6s ease-out forwards;
  }
  
  ${props => props.$stagger && Array.from({ length: 10 }, (_, i) => css`
    > *:nth-child(${i + 1}) {
      animation-delay: ${i * 0.1}s;
    }
  `)}
`;

// Micro-interaction components
const HoverLift = styled.div`
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }
`;

const PulseOnHover = styled.div`
  transition: all 0.3s ease;
  
  &:hover {
    animation: ${glowPulse} 2s infinite;
  }
`;

const FloatingElement = styled.div`
  animation: ${float} 3s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
`;

// Loading animations
const shimmerWave = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const ShimmerCard = styled.div`
  background: linear-gradient(90deg, #34495e 25%, #455a75 37%, #34495e 63%);
  background-size: 400px 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  height: ${props => props.$height || '100px'};
  margin-bottom: 1rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: ${shimmerWave} 2s infinite;
  }
`;

// Scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
};

const ScrollAnimatedDiv = styled.div`
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? 0 : '50px'});
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transition-delay: ${props => props.$delay || '0s'};
`;

// Page transition hook
export const usePageTransition = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
      setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 300);
    }
  }, [location, displayLocation]);

  return { displayLocation, transitionStage };
};

// Route-based animation mapping
const getAnimationForRoute = (pathname) => {
  if (pathname === '/') return 'fadeInUp';
  if (pathname.startsWith('/rules/')) return 'slideInLeft';
  return 'fadeInUp';
};

// Main page transition component
export const PageTransition = ({ children, className }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const animation = getAnimationForRoute(location.pathname);

  return (
    <PageContainer
      $animation={animation}
      className={className}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {children}
    </PageContainer>
  );
};

// Scroll-triggered animation component
export const ScrollAnimation = ({ children, delay = 0, animation = 'fadeInUp' }) => {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <ScrollAnimatedDiv
      ref={ref}
      $visible={isVisible}
      $delay={`${delay}s`}
    >
      {children}
    </ScrollAnimatedDiv>
  );
};

// Staggered children animation
export const StaggeredAnimation = ({ children, stagger = true, delay = 100 }) => {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <div ref={ref}>
      <StaggerContainer $stagger={stagger && isVisible}>
        {React.Children.map(children, (child, index) => (
          <div style={{ animationDelay: isVisible ? `${index * delay}ms` : '0ms' }}>
            {child}
          </div>
        ))}
      </StaggerContainer>
    </div>
  );
};

// Button with micro-interactions
export const AnimatedButton = styled.button`
  background-color: #677bae;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(103, 123, 174, 0.4);
    
    &::before {
      width: 300px;
      height: 300px;
    }
  }
  
  &:active {
    transform: translateY(0) scale(1);
    transition: transform 0.1s;
  }
  
  &:focus-visible {
    outline: 3px solid rgba(103, 123, 174, 0.5);
    outline-offset: 2px;
  }
`;

// Card with entrance animation
export const AnimatedCard = styled.div`
  background-color: #34495e;
  border: 1px solid #2c3e50;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    transform: translateY(-8px) rotateX(5deg);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    border-color: #677bae;
  }
`;

// Export all animation utilities
export {
  HoverLift,
  PulseOnHover,
  FloatingElement,
  ShimmerCard,
  PageContainer,
  StaggerContainer,
  ScrollAnimatedDiv
}; 