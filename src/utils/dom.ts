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
  
  return content;
};

/**
 * Makes an element resizable
 * @param element Element to make resizable
 * @param handle Handle element to use for resizing
 */
const makeResizable = (element: HTMLElement, handle: HTMLElement) => {
  // Initial sizes
  const minWidth = 320;
  const minHeight = 400;
  let startX: number, startY: number, startWidth: number, startHeight: number;
  let startLeft: number, startTop: number;
  
  handle.addEventListener('mousedown', initResize, false);
  
  function initResize(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    // Remember current dimensions
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView!.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView!.getComputedStyle(element).height, 10);
    startLeft = element.getBoundingClientRect().left;
    startTop = element.getBoundingClientRect().top;
    
    // Add listeners
    document.documentElement.addEventListener('mousemove', doResize, false);
    document.documentElement.addEventListener('mouseup', stopResize, false);
  }
  
  function doResize(e: MouseEvent) {
    e.preventDefault();
    
    // Calculate change in mouse position
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    
    // Calculate new size (grows from left/top instead of right/bottom)
    const newWidth = Math.max(minWidth, startWidth + dx);
    const newHeight = Math.max(minHeight, startHeight + dy);
    
    // Calculate new position to maintain the right/bottom edges
    const newLeft = startLeft - (newWidth - startWidth);
    const newTop = startTop - (newHeight - startHeight);
    
    // Update size and position
    element.style.width = newWidth + 'px';
    element.style.height = newHeight + 'px';
    element.style.left = newLeft + 'px';
    element.style.top = newTop + 'px';
  }
  
  function stopResize() {
    // Remove listeners
    document.documentElement.removeEventListener('mousemove', doResize, false);
    document.documentElement.removeEventListener('mouseup', stopResize, false);
  }
};

/**
 * Creates and injects the conversation UI into the webpage
 * @returns The created UI elements
 */
export const createConversationUI = () => {
  // Check for existing UI and remove it if found
  const existingUI = document.getElementById('zunda-metan-conversation');
  if (existingUI) {
    existingUI.remove();
  }
  
  // Create container
  const container = document.createElement('div');
  container.id = 'zunda-metan-conversation';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    height: 500px;
    min-width: 320px;
    min-height: 400px;
    background-color: white;
    border-radius: 15px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: "Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Meiryo", sans-serif;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 10px;
    background: linear-gradient(to right, #4caf50, #F5A9E1);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
  `;
  
  const title = document.createElement('div');
  title.textContent = 'ずんだもん & 四国めたん';
  title.style.fontWeight = 'bold';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => {
    container.style.display = 'none';
  };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create conversation area
  const conversationArea = document.createElement('div');
  conversationArea.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: #f9f9f9;
  `;
  
  // Create controls
  const controls = document.createElement('div');
  controls.style.cssText = `
    padding: 12px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: #fafafa;
  `;
  
  const audioBtn = document.createElement('button');
  audioBtn.textContent = '🔊 再生';
  audioBtn.disabled = true; // 初期状態では無効化
  audioBtn.style.cssText = `
    flex: 1;
    max-width: 45%;
    background: linear-gradient(to right, #4caf50, #66bb6a);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 15px;
    margin: 0 5px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    opacity: 0.7; /* 無効状態では薄く表示 */
    transition: opacity 0.3s ease;
  `;
  
  // ボタンの有効化/無効化状態に応じて見た目を変更する
  const updateButtonStyle = () => {
    audioBtn.style.opacity = audioBtn.disabled ? '0.7' : '1';
    audioBtn.style.cursor = audioBtn.disabled ? 'not-allowed' : 'pointer';
  };
  
  // 初期状態を設定
  updateButtonStyle();
  
  // disabled属性の変更を監視
  const originalSetAttribute = audioBtn.setAttribute;
  audioBtn.setAttribute = function(name, value) {
    originalSetAttribute.call(this, name, value);
    if (name === 'disabled') {
      updateButtonStyle();
    }
  };
  
  // disabledプロパティの変更を監視
  Object.defineProperty(audioBtn, 'disabled', {
    set: function(value) {
      this.setAttribute('disabled', value);
      updateButtonStyle();
    },
    get: function() {
      return this.hasAttribute('disabled');
    }
  });
  
  const stopBtn = document.createElement('button');
  stopBtn.textContent = '⏹ 停止';
  stopBtn.style.cssText = `
    flex: 1;
    max-width: 45%;
    background: linear-gradient(to right, #f44336, #ef5350);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 15px;
    margin: 0 5px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  
  controls.appendChild(audioBtn);
  controls.appendChild(stopBtn);
  
  // Assemble the UI
  container.appendChild(header);
  container.appendChild(conversationArea);
  container.appendChild(controls);
  
  // Create resize handle (moved to top-left corner)
  const resizeHandle = document.createElement('div');
  resizeHandle.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(315deg, transparent 50%, #4caf50 50%, #F5A9E1 100%);
    border-radius: 15px 0 0 0;
    z-index: 20;
  `;
  container.appendChild(resizeHandle);
  
  // Add to page
  document.body.appendChild(container);
  
  // Make the dialog draggable
  makeDraggable(container, header);
  
  // Make the dialog resizable
  makeResizable(container, resizeHandle);
  
  return {
    container,
    conversationArea,
    audioBtn,
    stopBtn
  };
};

/**
 * Makes an element draggable by its handle
 * @param element Element to make draggable
 * @param handle Handle element to use for dragging
 */
const makeDraggable = (element: HTMLElement, handle: HTMLElement) => {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e: MouseEvent) {
    // Don't initiate drag when clicking on the close button
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e: MouseEvent) {
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    
    // Make sure the element stays within the viewport
    const rect = element.getBoundingClientRect();
    if (rect.left < 0) element.style.left = "0px";
    if (rect.top < 0) element.style.top = "0px";
    if (rect.right > window.innerWidth) element.style.left = (window.innerWidth - rect.width) + "px";
    if (rect.bottom > window.innerHeight) element.style.top = (window.innerHeight - rect.height) + "px";
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
};

/**
 * Creates and adds a conversation line to the UI
 * @param conversationArea Container element
 * @param character Character speaking
 * @param text Text content
 * @returns Created message element
 */
export const addConversationLine = (
  conversationArea: HTMLElement, 
  character: string, 
  text: string
): HTMLElement => {
  const isZundamon = character === 'zundamon';
  
  const lineElement = document.createElement('div');
  lineElement.className = `message ${isZundamon ? 'zundamon' : 'metan'}`;
  lineElement.style.cssText = `
    max-width: 80%;
    padding: 12px;
    border-radius: 18px;
    position: relative;
    animation: fadeIn 0.3s ease-in-out;
    margin-left: ${isZundamon ? '0' : 'auto'};
    margin-right: ${isZundamon ? 'auto' : '0'};
    background-color: ${isZundamon ? '#A2E884' : '#F5A9E1'};
    color: #333;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  `;
  
  const charNameElement = document.createElement('div');
  charNameElement.className = 'character-name';
  charNameElement.textContent = isZundamon ? 'ずんだもん' : '四国めたん';
  charNameElement.style.cssText = `
    font-weight: bold;
    margin-bottom: 5px;
    color: ${isZundamon ? '#2e7d32' : '#9c27b0'};
  `;
  
  const textElement = document.createElement('div');
  textElement.className = 'message-text';
  textElement.textContent = text;
  
  lineElement.appendChild(charNameElement);
  lineElement.appendChild(textElement);
  
  conversationArea.appendChild(lineElement);
  // Do not auto-scroll anymore
  
  return lineElement;
};