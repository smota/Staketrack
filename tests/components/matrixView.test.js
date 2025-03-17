import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatrixView from '../matrixView';

// Mock data
const mockStakeholders = [
  { id: 1, name: 'John Doe', organization: 'Acme Corp', influence: 8, interest: 7 },
  { id: 2, name: 'Jane Smith', organization: 'XYZ Inc', influence: 3, interest: 9 },
  { id: 3, name: 'Bob Johnson', organization: 'ABC Ltd', influence: 9, interest: 2 },
  { id: 4, name: 'Alice Brown', organization: '123 Co', influence: 2, interest: 3 }
];

// Mock functions
const mockSelectStakeholder = jest.fn();

describe('MatrixView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the matrix correctly', () => {
    render(
      <MatrixView 
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
      />
    );
    
    expect(screen.getByText(/stakeholder matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/interest/i)).toBeInTheDocument();
    expect(screen.getByText(/influence/i)).toBeInTheDocument();
  });

  test('displays stakeholders in the correct quadrants', () => {
    render(
      <MatrixView 
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
      />
    );
    
    // Check if stakeholders are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    
    // We can't easily test exact positioning in the matrix, but we can check
    // if each stakeholder is contained within the matrix
    const matrixContainer = screen.getByTestId('matrix-container');
    
    expect(matrixContainer).toContainElement(screen.getByText('John Doe'));
    expect(matrixContainer).toContainElement(screen.getByText('Jane Smith'));
    expect(matrixContainer).toContainElement(screen.getByText('Bob Johnson'));
    expect(matrixContainer).toContainElement(screen.getByText('Alice Brown'));
  });

  test('calls selectStakeholder when a stakeholder dot is clicked', () => {
    render(
      <MatrixView 
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
      />
    );
    
    // Find and click on a stakeholder dot
    fireEvent.click(screen.getByText('John Doe'));
    
    expect(mockSelectStakeholder).toHaveBeenCalledWith(mockStakeholders[0]);
  });

  test('displays quadrant labels correctly', () => {
    render(
      <MatrixView 
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
      />
    );
    
    // Check for quadrant labels
    expect(screen.getByText(/keep satisfied/i)).toBeInTheDocument();
    expect(screen.getByText(/manage closely/i)).toBeInTheDocument();
    expect(screen.getByText(/monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/keep informed/i)).toBeInTheDocument();
  });

  test('renders legend correctly', () => {
    render(
      <MatrixView 
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
      />
    );
    
    expect(screen.getByText(/legend/i)).toBeInTheDocument();
    expect(screen.getByText(/low interest, low influence/i)).toBeInTheDocument();
    expect(screen.getByText(/high interest, high influence/i)).toBeInTheDocument();
  });
}); 