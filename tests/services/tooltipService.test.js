import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom'
import tooltipService from '../../js/services/tooltipService'

describe('TooltipService', () => {
  let originalBody

  beforeEach(() => {
    // Save original body
    originalBody = document.body.innerHTML
    // Clear DOM
    document.body.innerHTML = ''
    // Reset any tooltip state
    tooltipService.hideTooltip()
  })

  afterEach(() => {
    // Restore original body
    document.body.innerHTML = originalBody
  })

  test('should initialize tooltip element if not exists', () => {
    tooltipService._initTooltipElement()
    const tooltip = document.getElementById('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip.className).toBe('tooltip hidden')
  })

  test('should show tooltip with correct content', () => {
    // Setup
    const button = document.createElement('button')
    button.dataset.tooltip = 'Test tooltip'
    document.body.appendChild(button)

    // Action
    tooltipService.showTooltip(button)

    // Assert
    const tooltip = document.getElementById('tooltip')
    expect(tooltip).not.toHaveClass('hidden')
    expect(tooltip.innerHTML).toBe('Test tooltip')
  })

  test('should hide tooltip', () => {
    // Setup
    const button = document.createElement('button')
    button.dataset.tooltip = 'Test tooltip'
    document.body.appendChild(button)
    tooltipService.showTooltip(button)

    // Action
    tooltipService.hideTooltip()

    // Assert
    const tooltip = document.getElementById('tooltip')
    expect(tooltip).toHaveClass('hidden')
    expect(tooltipService.activeElement).toBeNull()
  })

  test('should add tooltip listeners to elements with data-tooltip', () => {
    // Setup
    const button = document.createElement('button')
    button.dataset.tooltip = 'Test tooltip'
    document.body.appendChild(button)

    // Action
    tooltipService._addTooltipListeners()

    // Assert
    expect(button.dataset.tooltipInit).toBe('true')
  })

  test('should position tooltip correctly for element', () => {
    // Setup
    const button = document.createElement('button')
    button.dataset.tooltip = 'Test tooltip'
    Object.defineProperty(button, 'getBoundingClientRect', {
      value: () => ({
        top: 100,
        left: 100,
        bottom: 120,
        right: 200,
        width: 100,
        height: 20
      })
    })
    document.body.appendChild(button)

    // Action
    tooltipService.showTooltip(button)

    // Assert
    const tooltip = document.getElementById('tooltip')
    expect(tooltip.style.transform).toBe('translateX(-50%)')
  })
})
