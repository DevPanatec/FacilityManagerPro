import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

export type FileType = 'image' | 'document' | 'spreadsheet' | 'other'

interface UploadedFile {
  url: string
  type: FileType
  name: string
  size: number
}

interface UploadProgress {
  progress: number
  controller: AbortController
}

export class FileService {
  private supabase = createClientComponentClient<Database>()
  private uploadControllers = new Map<string, AbortController>()

  private getFileType(file: File): FileType {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.includes('spreadsheet') || file.name.match(/\.(xlsx|xls|csv)$/i)) return 'spreadsheet'
    if (file.type.includes('document') || file.name.match(/\.(doc|docx|pdf)$/i)) return 'document'
    return 'other'
  }

  private async uploadFile(
    file: File,
    organizationId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    const fileType = this.getFileType(file)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${organizationId}/${fileName}`

    // Crear un nuevo AbortController para esta carga
    const controller = new AbortController()
    this.uploadControllers.set(file.name, controller)

    try {
      // Subir el archivo con seguimiento de progreso
      const { data, error } = await this.supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          abortSignal: controller.signal,
          onUploadProgress: (progress) => {
            if (onProgress) {
              onProgress((progress.loaded / progress.total) * 100)
            }
          }
        })

      if (error) throw error

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = this.supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath)

      return {
        url: publicUrl,
        type: fileType,
        name: file.name,
        size: file.size
      }
    } finally {
      this.uploadControllers.delete(file.name)
    }
  }

  async uploadFiles(
    files: File[],
    organizationId: string,
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(
        file,
        organizationId,
        progress => onProgress?.(file.name, progress)
      )
    )

    return Promise.all(uploadPromises)
  }

  cancelUpload(fileName: string) {
    const controller = this.uploadControllers.get(fileName)
    if (controller) {
      controller.abort()
      this.uploadControllers.delete(fileName)
    }
  }

  async deleteFile(url: string): Promise<void> {
    const path = url.split('/').pop()
    if (!path) return

    await this.supabase.storage
      .from('chat-attachments')
      .remove([path])
  }

  getImageThumbnail(url: string, size: number = 200): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from('chat-attachments')
      .getPublicUrl(url, {
        transform: {
          width: size,
          height: size,
          resize: 'cover'
        }
      })

    return publicUrl
  }

  async getFileMetadata(url: string) {
    const path = url.split('/').slice(-2).join('/')
    const { data, error } = await this.supabase.storage
      .from('chat-attachments')
      .list(path.split('/')[0], {
        search: path.split('/')[1]
      })

    if (error) throw error
    if (!data || data.length === 0) throw new Error('File not found')

    return data[0]
  }
} 