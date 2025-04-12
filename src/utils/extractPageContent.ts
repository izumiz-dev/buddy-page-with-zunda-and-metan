/**
 * Extracts the main text content from the current webpage
 * @returns Text content of the webpage
 */
export const extractPageContent = (): string => {
  // Get title
  const title = document.title;
  
  // Get meta description
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const description = descriptionMeta 
    ? (descriptionMeta as HTMLMetaElement).content 
    : '';
  
  // Get the main content
  // Priority elements to check for main content
  const mainElements = [
    document.querySelector('main'),
    document.querySelector('article'),
    document.querySelector('#content'),
    document.querySelector('.content'),
    document.querySelector('.post'),
    document.querySelector('.article')
  ].filter(Boolean);
  
  let mainContent = '';
  
  if (mainElements.length > 0) {
    // Use the first available main element
    mainContent = mainElements[0]!.textContent || '';
  } else {
    // Fallback: extract content from body, removing script, style, etc.
    const bodyClone = document.body.cloneNode(true) as HTMLBodyElement;
    
    // Remove script, style, nav, header, footer elements
    const elementsToRemove = [
      'script', 'style', 'nav', 'header', 'footer', 
      'iframe', 'noscript', '.sidebar', '.menu', '.ad'
    ];
    
    elementsToRemove.forEach(selector => {
      bodyClone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    mainContent = bodyClone.textContent || '';
  }
  
  // Clean up the text
  mainContent = mainContent.replace(/\\s+/g, ' ').trim();
  
  // Combine all content
  const content = `
Title: ${title}
Description: ${description}
Content: ${mainContent}
  `;
  
  return content; // Re-added the return statement
};
// Removed makeResizable, createConversationUI, makeDraggable, addConversationLine
