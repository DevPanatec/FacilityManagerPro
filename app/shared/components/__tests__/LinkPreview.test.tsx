import { render, screen, waitFor } from '@testing-library/react'
import { LinkPreview } from '../LinkPreview'

// Mock de fetch
global.fetch = jest.fn()

describe('LinkPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockPreviewData = {
    url: 'https://example.com',
    title: 'Example Title',
    description: 'Example description text',
    image: 'https://example.com/image.jpg',
    domain: 'example.com'
  }

  it('renders loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {})
    )

    render(<LinkPreview content="Check this out: https://example.com" />)
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('renders preview data correctly', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPreviewData)
      })
    )

    render(<LinkPreview content="Check this out: https://example.com" />)

    await waitFor(() => {
      expect(screen.getByText('Example Title')).toBeInTheDocument()
      expect(screen.getByText('Example description text')).toBeInTheDocument()
      expect(screen.getByText('example.com')).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image.jpg')
    })
  })

  it('renders preview without image when no image is provided', async () => {
    const previewDataWithoutImage = { ...mockPreviewData, image: null }
    
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(previewDataWithoutImage)
      })
    )

    render(<LinkPreview content="Check this out: https://example.com" />)

    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByText('Example Title')).toBeInTheDocument()
    })
  })

  it('handles fetch error gracefully', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to fetch'))
    )

    render(<LinkPreview content="Check this out: https://example.com" />)

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      expect(screen.queryByText('Example Title')).not.toBeInTheDocument()
    })
  })

  it('does not fetch preview for content without URLs', () => {
    render(<LinkPreview content="This is a text without any URL" />)
    
    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
  })

  it('handles multiple URLs by using the first one', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPreviewData)
      })
    )

    render(
      <LinkPreview content="First URL: https://example.com Second URL: https://another.com" />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com')
      )
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('https://another.com')
      )
    })
  })
}) 