import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import StakeholderCard from '../stakeholderCard'

// Mock data
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
}

// Mock functions
const mockEditStakeholder = jest.fn()
const mockDeleteStakeholder = jest.fn()

describe('StakeholderCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders stakeholder information correctly', () => {
    render(
      <StakeholderCard
        stakeholder={mockStakeholder}
        onEdit={mockEditStakeholder}
        onDelete={mockDeleteStakeholder}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('CEO')).toBeInTheDocument()
    expect(screen.getByText('john@acme.com')).toBeInTheDocument()
    expect(screen.getByText('123-456-7890')).toBeInTheDocument()
    expect(screen.getByText('Key decision maker')).toBeInTheDocument()
  })

  test('displays influence and interest ratings', () => {
    render(
      <StakeholderCard
        stakeholder={mockStakeholder}
        onEdit={mockEditStakeholder}
        onDelete={mockDeleteStakeholder}
      />
    )

    expect(screen.getByText(/influence/i)).toBeInTheDocument()
    expect(screen.getByText(/8\/10/i)).toBeInTheDocument()
    expect(screen.getByText(/interest/i)).toBeInTheDocument()
    expect(screen.getByText(/7\/10/i)).toBeInTheDocument()
  })

  test('calls edit function when edit button is clicked', () => {
    render(
      <StakeholderCard
        stakeholder={mockStakeholder}
        onEdit={mockEditStakeholder}
        onDelete={mockDeleteStakeholder}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(mockEditStakeholder).toHaveBeenCalledWith(mockStakeholder)
  })

  test('calls delete function when delete button is clicked and confirmed', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)

    render(
      <StakeholderCard
        stakeholder={mockStakeholder}
        onEdit={mockEditStakeholder}
        onDelete={mockDeleteStakeholder}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteStakeholder).toHaveBeenCalledWith(mockStakeholder.id)

    // Restore original window.confirm
    window.confirm = originalConfirm
  })

  test('does not call delete function when delete is canceled', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => false)

    render(
      <StakeholderCard
        stakeholder={mockStakeholder}
        onEdit={mockEditStakeholder}
        onDelete={mockDeleteStakeholder}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteStakeholder).not.toHaveBeenCalled()

    // Restore original window.confirm
    window.confirm = originalConfirm
  })
})
