import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractionLog from '@components/interactionLog';

// Mock data for testing
const mockInteractions = [
  { id: 1, date: '2023-01-01', type: 'Meeting', notes: 'Discussed project scope', stakeholderId: 1 },
  { id: 2, date: '2023-01-15', type: 'Email', notes: 'Sent progress update', stakeholderId: 1 }
];

// Mock functions
const mockAddInteraction = jest.fn();
const mockDeleteInteraction = jest.fn();

describe('InteractionLog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<InteractionLog
      interactions={mockInteractions}
      onAddInteraction={mockAddInteraction}
      onDeleteInteraction={mockDeleteInteraction}
    />);

    expect(screen.getByText(/interaction log/i)).toBeInTheDocument();
  });

  test('displays interaction items correctly', () => {
    render(<InteractionLog
      interactions={mockInteractions}
      onAddInteraction={mockAddInteraction}
      onDeleteInteraction={mockDeleteInteraction}
    />);

    expect(screen.getByText('Meeting')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Discussed project scope')).toBeInTheDocument();
  });

  test('adds new interaction when form is submitted', () => {
    render(<InteractionLog
      interactions={mockInteractions}
      onAddInteraction={mockAddInteraction}
      onDeleteInteraction={mockDeleteInteraction}
    />);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2023-02-01' } });
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'Phone Call' } });
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Discussed timeline changes' } });

    // Submit form
    fireEvent.click(screen.getByText(/add interaction/i));

    expect(mockAddInteraction).toHaveBeenCalledWith(expect.objectContaining({
      date: '2023-02-01',
      type: 'Phone Call',
      notes: 'Discussed timeline changes'
    }));
  });

  test('calls delete function when delete button is clicked', () => {
    render(<InteractionLog
      interactions={mockInteractions}
      onAddInteraction={mockAddInteraction}
      onDeleteInteraction={mockDeleteInteraction}
    />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockDeleteInteraction).toHaveBeenCalledWith(mockInteractions[0].id);
  });
}); 