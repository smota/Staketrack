import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StakeholderForm from '../stakeholderForm';

// Mock stakeholder for editing
const mockStakeholder = {
  id: 1,
  name: 'John Doe',
  organization: 'Acme Corp',
  role: 'CEO',
  email: 'john@acme.com',
  phone: '123-456-7890',
  influence: 8,
  interest: 7,
  supportLevel: 4,
  notes: 'Key decision maker'
};

// Mock functions
const mockSaveStakeholder = jest.fn();
const mockCancelEdit = jest.fn();

describe('StakeholderForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form for creating new stakeholder', () => {
    render(
      <StakeholderForm 
        stakeholder={null}
        onSave={mockSaveStakeholder}
        onCancel={mockCancelEdit}
      />
    );
    
    expect(screen.getByText(/add new stakeholder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/organization/i)).toHaveValue('');
  });

  test('renders form with stakeholder data for editing', () => {
    render(
      <StakeholderForm 
        stakeholder={mockStakeholder}
        onSave={mockSaveStakeholder}
        onCancel={mockCancelEdit}
      />
    );
    
    expect(screen.getByText(/edit stakeholder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/organization/i)).toHaveValue('Acme Corp');
    expect(screen.getByLabelText(/role/i)).toHaveValue('CEO');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john@acme.com');
  });

  test('validates required fields', () => {
    render(
      <StakeholderForm 
        stakeholder={null}
        onSave={mockSaveStakeholder}
        onCancel={mockCancelEdit}
      />
    );
    
    // Try to submit without required fields
    fireEvent.click(screen.getByText(/save/i));
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(mockSaveStakeholder).not.toHaveBeenCalled();
  });

  test('submits form with valid data', () => {
    render(
      <StakeholderForm 
        stakeholder={null}
        onSave={mockSaveStakeholder}
        onCancel={mockCancelEdit}
      />
    );
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/organization/i), { target: { value: 'XYZ Inc' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Manager' } });
    fireEvent.change(screen.getByLabelText(/influence/i), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText(/interest/i), { target: { value: '7' } });
    
    // Submit form
    fireEvent.click(screen.getByText(/save/i));
    
    expect(mockSaveStakeholder).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Jane Smith',
      organization: 'XYZ Inc',
      role: 'Manager',
      influence: 6,
      interest: 7
    }));
  });

  test('calls cancel function when cancel button is clicked', () => {
    render(
      <StakeholderForm 
        stakeholder={mockStakeholder}
        onSave={mockSaveStakeholder}
        onCancel={mockCancelEdit}
      />
    );
    
    fireEvent.click(screen.getByText(/cancel/i));
    expect(mockCancelEdit).toHaveBeenCalled();
  });
}); 