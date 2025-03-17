import stakeholderController from '../js/controllers/stakeholderController.js';
import stakeholderModel from '../js/models/stakeholderModel.js';
import mapModel from '../js/models/mapModel.js';

jest.mock('../js/models/stakeholderModel.js', () => ({
  addStakeholder: jest.fn(),
  updateStakeholder: jest.fn(),
  deleteStakeholder: jest.fn(),
  getStakeholders: jest.fn()
}));

jest.mock('../js/models/mapModel.js', () => ({
  getCurrentMap: jest.fn()
}));

describe('Stakeholder Management Integration', () => {
  const mockMap = { id: 'map123', name: 'Test Map' };
  const mockStakeholder = {
    id: 'stake123',
    name: 'John Doe',
    influence: 8,
    impact: 7,
    relationship: 6,
    category: 'executive'
  };
  
  beforeEach(() => {
    // Setup DOM elements for stakeholder testing
    document.body.innerHTML = `
      <button id="add-stakeholder-btn"></button>
      <div id="stakeholders-list"></div>
      <div id="matrix-plots"></div>
      <div id="modal-container" class="modal-container hidden">
        <div id="modal">
          <div id="modal-content"></div>
        </div>
      </div>
      <template id="stakeholder-form-template">
        <form id="stakeholder-form">
          <input id="stakeholder-name">
          <input id="stakeholder-influence">
          <input id="stakeholder-impact">
          <input id="stakeholder-relationship">
          <select id="stakeholder-category"></select>
          <button type="submit"></button>
        </form>
      </template>
    `;
    
    // Initialize the controller
    mapModel.getCurrentMap.mockReturnValue(mockMap);
    stakeholderModel.getStakeholders.mockReturnValue([mockStakeholder]);
    stakeholderController.init();
  });
  
  test('should open stakeholder form when add button is clicked', () => {
    const addBtn = document.getElementById('add-stakeholder-btn');
    
    // Trigger add stakeholder
    addBtn.click();
    
    // Check if modal is displayed with the form
    const modalContainer = document.getElementById('modal-container');
    expect(modalContainer.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('stakeholder-form')).not.toBeNull();
  });
  
  test('should add a new stakeholder', async () => {
    // Setup
    stakeholderModel.addStakeholder.mockResolvedValue({ ...mockStakeholder, id: 'new123' });
    
    // Open the form
    document.getElementById('add-stakeholder-btn').click();
    
    // Fill the form
    document.getElementById('stakeholder-name').value = 'Jane Smith';
    document.getElementById('stakeholder-influence').value = '9';
    document.getElementById('stakeholder-impact').value = '8';
    document.getElementById('stakeholder-relationship').value = '7';
    
    // Submit the form
    const form = document.getElementById('stakeholder-form');
    form.dispatchEvent(new Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assertions
    expect(stakeholderModel.addStakeholder).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Jane Smith',
      influence: 9,
      impact: 8,
      relationship: 7
    }));
  });
}); 