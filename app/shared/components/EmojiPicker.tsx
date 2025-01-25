import { memo, useEffect, useRef } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

export interface EmojiPickerProps {
  onSelect: (emoji: { native: string }) => void
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement>
  theme?: 'light' | 'dark'
}

export const EmojiPicker = memo(function EmojiPicker({
  onSelect,
  onClose,
  triggerRef,
  theme = 'light'
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    const handleResize = () => {
      if (pickerRef.current && triggerRef?.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        pickerRef.current.style.top = `${rect.bottom + window.scrollY}px`
        pickerRef.current.style.left = `${rect.left + window.scrollX}px`
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [triggerRef])

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1000,
    ...(triggerRef?.current
      ? {
          top: triggerRef.current.getBoundingClientRect().bottom + window.scrollY,
          left: triggerRef.current.getBoundingClientRect().left + window.scrollX
        }
      : {})
  }

  return (
    <div ref={pickerRef} style={style} data-theme={theme}>
      <Picker
        data={data}
        onEmojiSelect={onSelect}
        onClickOutside={onClose}
        theme={theme}
      />
    </div>
  )
}) 