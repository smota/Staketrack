import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Stakes from '../Stakes';
import { auth } from '../../lib/firebase';
import userEvent from '@testing-library/user-event';

// Mock Firebase auth
jest.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
    },
  },
  db: {
    collection: jest.fn(),
  },
}));

// Mock Firestore query
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: 'stake-1',
          data: () => ({
            userId: 'test-user-id',
            amount: 1000,
            currency: 'USD',
            platform: 'Test Platform',
            apy: 5.5,
            startDate: { toDate: () => new Date('2024-01-01') },
            endDate: { toDate: () => new Date('2024-12-31') },
            status: 'active',
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
      ],
    })
  ),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-stake-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderStakes = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Stakes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Stakes', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders stakes title', () => {
    renderStakes();
    expect(screen.getByText('Stakes')).toBeInTheDocument();
  });

  it('displays add stake button', () => {
    renderStakes();
    expect(screen.getByText('Add Stake')).toBeInTheDocument();
  });

  it('displays stake details', async () => {
    renderStakes();
    expect(await screen.findByText('Test Platform')).toBeInTheDocument();
    expect(await screen.findByText('$1000.00')).toBeInTheDocument();
    expect(await screen.findByText('5.5% APY')).toBeInTheDocument();
  });

  it('opens add stake modal when clicking add button', async () => {
    renderStakes();
    const addButton = screen.getByText('Add Stake');
    userEvent.click(addButton);
    expect(await screen.findByText('Add Stake')).toBeInTheDocument();
    expect(screen.getByLabelText('Platform')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('APY (%)')).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderStakes();
    const addButton = screen.getByText('Add Stake');
    userEvent.click(addButton);

    const submitButton = screen.getByText('Create');
    userEvent.click(submitButton);

    expect(await screen.findByText('Platform is required')).toBeInTheDocument();
    expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
  });

  it('allows editing a stake', async () => {
    renderStakes();
    const editButton = await screen.findByText('Edit');
    userEvent.click(editButton);

    const platformInput = screen.getByLabelText('Platform');
    userEvent.clear(platformInput);
    userEvent.type(platformInput, 'Updated Platform');

    const updateButton = screen.getByText('Update');
    userEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.queryByText('Edit Stake')).not.toBeInTheDocument();
    });
  });

  it('allows deleting a stake', async () => {
    renderStakes();
    const deleteButton = await screen.findByText('Delete');
    userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Platform')).not.toBeInTheDocument();
    });
  });
}); 