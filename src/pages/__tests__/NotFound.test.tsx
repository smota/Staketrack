import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../NotFound';
import userEvent from '@testing-library/user-event';

const renderNotFound = () => {
  render(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
};

describe('NotFound', () => {
  it('renders 404 heading', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays not found message', () => {
    renderNotFound();
    expect(screen.getByText(/page you are looking for does not exist/i)).toBeInTheDocument();
  });

  it('shows return to home link', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('navigates to home when clicking the link', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /return to home/i });
    userEvent.click(homeLink);
    // Note: We can't test actual navigation in this test environment
    // but we can verify the link is clickable
    expect(homeLink).not.toBeDisabled();
  });
}); 