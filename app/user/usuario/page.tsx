'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: number;
  description: string;
  area: string;
  date: string;
  dueDate: string;
  status: 'Pendiente' | 'En Proceso' | 'Finalizada';
  photos: string[];
}

export default function UserPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const exampleAssignments: Assignment[] = [
      {
        id: 1,
        description: "LIMPIAR LAS MÁQUINAS CON CEPILLO, PAÑO MICROFIBRA Y DESENGRASANTE",
        area: "Área de Inyección",
        date: "2024-03-20",
        dueDate: "2024-03-21",
        status: "Pendiente",
        photos: []
      },
      {
        id: 2,
        description: "DESCONTAMINAR CON LUZ UV Y OZONO DE AMBIENTE Y SUPERFICIE",
        area: "Área de Inyección",
        date: "2024-03-20",
        dueDate: "2024-03-22",
        status: "Pendiente",
        photos: []
      }
    ];

    const savedAssignments = localStorage.getItem('userAssignments');
    if (!savedAssignments) {
      setAssignments(exampleAssignments);
      localStorage.setItem('userAssignments', JSON.stringify(exampleAssignments));
    } else {
      const parsedAssignments = JSON.parse(savedAssignments) as Assignment[];
      setAssignments(parsedAssignments);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);

      // Create preview URLs
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleStartAssignment = (id: number) => {
    setAssignments(prevAssignments =>
      prevAssignments.map(assignment =>
        assignment.id === id
          ? { ...assignment, status: "En Proceso" as const }
          : assignment
      )
    );

    const updatedAssignments = assignments.map(assignment =>
      assignment.id === id
        ? { ...assignment, status: "En Proceso" as const }
        : assignment
    );

    localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
    toast.success('Tarea iniciada');
  };

  const handleFinishAssignment = (id: number) => {
    setAssignments(prevAssignments =>
      prevAssignments.map(assignment =>
        assignment.id === id
          ? { ...assignment, status: "Finalizada" as const }
          : assignment
      )
    );

    const updatedAssignments = assignments.map(assignment =>
      assignment.id === id
        ? { ...assignment, status: "Finalizada" as const }
        : assignment
    );

    localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
    toast.success('Tarea finalizada');
  };

  const handleReset = () => {
    const resetAssignments: Assignment[] = [
      {
        id: 1,
        description: "LIMPIAR LAS MÁQUINAS CON CEPILLO, PAÑO MICROFIBRA Y DESENGRASANTE",
        area: "Área de Inyección",
        date: "2024-03-20",
        dueDate: "2024-03-21",
        status: "Pendiente",
        photos: []
      },
      {
        id: 2,
        description: "DESCONTAMINAR CON LUZ UV Y OZONO DE AMBIENTE Y SUPERFICIE",
        area: "Área de Inyección",
        date: "2024-03-20",
        dueDate: "2024-03-22",
        status: "Pendiente",
        photos: []
      }
    ];
    
    setAssignments(resetAssignments);
    localStorage.setItem('userAssignments', JSON.stringify(resetAssignments));
    toast.success('Tareas reiniciadas');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className='bg-gradient-to-r from-blue-600 to-blue-800 shadow-md rounded-lg p-4 mb-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
            <svg 
              className='w-6 h-6 text-white' 
              fill='none' 
              stroke='currentColor' 
              viewBox='0 0 24 24'
            >
              <path 
                strokeLinecap='round' 
                strokeLinejoin='round' 
                strokeWidth={2} 
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
              />
            </svg>
            Mis Asignaciones
          </h1>
          <button
            onClick={handleReset}
            className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Reiniciar tareas"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {assignments.map(assignment => (
          <div 
            key={assignment.id}
            className={`
              bg-white rounded-xl shadow-md p-6
              ${assignment.status === 'Pendiente' ? 'border-l-4 border-gray-400' :
                assignment.status === 'En Proceso' ? 'border-l-4 border-blue-500' :
                'border-l-4 border-green-500'}
            `}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{assignment.area}</h3>
                <p className="text-sm text-gray-600">
                  Fecha límite: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${assignment.status === 'Pendiente' ? 'bg-gray-100 text-gray-700' :
                  assignment.status === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'}
              `}>
                {assignment.status}
              </span>
            </div>

            {assignment.status === 'En Proceso' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id={`photos-${assignment.id}`}
                  />
                  <label
                    htmlFor={`photos-${assignment.id}`}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-100"
                  >
                    Subir Fotos
                  </label>
                  <span className="text-sm text-gray-500">
                    {selectedFiles.length} archivos seleccionados
                  </span>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end space-x-4">
              {assignment.status === 'Pendiente' && (
                <button
                  onClick={() => handleStartAssignment(assignment.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Iniciar
                </button>
              )}
              {assignment.status === 'En Proceso' && (
                <button
                  onClick={() => handleFinishAssignment(assignment.id)}
                  disabled={selectedFiles.length === 0}
                  className={`px-4 py-2 rounded-lg
                    ${selectedFiles.length > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                  `}
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
