import { render, screen, fireEvent } from '@testing-library/react'
import { MessageList } from '../MessageList'
import { Message } from '@/app/shared/contexts/ChatContext'

// Mock de los componentes hijos
jest.mock('../MessageItem', () => ({
  MessageItem: ({ message, onEdit, onDelete, onReply }: any) => (
    <div data-testid={`message-${message.id}`}>
      <div>{message.content}</div>
      <button onClick={() => onEdit(message.id, 'edited')}>Edit</button>
      <button onClick={() => onDelete(message.id)}>Delete</button>
      <button onClick={() => onReply(message)}>Reply</button>
    </div>
  )
}))

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      organization_id: 'org1',
      room_id: 'room1',
      user_id: 'user1',
      content: 'First message',
      type: 'text',
      parent_id: null,
      is_edited: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      organization_id: 'org1',
      room_id: 'room1',
      user_id: 'user2',
      content: 'Second message',
      type: 'text',
      parent_id: null,
      is_edited: false,
      created_at: '2024-01-01T00:01:00Z',
      updated_at: '2024-01-01T00:01:00Z'
    }
  ]

  const mockAttachments = {
    '1': [{
      id: 'att1',
      organization_id: 'org1',
      message_id: '1',
      file_url: 'https://example.com/file.pdf',
      file_type: 'application/pdf',
      file_name: 'test.pdf',
      file_size: 1024,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }]
  }

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReply: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders messages in chronological order', () => {
    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={{}}
        {...mockHandlers}
      />
    )

    const messageElements = screen.getAllByTestId(/^message-/)
    expect(messageElements).toHaveLength(2)
    expect(messageElements[0]).toHaveTextContent('First message')
    expect(messageElements[1]).toHaveTextContent('Second message')
  })

  it('shows typing indicator when users are typing', () => {
    const typingUsers = {
      'user1': 'John',
      'user2': 'Jane'
    }

    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={typingUsers}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('John, Jane están escribiendo...')).toBeInTheDocument()
  })

  it('shows singular typing message for one user', () => {
    const typingUsers = {
      'user1': 'John'
    }

    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={typingUsers}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('John está escribiendo...')).toBeInTheDocument()
  })

  it('handles message edit action', () => {
    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={{}}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getAllByText('Edit')[0])
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1', 'edited')
  })

  it('handles message delete action', () => {
    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={{}}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getAllByText('Delete')[0])
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
  })

  it('handles message reply action', () => {
    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={{}}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getAllByText('Reply')[0])
    expect(mockHandlers.onReply).toHaveBeenCalledWith(mockMessages[0])
  })

  it('shows scroll to bottom button when not at bottom', () => {
    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={{}}
        {...mockHandlers}
      />
    )

    const scrollContainer = screen.getByRole('region')
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 500 })
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 0 })

    fireEvent.scroll(scrollContainer)

    expect(screen.getByText('Scroll to bottom')).toBeInTheDocument()
  })

  it('scrolls to bottom when button is clicked', () => {
    render(
      <MessageList
        messages={mockMessages}
        attachments={mockAttachments}
        typingUsers={{}}
        {...mockHandlers}
      />
    )

    const scrollContainer = screen.getByRole('region')
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 500 })
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 0 })

    fireEvent.scroll(scrollContainer)
    fireEvent.click(screen.getByText('Scroll to bottom'))

    // El botón debería desaparecer después de hacer scroll
    expect(screen.queryByText('Scroll to bottom')).not.toBeInTheDocument()
  })
}) 