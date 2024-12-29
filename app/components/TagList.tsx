interface TagListProps {
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  onClick?: (tag: any) => void
}

export function TagList({ tags, onClick }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <button
          key={tag.id}
          onClick={() => onClick?.(tag)}
          className="px-2 py-1 rounded-full text-sm"
          style={{ 
            backgroundColor: tag.color + '20',
            color: tag.color
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
} 