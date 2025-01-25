import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageItem } from '../MessageItem'

// Mock de los componentes hijos
jest.mock('../MessageReactions', () => ({
  MessageReactions: () => <div data-testid="message-reactions">Reactions</div>
}))

jest.mock('../LinkPreview', () => ({
  LinkPreview: () => <div data-testid="link-preview">Link Preview</div>
}))

jest.mock('../MessageAttachmentList', () => ({
  MessageAttachmentList: ({ attachments }: { attachments: any[] }) => (
    <div data-testid="message-attachments">
      {attachments.length} attachments
    </div>
  )
}))

describe('MessageItem', () => {
  const mockMessage = {
    id: '1',
    organization_id: 'org1',
    room_id: 'room1',
    user_id: 'user1',
    content: 'Test message content',
    type: 'text' as const,
    parent_id: null,
    is_edited: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockAttachments = [
    {
      id: '1',
      organization_id: 'org1',
      message_id: '1',
      file_url: 'https://example.com/file.pdf',
      file_type: 'application/pdf',
      file_name: 'test.pdf',
      file_size: 1024,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReply: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders message content correctly', () => {
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Test message content')).toBeInTheDocument()
    expect(screen.getByText('user1')).toBeInTheDocument()
  })

  it('shows edited indicator when message is edited', () => {
    render(
      <MessageItem
        message={{ ...mockMessage, is_edited: true }}
        attachments={[]}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('(editado)')).toBeInTheDocument()
  })

  it('renders attachments when present', () => {
    render(
      <MessageItem
        message={mockMessage}
        attachments={mockAttachments}
        {...mockHandlers}
      />
    )

    expect(screen.getByTestId('message-attachments')).toBeInTheDocument()
    expect(screen.getByText('1 attachments')).toBeInTheDocument()
  })

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Editar'))
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('Test message content')
  })

  it('calls onEdit when saving edited message', async () => {
    const user = userEvent.setup()
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Editar'))
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, 'Updated content')
    await user.click(screen.getByText('Guardar'))

    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1', 'Updated content')
  })

  it('cancels edit mode when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Editar'))
    await user.click(screen.getByText('Cancelar'))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(mockHandlers.onEdit).not.toHaveBeenCalled()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Eliminar'))
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onReply when reply button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    await user.click(screen.getByText('Responder'))
    expect(mockHandlers.onReply).toHaveBeenCalledWith(mockMessage)
  })

  it('handles keyboard shortcuts in edit mode', async () => {
    const user = userEvent.setup()
    render(
      <MessageItem
        message={mockMessage}
        attachments={[]}
        {...mockHandlers}
      />
    )

    // Entrar en modo edición
    await user.click(screen.getByText('Editar'))
    const textarea = screen.getByRole('textbox')

    // Guardar con Enter
    await user.type(textarea, 'New content{Enter}')
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1', 'Test message contentNew content')

    // Cancelar con Escape
    await user.click(screen.getByText('Editar'))
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
}) 