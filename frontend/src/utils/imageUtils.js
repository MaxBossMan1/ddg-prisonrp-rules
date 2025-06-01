// Dynamic backend URL configuration - Auto-detect environment
const getBackendUrl = () => {
  const hostname = window.location.hostname;
  
  // If we're running on localhost or 127.0.0.1, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If we're on the server IP or any other domain, use the same host with port 3001
  return `http://${hostname}:3001`;
};

// Utility function to resolve image URLs for development vs production
export const resolveImageUrl = (relativePath) => {
  // In development, proxy images to backend server
  // In production, images will be served from the same domain
  if (process.env.NODE_ENV === 'development') {
    // Use dynamic backend URL detection
    return `${getBackendUrl()}${relativePath}`;
  } else {
    // For production, use relative paths (same domain)
    return relativePath;
  }
};

// Extract and resolve all image URLs from HTML content
export const resolveImagesInContent = (htmlContent) => {
  if (!htmlContent) return htmlContent;
  
  // Replace all relative image URLs with resolved URLs
  return htmlContent.replace(
    /src="(\/uploads\/[^"]+)"/g,
    (match, relativePath) => `src="${resolveImageUrl(relativePath)}"`
  );
};

// Extract image data from HTML content for hover previews
export const extractImagesFromContent = (htmlContent) => {
  if (!htmlContent) return [];
  
  const imageRegex = /<img[^>]*src="([^"]*)"[^>]*data-thumbnail="([^"]*)"[^>]*>/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(htmlContent)) !== null) {
    images.push({
      src: resolveImageUrl(match[1]),
      thumbnail: resolveImageUrl(match[2]),
      fullMatch: match[0]
    });
  }
  
  return images;
}; 