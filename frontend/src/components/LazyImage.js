import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ImageContainer = styled.div`
  position: relative;
  overflow: hidden;
  background-color: #2c3e50;
  border-radius: 4px;
  transition: all 0.3s ease;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: ${props => props.$loaded ? 1 : 0};
  transform: ${props => props.$loaded ? 'scale(1)' : 'scale(1.05)'};
`;

const Placeholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #34495e 25%, #455a75 37%, #34495e 63%);
  background-size: 400px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #95a5a6;
  font-size: 0.9rem;
  opacity: ${props => props.$loaded ? 0 : 1};
  transition: opacity 0.3s ease;
  
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
`;

const ErrorState = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #34495e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #95a5a6;
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
  border: 2px dashed #2c3e50;
`;

const LoadingProgress = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: #677bae;
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
  opacity: ${props => props.$loaded ? 0 : 1};
`;

const LazyImage = ({ 
  src, 
  alt, 
  className,
  style,
  placeholder = "Loading image...",
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = "50px"
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const [progress, setProgress] = useState(0);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, inView]);

  // Simulate loading progress (for better UX)
  useEffect(() => {
    if (inView && !loaded && !error) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [inView, loaded, error]);

  const handleLoad = (e) => {
    setLoaded(true);
    setProgress(100);
    setTimeout(() => setProgress(0), 300);
    onLoad && onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    setProgress(0);
    onError && onError(e);
  };

  return (
    <ImageContainer ref={containerRef} className={className} style={style}>
      {inView && (
        <>
          <Image
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            $loaded={loaded}
          />
          <LoadingProgress $progress={progress} $loaded={loaded} />
        </>
      )}
      
      {!loaded && !error && (
        <Placeholder $loaded={loaded}>
          {inView ? placeholder : "📷"}
        </Placeholder>
      )}
      
      {error && (
        <ErrorState>
          <div>
            ⚠️<br />
            Failed to load image
          </div>
        </ErrorState>
      )}
    </ImageContainer>
  );
};

export default LazyImage; 