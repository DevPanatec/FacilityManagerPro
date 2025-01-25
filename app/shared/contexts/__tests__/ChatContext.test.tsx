import { render, screen, act } from '@testing-library/react'
import { ChatProvider, useChatContext } from '../ChatContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock de Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}))

const mockSupabase = {
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn()
  })),
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis()
  }))
}

;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

// Componente de prueba para acceder al contexto
const TestComponent = () => {
  const { state, dispatch } = useChatContext()
  return (
    <div>
      <div data-testid="active-room">{state.activeRoom?.id || 'no-room'}</div>
      <div data-testid="messages">{Object.keys(state.messages).length}</div>
      <button
        onClick={() =>
          dispatch({
            type: 'SET_ACTIVE_ROOM',
            payload: {
              id: 'room1',
              organization_id: 'org1',
              name: 'Test Room',
              type: 'group',
              description: null,
              created_by: 'user1',
              is_private: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          })
        }
      >
        Set Room
      </button>
    </div>
  )
}

describe('ChatContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provides initial state', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    expect(screen.getByTestId('active-room')).toHaveTextContent('no-room')
    expect(screen.getByTestId('messages')).toHaveTextContent('0')
  })

  it('updates state when dispatching actions', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    await act(async () => {
      screen.getByText('Set Room').click()
    })

    expect(screen.getByTestId('active-room')).toHaveTextContent('room1')
  })

  it('sets up Supabase subscriptions', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    expect(mockSupabase.channel).toHaveBeenCalled()
  })

  it('handles message updates', async () => {
    const { rerender } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    await act(async () => {
      const channelCallback = mockSupabase.channel().on.mock.calls[0][2]
      channelCallback({
        new: {
          id: 'msg1',
          organization_id: 'org1',
          room_id: 'room1',
          user_id: 'user1',
          content: 'Test message',
          type: 'text',
          parent_id: null,
          is_edited: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      })
    })

    rerender(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    expect(screen.getByTestId('messages')).toHaveTextContent('1')
  })

  it('handles message deletions', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    // Agregar un mensaje primero
    await act(async () => {
      const channelCallback = mockSupabase.channel().on.mock.calls[0][2]
      channelCallback({
        new: {
          id: 'msg1',
          organization_id: 'org1',
          room_id: 'room1',
          user_id: 'user1',
          content: 'Test message',
          type: 'text',
          parent_id: null,
          is_edited: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      })
    })

    // Luego eliminarlo
    await act(async () => {
      const deleteCallback = mockSupabase.channel().on.mock.calls[1][2]
      deleteCallback({
        old: {
          id: 'msg1',
          room_id: 'room1'
        }
      })
    })

    expect(screen.getByTestId('messages')).toHaveTextContent('0')
  })

  it('handles typing users', async () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    await act(async () => {
      const presenceCallback = mockSupabase.channel().on.mock.calls[2][2]
      presenceCallback({
        newPresences: [
          {
            user_id: 'user1',
            username: 'John',
            isTyping: true
          }
        ]
      })
    })

    expect(Object.keys(mockSupabase.channel().on.mock.calls[2][2])).toContain('newPresences')
  })

  it('cleans up subscriptions on unmount', () => {
    const unsubscribe = jest.fn()
    mockSupabase.channel().subscribe.mockReturnValue({ unsubscribe })

    const { unmount } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    )

    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
}) 