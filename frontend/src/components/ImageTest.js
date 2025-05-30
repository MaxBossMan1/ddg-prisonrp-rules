import React from 'react';

const ImageTest = () => {
  const testImageUrl = "http://localhost:3001/uploads/images/1748367530368_8hp556t7jd6.webp";
  
  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
      <h3>Image Test Component</h3>
      <p>Testing direct image load:</p>
      <img 
        src={testImageUrl} 
        alt="Test" 
        style={{ maxWidth: '300px', border: '1px solid blue' }}
        onLoad={() => console.log('TEST IMAGE LOADED SUCCESSFULLY')}
        onError={(e) => {
          console.error('TEST IMAGE FAILED TO LOAD:', testImageUrl);
          console.error('Error event:', e);
        }}
      />
      <p>Image URL: {testImageUrl}</p>
    </div>
  );
};

export default ImageTest; 