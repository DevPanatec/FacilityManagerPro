'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { useChatContext } from '@/app/shared/contexts/ChatContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import EmojiPicker from './EmojiPicker'
import type { Database } from '@/lib/types/database'

const MessageInput = memo(function MessageInput() {
  const { state, dispatch } = useChatContext()
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient<Database>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleTyping = () => {
    if (!state.activeRoom?.id) return

    dispatch({
      type: 'SET_TYPING_USER',
      payload: { roomId: state.activeRoom.id, userId: 'current_user' }
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (!state.activeRoom?.id) return
      
      dispatch({
        type: 'REMOVE_TYPING_USER',
        payload: { roomId: state.activeRoom.id, userId: 'current_user' }
      })
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && files.length === 0) return
    if (!state.activeRoom) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Enviar mensaje
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          organization_id: state.activeRoom.organization_id,
          room_id: state.activeRoom.id,
          user_id: user.id,
          content: content.trim(),
          type: 'text',
          parent_id: state.replyingTo?.id || null,
          is_edited: false
        })
        .select()
        .single()

      if (error) throw error

      // Subir archivos si hay
      if (files.length > 0 && message) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop()
          const filePath = `${state.activeRoom.organization_id}/${state.activeRoom.id}/${message.id}/${Math.random()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath)

          await supabase
            .from('chat_message_attachments')
            .insert({
              organization_id: state.activeRoom.organization_id,
              message_id: message.id,
              file_url: publicUrl,
              file_type: file.type,
              file_name: file.name,
              file_size: file.size
            })
        }
      }

      setContent('')
      setFiles([])
      dispatch({ type: 'SET_REPLYING_TO', payload: null })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  if (!state.activeRoom) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-base-200">
      {state.replyingTo && (
        <div className="mb-2 p-2 bg-base-300 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">Respondiendo a:</span>
            <span className="font-medium">{state.replyingTo.content}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_REPLYING_TO', payload: null })}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-2 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-base-300 rounded-lg">
              <span className="flex-1 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Escribe un mensaje..."
            className="textarea textarea-bordered w-full resize-none"
            rows={1}
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="btn btn-circle btn-ghost"
            >
              😊
            </button>
            {showEmojiPicker && emojiButtonRef.current && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker 
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                  position={{
                    top: emojiButtonRef.current.getBoundingClientRect().top - 350,
                    left: emojiButtonRef.current.getBoundingClientRect().left - 250
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-circle btn-ghost"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="submit"
            className="btn btn-circle btn-primary"
            disabled={!content.trim() && files.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  )
})

export default MessageInput 