// Utility function to resolve image URLs for development vs production
export const resolveImageUrl = (relativePath) => {
  // In development, proxy images to backend server
  // In production, images will be served from the same domain
  if (process.env.NODE_ENV === 'development') {
    // For development, images are served from backend on Google Cloud
    return `http://34.132.234.56:3001${relativePath}`;
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