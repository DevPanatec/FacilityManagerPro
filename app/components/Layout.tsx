import { useRouter } from 'next/navigation'
import { SearchBar } from './SearchBar'

export function Layout({ organizationId }) {
  const router = useRouter()

  const handleSearchResult = (result) => {
    // Navegar al resultado según su tipo
    switch (result.type) {
      case 'employee':
        router.push(`/employees/${result.id}`)
        break
      case 'document':
        router.push(`/documents/${result.id}`)
        break
      case 'report':
        router.push(`/reports/${result.id}`)
        break
    }
  }

  return (
    <div>
      <header className="p-4 border-b">
        <SearchBar 
          organizationId={organizationId}
          onResultClick={handleSearchResult}
        />
      </header>
      {/* Resto del layout */}
    </div>
  )
} 