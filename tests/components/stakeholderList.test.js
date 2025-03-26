import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import StakeholderList from '../stakeholderList'

// Mock data
const mockStakeholders = [
  { id: 1, name: 'John Doe', organization: 'Acme Corp', influence: 8, interest: 7 },
  { id: 2, name: 'Jane Smith', organization: 'XYZ Inc', influence: 5, interest: 9 }
]

// Mock functions
const mockSelectStakeholder = jest.fn()
const mockDeleteStakeholder = jest.fn()
const mockFilterStakeholders = jest.fn()
const mockSortStakeholders = jest.fn()

describe('StakeholderList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    render(
      <StakeholderList
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
        onDeleteStakeholder={mockDeleteStakeholder}
        onFilterStakeholders={mockFilterStakeholders}
        onSortStakeholders={mockSortStakeholders}
      />
    )

    expect(screen.getByText(/stakeholders/i)).toBeInTheDocument()
  })

  test('displays stakeholder items correctly', () => {
    render(
      <StakeholderList
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
        onDeleteStakeholder={mockDeleteStakeholder}
        onFilterStakeholders={mockFilterStakeholders}
        onSortStakeholders={mockSortStakeholders}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('XYZ Inc')).toBeInTheDocument()
  })

  test('calls onSelectStakeholder when a stakeholder is clicked', () => {
    render(
      <StakeholderList
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
        onDeleteStakeholder={mockDeleteStakeholder}
        onFilterStakeholders={mockFilterStakeholders}
        onSortStakeholders={mockSortStakeholders}
      />
    )

    fireEvent.click(screen.getByText('John Doe'))
    expect(mockSelectStakeholder).toHaveBeenCalledWith(mockStakeholders[0])
  })

  test('filters stakeholders when search input changes', () => {
    render(
      <StakeholderList
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
        onDeleteStakeholder={mockDeleteStakeholder}
        onFilterStakeholders={mockFilterStakeholders}
        onSortStakeholders={mockSortStakeholders}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })

    expect(mockFilterStakeholders).toHaveBeenCalledWith('John')
  })

  test('sorts stakeholders when sort option is changed', () => {
    render(
      <StakeholderList
        stakeholders={mockStakeholders}
        onSelectStakeholder={mockSelectStakeholder}
        onDeleteStakeholder={mockDeleteStakeholder}
        onFilterStakeholders={mockFilterStakeholders}
        onSortStakeholders={mockSortStakeholders}
      />
    )

    const sortSelect = screen.getByLabelText(/sort by/i)
    fireEvent.change(sortSelect, { target: { value: 'influence' } })

    expect(mockSortStakeholders).toHaveBeenCalledWith('influence')
  })
})
