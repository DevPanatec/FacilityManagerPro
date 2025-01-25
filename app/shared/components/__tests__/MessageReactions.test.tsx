import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageReactions } from '../MessageReactions'

// Mock del componente EmojiPicker
jest.mock('../EmojiPicker', () => ({
  EmojiPicker: ({ onSelect, onClose }: any) => (
    <div data-testid="emoji-picker">
      <button onClick={() => onSelect({ native: '👍' })}>Select Emoji</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

describe('MessageReactions', () => {
  const mockReactions = [
    { user_id: 'user1', reaction: '👍' },
    { user_id: 'user2', reaction: '👍' },
    { user_id: 'user3', reaction: '❤️' }
  ]

  const mockHandlers = {
    onReact: jest.fn(),
    onRemoveReaction: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders reactions grouped by emoji', () => {
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    expect(screen.getByText('👍 2')).toBeInTheDocument()
    expect(screen.getByText('❤️ 1')).toBeInTheDocument()
  })

  it('highlights reactions made by current user', () => {
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    const thumbsUpReaction = screen.getByText('👍 2').parentElement
    expect(thumbsUpReaction).toHaveClass('bg-blue-100')
  })

  it('shows emoji picker when add reaction button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Add Reaction'))
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
  })

  it('adds new reaction when emoji is selected', async () => {
    const user = userEvent.setup()
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Add Reaction'))
    await user.click(screen.getByText('Select Emoji'))

    expect(mockHandlers.onReact).toHaveBeenCalledWith('msg1', '👍')
  })

  it('removes reaction when clicked by the user who made it', async () => {
    const user = userEvent.setup()
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('👍 2'))
    expect(mockHandlers.onRemoveReaction).toHaveBeenCalledWith('msg1', '👍')
  })

  it('closes emoji picker when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Add Reaction'))
    await user.click(screen.getByText('Close'))

    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
  })

  it('handles empty reactions array', () => {
    render(
      <MessageReactions
        messageId="msg1"
        reactions={[]}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    expect(screen.queryByRole('button', { name: /\d+/ })).not.toBeInTheDocument()
    expect(screen.getByText('Add Reaction')).toBeInTheDocument()
  })

  it('prevents duplicate reactions from same user', async () => {
    const user = userEvent.setup()
    render(
      <MessageReactions
        messageId="msg1"
        reactions={mockReactions}
        currentUserId="user1"
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Add Reaction'))
    await user.click(screen.getByText('Select Emoji'))

    expect(mockHandlers.onReact).not.toHaveBeenCalled()
  })
}) 