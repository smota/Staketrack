import { StakeholderView } from '../../js/views/stakeholderView';
// You might need to adjust these imports based on your actual implementation
import { mockStakeholders } from '../mocks/stakeholderMocks';
import { fireEvent } from '@testing-library/dom';

describe('StakeholderView', () => {
  let stakeholderView;
  let container;

  beforeEach(() => {
    // Setup DOM element to mount the view
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Initialize the view
    stakeholderView = new StakeholderView(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  test('renders stakeholder list correctly', () => {
    stakeholderView.render(mockStakeholders);
    
    // Check if stakeholders are rendered
    const stakeholderElements = container.querySelectorAll('.stakeholder-item');
    expect(stakeholderElements.length).toBe(mockStakeholders.length);
    
    // Verify content of first stakeholder
    expect(stakeholderElements[0].textContent).toContain(mockStakeholders[0].name);
  });

  test('filters stakeholders by category', () => {
    stakeholderView.render(mockStakeholders);
    
    // Get filter element
    const filterSelect = container.querySelector('.stakeholder-filter');
    
    // Simulate filter change
    fireEvent.change(filterSelect, { target: { value: 'community' } });
    
    // Check filtered results
    const filteredElements = container.querySelectorAll('.stakeholder-item');
    const communityStakeholders = mockStakeholders.filter(s => s.category === 'community');
    expect(filteredElements.length).toBe(communityStakeholders.length);
  });

  test('selects stakeholder when clicked', () => {
    // Mock selection callback
    const onSelectMock = jest.fn();
    stakeholderView.onSelect(onSelectMock);
    
    stakeholderView.render(mockStakeholders);
    
    // Click on a stakeholder
    const firstStakeholder = container.querySelector('.stakeholder-item');
    fireEvent.click(firstStakeholder);
    
    // Verify callback was called with correct stakeholder
    expect(onSelectMock).toHaveBeenCalledWith(mockStakeholders[0]);
  });

  test('handles empty stakeholder list', () => {
    stakeholderView.render([]);
    
    // Check for empty state message
    expect(container.textContent).toContain('No stakeholders found');
  });

  test('allows adding new stakeholder', () => {
    // Mock add callback
    const onAddMock = jest.fn();
    stakeholderView.onAdd(onAddMock);
    
    stakeholderView.render(mockStakeholders);
    
    // Click add button
    const addButton = container.querySelector('.add-stakeholder-btn');
    fireEvent.click(addButton);
    
    // Verify callback was called
    expect(onAddMock).toHaveBeenCalled();
  });
}); 