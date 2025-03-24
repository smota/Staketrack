import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Platforms from '../Platforms';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [
      {
        id: 'platform-1',
        data: () => ({
          name: 'Test Platform',
          description: 'A test staking platform',
          website: 'https://test-platform.com',
          minStake: 100,
          maxStake: 10000,
          apy: {
            min: 5,
            max: 15
          },
          supportedCurrencies: ['BTC', 'ETH'],
          logo: 'https://test-platform.com/logo.png'
        })
      }
    ]
  }))
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderPlatforms = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Platforms />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Platforms', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders platforms title', () => {
    renderPlatforms();
    expect(screen.getByText('Staking Platforms')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderPlatforms();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays platform information after loading', async () => {
    renderPlatforms();

    await waitFor(() => {
      expect(screen.getByText('Test Platform')).toBeInTheDocument();
      expect(screen.getByText('A test staking platform')).toBeInTheDocument();
      expect(screen.getByText('5% - 15% APY')).toBeInTheDocument();
    });
  });

  it('displays supported currencies', async () => {
    renderPlatforms();

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });
  });

  it('displays stake range', async () => {
    renderPlatforms();

    await waitFor(() => {
      expect(screen.getByText(/min: \$100/i)).toBeInTheDocument();
      expect(screen.getByText(/max: \$10,000/i)).toBeInTheDocument();
    });
  });

  it('includes visit website link', async () => {
    renderPlatforms();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /visit website/i });
      expect(link).toHaveAttribute('href', 'https://test-platform.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('displays platform logo', async () => {
    renderPlatforms();

    await waitFor(() => {
      const logo = screen.getByAltText('Test Platform logo');
      expect(logo).toHaveAttribute('src', 'https://test-platform.com/logo.png');
    });
  });

  it('handles empty platforms list', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('firebase/firestore'), 'getDocs').mockImplementationOnce(() =>
      Promise.resolve({ docs: [] })
    );

    renderPlatforms();

    await waitFor(() => {
      expect(screen.getByText(/no platforms available/i)).toBeInTheDocument();
    });
  });
}); 