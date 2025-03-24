import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { auth } from '../../lib/firebase';

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
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderDashboard = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays active stakes count', async () => {
    renderDashboard();
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('displays total value', async () => {
    renderDashboard();
    expect(await screen.findByText('$1000.00')).toBeInTheDocument();
  });

  it('displays average APY', async () => {
    renderDashboard();
    expect(await screen.findByText('5.50%')).toBeInTheDocument();
  });

  it('displays platform name in stake card', async () => {
    renderDashboard();
    expect(await screen.findByText('Test Platform')).toBeInTheDocument();
  });
}); 