import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmojiPicker } from '../EmojiPicker'

// Mock de emoji-mart
jest.mock('@emoji-mart/react', () => ({
  Picker: ({ onEmojiSelect, onClickOutside }: any) => (
    <div data-testid="emoji-mart-picker">
      <button onClick={() => onEmojiSelect({ native: '👍' })}>Select Emoji</button>
      <button onClick={onClickOutside}>Click Outside</button>
    </div>
  )
}))

describe('EmojiPicker', () => {
  const mockHandlers = {
    onSelect: jest.fn(),
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders emoji picker', () => {
    render(<EmojiPicker {...mockHandlers} />)
    expect(screen.getByTestId('emoji-mart-picker')).toBeInTheDocument()
  })

  it('calls onSelect when an emoji is selected', async () => {
    const user = userEvent.setup()
    render(<EmojiPicker {...mockHandlers} />)

    await user.click(screen.getByText('Select Emoji'))
    expect(mockHandlers.onSelect).toHaveBeenCalledWith({ native: '👍' })
  })

  it('calls onClose when clicking outside', async () => {
    const user = userEvent.setup()
    render(<EmojiPicker {...mockHandlers} />)

    await user.click(screen.getByText('Click Outside'))
    expect(mockHandlers.onClose).toHaveBeenCalled()
  })

  it('positions picker relative to trigger element', () => {
    const triggerRect = {
      top: 100,
      left: 200,
      width: 40,
      height: 40
    }

    const mockGetBoundingClientRect = jest.fn(() => triggerRect)
    const triggerElement = document.createElement('button')
    triggerElement.getBoundingClientRect = mockGetBoundingClientRect

    render(<EmojiPicker {...mockHandlers} triggerRef={{ current: triggerElement }} />)

    const picker = screen.getByTestId('emoji-mart-picker')
    expect(picker).toHaveStyle({
      position: 'absolute',
      top: expect.any(String),
      left: expect.any(String)
    })
  })

  it('handles null trigger reference gracefully', () => {
    render(<EmojiPicker {...mockHandlers} triggerRef={{ current: null }} />)
    expect(screen.getByTestId('emoji-mart-picker')).toBeInTheDocument()
  })

  it('applies custom theme', () => {
    render(<EmojiPicker {...mockHandlers} theme="dark" />)
    const picker = screen.getByTestId('emoji-mart-picker')
    expect(picker).toHaveAttribute('data-theme', 'dark')
  })

  it('handles window resize events', async () => {
    const user = userEvent.setup()
    const triggerElement = document.createElement('button')
    render(<EmojiPicker {...mockHandlers} triggerRef={{ current: triggerElement }} />)

    // Simular evento de resize
    global.innerWidth = 500
    global.innerHeight = 500
    fireEvent(window, new Event('resize'))

    const picker = screen.getByTestId('emoji-mart-picker')
    expect(picker).toHaveStyle({
      position: 'absolute'
    })
  })
}) 