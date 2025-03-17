/**
 * DOM Utilities - Helper functions for working with the DOM
 */
class DomUtils {
  /**
   * Create an element with attributes and properties
   * @param {string} tagName - Tag name for the element
   * @param {Object} [attributes={}] - Attributes to set on the element
   * @param {Object} [properties={}] - Properties to set on the element
   * @param {string|Node|Array<Node>} [children] - Child content to append
   * @returns {HTMLElement} - The created element
   */
  createElement(tagName, attributes = {}, properties = {}, children) {
    const element = document.createElement(tagName);
    
    // Set attributes
    Object.entries(attributes).forEach(([attr, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(attr, value);
      }
    });
    
    // Set properties
    Object.entries(properties).forEach(([prop, value]) => {
      if (value !== null && value !== undefined) {
        element[prop] = value;
      }
    });
    
    // Append children
    if (children !== undefined) {
      this.appendChildren(element, children);
    }
    
    return element;
  }
  
  /**
   * Append children to an element
   * @param {HTMLElement} element - Parent element
   * @param {string|Node|Array<Node>} children - Children to append
   */
  appendChildren(element, children) {
    if (typeof children === 'string') {
      element.textContent = children;
    } else if (children instanceof Node) {
      element.appendChild(children);
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (child) {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            element.appendChild(child);
          }
        }
      });
    }
  }
  
  /**
   * Remove all children from an element
   * @param {HTMLElement} element - Element to clear
   */
  clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  
  /**
   * Add event listener to multiple elements
   * @param {NodeList|Array<HTMLElement>} elements - Elements to add listener to
   * @param {string} eventType - Event type (e.g., 'click')
   * @param {Function} listener - Event listener function
   * @param {Object} [options] - Event listener options
   */
  addEventListenerToAll(elements, eventType, listener, options) {
    Array.from(elements).forEach(element => {
      element.addEventListener(eventType, listener, options);
    });
  }
  
  /**
   * Create a document fragment from HTML string
   * @param {string} html - HTML string
   * @returns {DocumentFragment} - Document fragment
   */
  createFragmentFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content;
  }
  
  /**
   * Check if an element is visible in the viewport
   * @param {HTMLElement} element - Element to check
   * @param {number} [partialVisibility=false] - Whether partial visibility is sufficient
   * @returns {boolean} - Whether the element is visible
   */
  isElementInViewport(element, partialVisibility = false) {
    const rect = element.getBoundingClientRect();
    
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    if (partialVisibility) {
      // Element is partially visible
      const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
      const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
      return vertInView && horInView;
    } else {
      // Element is fully visible
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth
      );
    }
  }
  
  /**
   * Add or remove a class from an element based on condition
   * @param {HTMLElement} element - Element to modify
   * @param {string} className - Class name to toggle
   * @param {boolean} condition - Whether to add or remove the class
   */
  toggleClass(element, className, condition) {
    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }
  
  /**
   * Show an element
   * @param {HTMLElement} element - Element to show
   * @param {string} [displayType='block'] - Display type to use
   */
  showElement(element, displayType = 'block') {
    element.style.display = displayType;
  }
  
  /**
   * Hide an element
   * @param {HTMLElement} element - Element to hide
   */
  hideElement(element) {
    element.style.display = 'none';
  }
  
  /**
   * Toggle an element's visibility
   * @param {HTMLElement} element - Element to toggle
   * @param {string} [displayType='block'] - Display type to use when showing
   */
  toggleElement(element, displayType = 'block') {
    if (element.style.display === 'none') {
      this.showElement(element, displayType);
    } else {
      this.hideElement(element);
    }
  }
  
  /**
   * Fade in an element
   * @param {HTMLElement} element - Element to fade in
   * @param {number} [duration=300] - Animation duration in milliseconds
   * @returns {Promise} - Promise that resolves when animation is complete
   */
  fadeIn(element, duration = 300) {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.display = '';
      
      let start = null;
      
      const animate = timestamp => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.min(progress / duration, 1);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
          window.requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      window.requestAnimationFrame(animate);
    });
  }
  
  /**
   * Fade out an element
   * @param {HTMLElement} element - Element to fade out
   * @param {number} [duration=300] - Animation duration in milliseconds
   * @returns {Promise} - Promise that resolves when animation is complete
   */
  fadeOut(element, duration = 300) {
    return new Promise(resolve => {
      let start = null;
      const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);
      
      const animate = timestamp => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.max(initialOpacity - (progress / duration), 0);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
          window.requestAnimationFrame(animate);
        } else {
          element.style.display = 'none';
          resolve();
        }
      };
      
      window.requestAnimationFrame(animate);
    });
  }
}

// Singleton instance
export const domUtils = new DomUtils();
