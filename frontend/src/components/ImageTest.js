import React from 'react';

// Test component for verifying image loading
const testImageUrl = "/uploads/images/1748367530368_8hp556t7jd6.webp"; // Use relative path for dynamic resolution

const ImageTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Image Loading Test</h3>
      <p>Testing if images load correctly from the backend:</p>
      <img 
        src={testImageUrl} 
        alt="Test upload" 
        style={{ 
          maxWidth: '200px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
        onLoad={() => console.log('✅ Image loaded successfully')}
        onError={(e) => {
          console.error('❌ Image failed to load:', e.target.src);
          e.target.style.border = '2px solid red';
        }}
      />
      <p><small>Path: {testImageUrl}</small></p>
    </div>
  );
};

export default ImageTest; 