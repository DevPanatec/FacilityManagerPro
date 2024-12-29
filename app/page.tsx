import ChannelSelector from '@/components/ChannelSelector'
import ChatTest from '@/components/ChatTest'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Monitor de Canales Real-time</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChannelSelector />
        <ChatTest />
      </div>
    </main>
  )
} 