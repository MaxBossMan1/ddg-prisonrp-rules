import { marked } from 'marked';

// Configure marked for our use case
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  sanitize: false, // We trust our content since it's from staff
  smartLists: true,
  smartypants: false
});

/**
 * Convert Markdown content to HTML
 * @param {string} content - Markdown content
 * @returns {string} HTML content
 */
export const markdownToHtml = (content) => {
  if (!content) return '';
  
  // Check if content is already HTML (legacy content or has color spans)
  const hasHtmlTags = /<[^>]*>/g.test(content);
  
  if (hasHtmlTags) {
    // Content contains HTML tags (like color spans)
    // We need to process it carefully to preserve HTML while processing markdown
    
    // Split content into HTML and non-HTML parts
    const parts = content.split(/(<[^>]*>.*?<\/[^>]*>|<[^>]*\/?>)/g);
    
    const processedParts = parts.map(part => {
      // If this part is an HTML tag, preserve it
      if (part.match(/^<[^>]*>/) || part.match(/^<[^>]*\/?>$/)) {
        return part;
      }
      // If this part is wrapped in HTML tags, preserve the wrapper but process the content
      const wrappedMatch = part.match(/^(<[^>]*>)(.*?)(<\/[^>]*>)$/);
      if (wrappedMatch) {
        const [, openTag, innerContent, closeTag] = wrappedMatch;
        // Only process inner content as markdown if it doesn't contain HTML
        if (!/<[^>]*>/g.test(innerContent)) {
          try {
            const processedInner = marked(innerContent);
            // Remove the <p> wrapper that marked adds for single lines
            const cleanInner = processedInner.replace(/^<p>(.*)<\/p>\s*$/, '$1');
            return openTag + cleanInner + closeTag;
          } catch (error) {
            return part;
          }
        }
        return part;
      }
      // If this is plain text, process as markdown
      if (!/<[^>]*>/g.test(part) && part.trim()) {
        try {
          return marked(part);
        } catch (error) {
          return part;
        }
      }
      return part;
    });
    
    return processedParts.join('');
  }
  
  // Content is pure Markdown, convert to HTML normally
  try {
    return marked(content);
  } catch (error) {
    console.error('Error converting Markdown to HTML:', error);
    // Fallback to plain text with line breaks
    return content.replace(/\n/g, '<br>');
  }
};

/**
 * Check if content contains Markdown formatting
 * @param {string} content - Content to check
 * @returns {boolean} True if content appears to be Markdown
 */
export const isMarkdown = (content) => {
  if (!content) return false;
  
  // Check for common Markdown patterns
  const markdownPatterns = [
    /\*\*.*\*\*/, // Bold
    /\*.*\*/, // Italic
    /^#{1,6}\s/, // Headers
    /^\s*[-*+]\s/, // Lists
    /^\s*\d+\.\s/, // Numbered lists
    /`.*`/, // Inline code
    /```[\s\S]*```/, // Code blocks
    /\[.*\]\(.*\)/, // Links
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};

export default { markdownToHtml, isMarkdown }; 