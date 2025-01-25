import { render, screen } from '@testing-library/react'
import { MessageAttachmentList } from '../MessageAttachmentList'

describe('MessageAttachmentList', () => {
  const mockAttachments = [
    {
      id: '1',
      organization_id: 'org1',
      message_id: 'msg1',
      file_url: 'https://example.com/image.jpg',
      file_type: 'image/jpeg',
      file_name: 'test-image.jpg',
      file_size: 1024 * 1024, // 1MB
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      organization_id: 'org1',
      message_id: 'msg1',
      file_url: 'https://example.com/doc.pdf',
      file_type: 'application/pdf',
      file_name: 'test-document.pdf',
      file_size: 2.5 * 1024 * 1024, // 2.5MB
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  it('renders attachments correctly', () => {
    render(<MessageAttachmentList attachments={mockAttachments} />)

    // Verificar que los nombres de archivo se muestran
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('test-document.pdf')).toBeInTheDocument()

    // Verificar que los tamaños de archivo se muestran correctamente
    expect(screen.getByText('1.0 MB')).toBeInTheDocument()
    expect(screen.getByText('2.5 MB')).toBeInTheDocument()

    // Verificar que los enlaces tienen las URLs correctas
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', 'https://example.com/image.jpg')
    expect(links[1]).toHaveAttribute('href', 'https://example.com/doc.pdf')

    // Verificar que los enlaces se abren en una nueva pestaña
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders empty state correctly', () => {
    render(<MessageAttachmentList attachments={[]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('formats file sizes correctly', () => {
    const attachmentsWithDifferentSizes = [
      {
        ...mockAttachments[0],
        file_size: 500, // 500 bytes
      },
      {
        ...mockAttachments[0],
        id: '3',
        file_size: 1024 * 500, // 500 KB
      },
      {
        ...mockAttachments[0],
        id: '4',
        file_size: 1024 * 1024 * 1.5, // 1.5 GB
      }
    ]

    render(<MessageAttachmentList attachments={attachmentsWithDifferentSizes} />)

    expect(screen.getByText('500.0 B')).toBeInTheDocument()
    expect(screen.getByText('500.0 KB')).toBeInTheDocument()
    expect(screen.getByText('1.5 MB')).toBeInTheDocument()
  })

  it('shows correct icons for different file types', () => {
    const attachmentsWithDifferentTypes = [
      {
        ...mockAttachments[0],
        file_type: 'image/jpeg',
      },
      {
        ...mockAttachments[0],
        id: '3',
        file_type: 'application/pdf',
      },
      {
        ...mockAttachments[0],
        id: '4',
        file_type: 'application/msword',
      },
      {
        ...mockAttachments[0],
        id: '5',
        file_type: 'application/vnd.ms-excel',
      }
    ]

    const { container } = render(
      <MessageAttachmentList attachments={attachmentsWithDifferentTypes} />
    )

    const icons = container.querySelectorAll('.text-xl')
    expect(icons[0]).toHaveTextContent('🖼️') // Imagen
    expect(icons[1]).toHaveTextContent('📄') // PDF
    expect(icons[2]).toHaveTextContent('📝') // Word
    expect(icons[3]).toHaveTextContent('��') // Excel
  })
}) 