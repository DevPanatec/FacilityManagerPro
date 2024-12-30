'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { FaClock, FaHourglassHalf, FaClipboardCheck, FaCamera } from 'react-icons/fa'

export default function CurrentTaskPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [currentTask, setCurrentTask] = useState(null)
    const [photos, setPhotos] = useState({
        antes: null,
        durante: null,
        despues: null
    })
    const [canSubmit, setCanSubmit] = useState(false)

    useEffect(() => {
        const loadCurrentTask = () => {
            try {
                const savedTask = localStorage.getItem('currentTask')
                if (savedTask) {
                    const task = JSON.parse(savedTask)
                    setCurrentTask(task)
                }
            } catch (error) {
                console.error('Error loading current task:', error)
                toast.error('Error al cargar la tarea actual')
            }
            setIsLoading(false)
        }
        
        loadCurrentTask()
    }, [])

    useEffect(() => {
        if (currentTask) {
            const allPhotosUploaded = Object.values(photos).every(photo => photo !== null)
            const allTasksCompleted = currentTask.checklist?.every(task => task.completed) || false
            setCanSubmit(allPhotosUploaded && allTasksCompleted)
            localStorage.setItem('taskPhotos', JSON.stringify(photos))
        }
    }, [currentTask, photos])

    const handlePhotoUpload = (stage, e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotos(prev => ({
                    ...prev,
                    [stage]: reader.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleChecklistChange = (taskId) => {
        setCurrentTask(prev => ({
            ...prev,
            checklist: prev.checklist.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            )
        }))
    }

    const handleSubmitReport = async () => {
        if (canSubmit) {
            try {
                // Obtener las tareas actuales
                const tasksString = localStorage.getItem('tasks')
                const userAssignmentsString = localStorage.getItem('userAssignments')
                
                // Crear el objeto de reporte
                const reportData = {
                    id: currentTask.id,
                    area: currentTask.area,
                    description: currentTask.description,
                    status: 'completed',
                    assignedAt: currentTask.startTime,
                    completedAt: new Date().toLocaleString(),
                    priority: 'alta',
                    report: {
                        photos: photos,
                        checklist: currentTask.checklist
                    }
                }

                // Actualizar o crear el array de tareas en el historial
                const existingTasks = tasksString ? JSON.parse(tasksString) : []
                const updatedTasks = existingTasks.map(task => 
                    task.id === currentTask.id ? reportData : task
                )
                
                if (!existingTasks.some(task => task.id === currentTask.id)) {
                    updatedTasks.push(reportData)
                }

                localStorage.setItem('tasks', JSON.stringify(updatedTasks))

                // Actualizar userAssignments
                if (userAssignmentsString) {
                    const userAssignments = JSON.parse(userAssignmentsString)
                    const updatedAssignments = userAssignments.map(assignment =>
                        assignment.id === currentTask.id
                            ? { ...assignment, status: 'Finalizada' }
                            : assignment
                    )
                    localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments))
                }

                // Limpiar el estado actual
                localStorage.removeItem('currentTask')
                localStorage.removeItem('taskPhotos')
                toast.success('Reporte enviado correctamente')
                router.push('/user/taskHistory')
            } catch (error) {
                console.error('Error:', error)
                toast.error('Error al enviar el reporte')
            }
        } else {
            toast.error('Complete todas las tareas y suba las fotos requeridas')
        }
    }

    const handleDeletePhoto = (stage) => {
        setPhotos(prev => ({
            ...prev,
            [stage]: null
        }))
        localStorage.setItem('taskPhotos', JSON.stringify({
            ...photos,
            [stage]: null
        }))
    }

    const handleStartAssignment = (id) => {
        const currentTask = assignments.find(a => a.id === id);
        if (currentTask) {
            const taskWithChecklist = {
                ...currentTask,
                checklist: [
                    { 
                        id: 1, 
                        task: "LIMPIAR LAS MÁQUINAS CON CEPILLO, PAÑO MICROFIBRA Y DESENGRASANTE",
                        completed: false 
                    },
                    { 
                        id: 2, 
                        task: "DESCONTAMINAR CON LUZ UV Y OZONO DE AMBIENTE Y SUPERFICIE",
                        completed: false 
                    }
                ],
                startTime: new Date().toLocaleString()
            };
            localStorage.setItem('currentTask', JSON.stringify(taskWithChecklist));
            localStorage.setItem('taskPhotos', JSON.stringify({
                antes: null,
                durante: null,
                despues: null
            }));
            router.push('/user/currentTask');
        }
    };

    if (isLoading) {
        return (
            <>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </main>
            </>
        )
    }

    if (!currentTask && !isLoading) {
        return (
            <>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900">No hay tarea en progreso</h2>
                        <p className="mt-2 text-gray-600">Selecciona una tarea para comenzar</p>
                    </div>
                </main>
            </>
        )
    }

    return (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
                    <div className="flex justify-between items-start">
                        <div className="text-white">
                            <h3 className="text-3xl font-bold tracking-tight">{currentTask.area}</h3>
                            <p className="mt-2 text-blue-100 text-lg">{currentTask.description}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white shadow-lg">
                                Prioridad Alta
                            </span>
                            <span className="mt-2 text-blue-100">
                                ID: {currentTask.id}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-lg border border-indigo-100">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-indigo-100 rounded-xl">
                                        <FaClock className="text-indigo-600 text-2xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-indigo-900">Hora de inicio</p>
                                        <p className="text-2xl font-bold text-indigo-700">{currentTask.startTime}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-lg border border-purple-100">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <FaHourglassHalf className="text-purple-600 text-2xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-purple-900">Duración estimada</p>
                                        <p className="text-2xl font-bold text-purple-700">{currentTask.estimatedDuration}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <FaClipboardCheck className="text-green-600 text-2xl" />
                                </div>
                                <h5 className="text-xl font-bold text-gray-900">Lista de verificación</h5>
                            </div>
                            <div className="space-y-4">
                                {currentTask.checklist.map((item) => (
                                    <div key={item.id} 
                                         className={`flex items-center p-4 rounded-xl transition-all transform hover:scale-[1.01] shadow-sm
                                            ${item.completed ? 'bg-green-50 border-2 border-green-200' : 'bg-white border-2 border-gray-200'}`}>
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => handleChecklistChange(item.id)}
                                            className="h-6 w-6 text-green-600 rounded-lg border-gray-300 focus:ring-green-500"
                                        />
                                        <span className={`ml-4 text-lg ${item.completed ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                                            {item.task}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <FaCamera className="text-blue-600 text-2xl" />
                                </div>
                                <h5 className="text-xl font-bold text-gray-900">Documentación fotográfica</h5>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                {['antes', 'durante', 'despues'].map((stage) => (
                                    <div key={stage} className="space-y-3">
                                        <p className="text-lg font-medium text-gray-900 capitalize">
                                            {stage === 'despues' ? 'después' : stage}
                                        </p>
                                        <div className="border-3 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                                            {photos[stage] ? (
                                                <div className="relative h-48">
                                                    <Image
                                                        src={photos[stage]}
                                                        alt={`Foto ${stage}`}
                                                        fill
                                                        className="object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={() => handleDeletePhoto(stage)}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handlePhotoUpload(stage, e)}
                                                    />
                                                    <div className="text-gray-500 hover:text-gray-600">
                                                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <p className="mt-1">Subir foto</p>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <button
                                onClick={handleSubmitReport}
                                disabled={!canSubmit}
                                className={`px-8 py-3 rounded-xl text-white font-medium text-lg shadow-lg transition-all
                                    ${canSubmit 
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105' 
                                        : 'bg-gray-400 cursor-not-allowed'}`}
                            >
                                {canSubmit ? 'Enviar reporte' : 'Complete todos los requisitos'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}