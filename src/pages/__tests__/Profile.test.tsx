import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../Profile';
import { auth } from '../../lib/firebase';
import userEvent from '@testing-library/user-event';

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      metadata: {
        creationTime: '2024-01-01T00:00:00Z',
      },
    },
  }),
}));

// Mock Firebase auth
jest.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
    },
  },
  db: {
    collection: jest.fn(),
  },
}));

// Mock Firestore operations
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase Auth operations
jest.mock('firebase/auth', () => ({
  updateProfile: jest.fn(() => Promise.resolve()),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderProfile = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Profile', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders profile title', () => {
    renderProfile();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('displays user information', () => {
    renderProfile();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows edit button', () => {
    renderProfile();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('toggles edit mode when clicking edit button', () => {
    renderProfile();
    const editButton = screen.getByText('Edit Profile');
    userEvent.click(editButton);
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('allows updating display name', async () => {
    renderProfile();
    const editButton = screen.getByText('Edit Profile');
    userEvent.click(editButton);

    const displayNameInput = screen.getByLabelText('Display Name');
    userEvent.clear(displayNameInput);
    userEvent.type(displayNameInput, 'Updated Name');

    const saveButton = screen.getByText('Save Changes');
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Display Name')).not.toBeInTheDocument();
    });
  });

  it('validates form inputs', async () => {
    renderProfile();
    const editButton = screen.getByText('Edit Profile');
    userEvent.click(editButton);

    const displayNameInput = screen.getByLabelText('Display Name');
    userEvent.clear(displayNameInput);

    const saveButton = screen.getByText('Save Changes');
    userEvent.click(saveButton);

    expect(await screen.findByText('Display name must be at least 2 characters')).toBeInTheDocument();
  });

  it('allows canceling edit mode', () => {
    renderProfile();
    const editButton = screen.getByText('Edit Profile');
    userEvent.click(editButton);

    const cancelButton = screen.getByText('Cancel');
    userEvent.click(cancelButton);

    expect(screen.queryByLabelText('Display Name')).not.toBeInTheDocument();
  });
}); 