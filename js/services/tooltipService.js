/**
 * Tooltip Service - Manages tooltips and help text
 */
class TooltipService {
  constructor() {
    this.tooltipElement = null;
    this.activeElement = null;
    this.tooltipTimeout = null;
    this.tooltipDelay = 300; // ms
    this.observer = null; // Store observer reference for cleanup

    this._initTooltipElement();
  }

  /**
   * Initialize the tooltip element
   * @private
   */
  _initTooltipElement() {
    try {
      this.tooltipElement = document.getElementById('tooltip');
      if (!this.tooltipElement) {
        // Create tooltip element if not found
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = 'tooltip';
        this.tooltipElement.className = 'tooltip hidden';
        document.body.appendChild(this.tooltipElement);
      } else {
        // Ensure the tooltip has the correct classes
        this.tooltipElement.classList.add('tooltip');
        this.tooltipElement.classList.add('hidden');
        this.tooltipElement.classList.remove('visible');
      }
    } catch (error) {
      console.error('Failed to initialize tooltip element:', error);
    }
  }

  /**
   * Initialize tooltips
   */
  init() {
    // Ensure tooltip element is initialized
    this._initTooltipElement();

    // Find all elements with data-tooltip attribute
    this._addTooltipListeners();

    // Add scroll and resize listeners
    window.addEventListener('scroll', () => {
      if (this.activeElement) {
        this._positionTooltip(this.activeElement);
      }
    }, true);

    window.addEventListener('resize', () => {
      if (this.activeElement) {
        this._positionTooltip(this.activeElement);
      }
    });

    // Listen for DOM changes to add tooltips to new elements
    this._observeDOMChanges();

    // Log initialization
    console.log('Tooltip service initialized');
  }

  /**
   * Add tooltip event listeners to all elements with data-tooltip attribute
   * @private
   */
  _addTooltipListeners() {
    try {
      document.querySelectorAll('[data-tooltip]').forEach(element => {
        this._addTooltipListenersToElement(element);
      });
    } catch (error) {
      console.error('Error adding tooltip listeners:', error);
    }
  }

  /**
   * Add tooltip event listeners to a specific element
   * @param {HTMLElement} element - Element to add listeners to
   * @private
   */
  _addTooltipListenersToElement(element) {
    // Skip if already has listeners
    if (element.dataset.tooltipInit) return;

    // Don't replace form elements, as this can reset their values and event handlers
    // Instead, just add the listeners directly
    element.addEventListener('mouseenter', () => {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = setTimeout(() => {
        this.showTooltip(element, element.dataset.tooltip);
      }, this.tooltipDelay);
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(this.tooltipTimeout);
      this.hideTooltip();
    });

    element.addEventListener('focus', () => {
      this.showTooltip(element, element.dataset.tooltip);
    });

    element.addEventListener('blur', () => {
      this.hideTooltip();
    });

    // Mark as initialized
    element.dataset.tooltipInit = 'true';
  }

  /**
   * Observe DOM changes to add tooltips to new elements
   * @private
   */
  _observeDOMChanges() {
    try {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                // Check the added element
                if (node.dataset && node.dataset.tooltip) {
                  this._addTooltipListenersToElement(node);
                }

                // Check children of the added element
                node.querySelectorAll('[data-tooltip]').forEach(element => {
                  this._addTooltipListenersToElement(element);
                });
              }
            });
          }
        });
      });

      // Observe the entire document
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      console.error('Error setting up DOM observer for tooltips:', error);
    }
  }

  /**
   * Show tooltip for an element
   * @param {HTMLElement|Event} elementOrEvent - Element to show tooltip for or event
   * @param {string} [content] - Tooltip content (optional if using data-tooltip)
   */
  showTooltip(elementOrEvent, content = null) {
    try {
      let element;

      // If passed an event, get the target element
      if (elementOrEvent instanceof Event) {
        element = elementOrEvent.currentTarget || elementOrEvent.target;

        // Position at event coordinates
        const x = elementOrEvent.clientX;
        const y = elementOrEvent.clientY;

        this.tooltipElement.style.left = `${x + 15}px`;
        this.tooltipElement.style.top = `${y + 15}px`;
      } else {
        element = elementOrEvent;
        this._positionTooltip(element);
      }

      // Use content param or element's data-tooltip attribute
      const tooltipContent = content || (element && element.dataset.tooltip) || '';

      if (!tooltipContent) return;

      this.tooltipElement.innerHTML = tooltipContent;
      this.tooltipElement.classList.remove('hidden');
      this.tooltipElement.classList.add('visible');
      this.activeElement = element;

      // Ensure tooltip is within viewport
      this._adjustTooltipPosition();

      // Force a repaint to ensure tooltip is visible
      this.tooltipElement.style.opacity = '0';
      setTimeout(() => {
        this.tooltipElement.style.opacity = '1';
      }, 10);
    } catch (error) {
      console.error('Error showing tooltip:', error);
    }
  }

  /**
   * Hide the tooltip
   */
  hideTooltip() {
    this.tooltipElement.classList.add('hidden');
    this.tooltipElement.classList.remove('visible');
    this.activeElement = null;
  }

  /**
   * Position tooltip relative to an element
   * @param {HTMLElement} element - Element to position tooltip for
   * @private
   */
  _positionTooltip(element) {
    const rect = element.getBoundingClientRect();
    const tooltipHeight = this.tooltipElement.offsetHeight;

    // Position tooltip above the element by default
    let top = rect.top - tooltipHeight - 10;

    // If not enough space above, position below
    if (top < 10) {
      top = rect.bottom + 10;
    }

    // Center horizontally
    const left = rect.left + (rect.width / 2);

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.transform = 'translateX(-50%)';
  }

  /**
   * Adjust tooltip position to ensure it's visible within the viewport
   * @private
   */
  _adjustTooltipPosition() {
    const rect = this.tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontally if needed
    if (rect.right > viewportWidth - 10) {
      this.tooltipElement.style.left = `${viewportWidth - rect.width - 10}px`;
      this.tooltipElement.style.transform = 'none';
    } else if (rect.left < 10) {
      this.tooltipElement.style.left = '10px';
      this.tooltipElement.style.transform = 'none';
    }

    // Adjust vertically if needed
    if (rect.bottom > viewportHeight - 10) {
      this.tooltipElement.style.top = `${viewportHeight - rect.height - 10}px`;
    } else if (rect.top < 10) {
      this.tooltipElement.style.top = '10px';
    }
  }

  /**
   * Clean up resources used by the tooltip service
   * Useful for testing and when the service is no longer needed
   */
  cleanup() {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear timeout
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }

    // Remove tooltip element
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }

    this.activeElement = null;
  }
}

// Create singleton instance
const tooltipService = new TooltipService();

// Export singleton by default
export default tooltipService;

// Also export the class for testing purposes
export { TooltipService };
