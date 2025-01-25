'use client'

import { ChatProvider } from '@/app/shared/contexts/ChatContext'
import { ChatTester } from '@/app/shared/components/chat/ChatTester'

export default function ChatTestPage() {
  return (
    <ChatProvider>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Chat Test</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChatTester />
        </div>
      </div>
    </ChatProvider>
  )
} 