'use client'

import { useChatContext } from '@/app/shared/contexts/ChatContext'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export function ChatMessageTester() {
  const { state, sendMessage } = useChatContext()
  const { activeRoom } = state
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!activeRoom) {
      toast.error('No active chat room selected')
      return
    }

    if (!message.trim() && !file) {
      toast.error('Please enter a message or select a file')
      return
    }

    try {
      setIsSending(true)
      await sendMessage(
        message,
        undefined,
        file ? [file] : undefined,
        (fileName, progress) => {
          toast.loading(`Uploading ${fileName}: ${progress}%`, {
            id: `upload-${fileName}`
          })
        }
      )
      setMessage('')
      setFile(null)
      toast.success('Message sent successfully')
    } catch (error) {
      toast.error(`Error sending message: ${(error as Error).message}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE)) {
        toast.error('File size exceeds maximum allowed')
        return
      }
      setFile(selectedFile)
    }
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-col gap-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a test message..."
          className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          disabled={isSending}
        />
        <input
          type="file"
          onChange={handleFileChange}
          className="text-sm"
          disabled={isSending}
        />
        {file && (
          <div className="text-sm text-gray-500">
            Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}
        <button
          onClick={handleSend}
          disabled={isSending}
          className={`px-4 py-2 text-white bg-blue-500 rounded-md ${
            isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {isSending ? 'Sending...' : 'Send Test Message'}
        </button>
      </div>
    </div>
  )
} 