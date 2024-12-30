'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaTasks, FaClock, FaCheckCircle, FaTools, FaSpinner } from 'react-icons/fa';
import { MdPendingActions, MdOutlineCleaningServices } from 'react-icons/md';

export default function TaskHistoryPage() {
    const router = useRouter()
    const [selectedTask, setSelectedTask] = useState(null)
    const [tasks, setTasks] = useState([
        {
            id: 1,
            area: 'Área de Inyección',
            description: 'Limpieza profunda y desinfección',
            status: 'pending',
            assignedAt: '2024-03-18 08:00',
            priority: 'alta'
        },
        {
            id: 2,
            area: 'Área de Producción',
            description: 'Sanitización general',
            status: 'pending',
            assignedAt: '2024-03-18 09:30',
            priority: 'alta'
        },
        {
            id: 3,
            area: 'Área de Almacén',
            description: 'Limpieza especializada de equipos',
            status: 'pending',
            assignedAt: '2024-03-18 10:00',
            priority: 'alta'
        }
    ])

    useEffect(() => {
        const savedTasks = localStorage.getItem('tasks')
        if (savedTasks) {
            try {
                const parsedTasks = JSON.parse(savedTasks)
                setTasks(parsedTasks)
            } catch (error) {
                console.error('Error parsing tasks:', error)
                setTasks([])
            }
        }
    }, [])

    const getStatusBadgeClass = (status) => {
        const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium'
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800`
            case 'in_progress':
                return `${baseClasses} bg-blue-100 text-blue-800`
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`
            default:
                return baseClasses
        }
    }

    const getStatusText = (status) => {
        const statusMap = {
            completed: 'Completada',
            in_progress: 'En Progreso',
            pending: 'Pendiente'
        }
        return statusMap[status] || status
    }

    const handleStartTask = (taskId) => {
        const taskToStart = tasks.find(t => t.id === taskId)
        
        if (!taskToStart) return
        
        // Verificar si ya hay una tarea en progreso
        const inProgressTask = tasks.find(t => t.status === 'in_progress')
        if (inProgressTask) {
            toast.error('Ya hay una tarea en progreso')
            return
        }
        
        // Actualizar el estado local
        const updatedTasks = tasks.map(task => 
            task.id === taskId ? { ...task, status: 'in_progress' } : task
        )
        setTasks(updatedTasks)
        localStorage.setItem('tasks', JSON.stringify(updatedTasks))

        // Crear tarea con estructura básica
        const taskForStorage = {
            ...taskToStart,
            status: 'in_progress',
            startTime: new Date().toLocaleString(),
            checklist: [
                { id: 1, task: 'Preparar materiales de limpieza', completed: false },
                { id: 2, task: 'Desinfectar superficies', completed: false },
                { id: 3, task: 'Limpiar pisos', completed: false },
                { id: 4, task: 'Verificar áreas críticas', completed: false }
            ]
        }

        localStorage.setItem('currentTask', JSON.stringify(taskForStorage))
        localStorage.setItem('taskPhotos', JSON.stringify({
            antes: null,
            durante: null,
            despues: null
        }))
        
        window.location.href = '/user/currentTask'
    }

    const handleReset = () => {
        const initialTasks = [
            {
                id: 1,
                area: 'Área de Inyección',
                description: 'Limpieza profunda y desinfección',
                status: 'pending',
                assignedAt: '2024-03-18 08:00',
                priority: 'alta'
            },
            {
                id: 2,
                area: 'Área de Producción',
                description: 'Sanitización general',
                status: 'pending',
                assignedAt: '2024-03-18 09:30',
                priority: 'alta'
            },
            {
                id: 3,
                area: 'Área de Almacén',
                description: 'Limpieza especializada de equipos',
                status: 'pending',
                assignedAt: '2024-03-18 10:00',
                priority: 'alta'
            }
        ];

        setTasks(initialTasks);
        localStorage.removeItem('tasks');
        localStorage.removeItem('currentTask');
        localStorage.removeItem('taskPhotos');
        toast.success('Historial reiniciado correctamente');
    };

    return (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <FaTasks className="text-blue-200" />
                                Gestión de Tareas
                            </h1>
                            <p className="mt-2 text-blue-100 flex items-center gap-2">
                                <MdOutlineCleaningServices />
                                Administra y supervisa todas las tareas de limpieza y mantenimiento
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
                            title="Reiniciar historial"
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
                
                {/* Estadísticas mejoradas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                    <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6 border border-yellow-100">
                        <div className="flex items-center gap-2 text-yellow-600">
                            <MdPendingActions className="text-2xl" />
                            <div className="text-sm font-medium">Tareas Pendientes</div>
                        </div>
                        <div className="mt-2 text-3xl font-bold text-yellow-700">
                            {tasks.filter(t => t.status === 'pending').length}
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-600">
                            <FaSpinner className="text-2xl" />
                            <div className="text-sm font-medium">En Progreso</div>
                        </div>
                        <div className="mt-2 text-3xl font-bold text-blue-700">
                            {tasks.filter(t => t.status === 'in_progress').length}
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6 border border-green-100">
                        <div className="flex items-center gap-2 text-green-600">
                            <FaCheckCircle className="text-2xl" />
                            <div className="text-sm font-medium">Completadas</div>
                        </div>
                        <div className="mt-2 text-3xl font-bold text-green-700">
                            {tasks.filter(t => t.status === 'completed').length}
                        </div>
                    </div>
                </div>

                {/* Lista de tareas mejorada */}
                <div className="px-8 pb-8">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <FaTasks className="text-blue-600" />
                                Todas las tareas
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {tasks.map((task) => (
                                <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className={`${getStatusBadgeClass(task.status)} flex items-center gap-1`}>
                                                    {task.status === 'pending' && <FaClock />}
                                                    {task.status === 'in_progress' && <FaSpinner className="animate-spin" />}
                                                    {task.status === 'completed' && <FaCheckCircle />}
                                                    {getStatusText(task.status)}
                                                </span>
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <FaTools className="text-gray-400" />
                                                    {task.completedAt || task.startedAt || task.assignedAt}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-lg font-medium text-gray-900">{task.area}</p>
                                            <p className="mt-1 text-gray-500">{task.description}</p>
                                        </div>
                                        <div className="ml-4 flex gap-2">
                                            {task.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStartTask(task.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 
                                                             text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md"
                                                >
                                                    <FaSpinner />
                                                    Comenzar
                                                </button>
                                            )}
                                            {task.status === 'completed' && (
                                                <button
                                                    onClick={() => setSelectedTask(task)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Ver Reporte
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal del reporte aquí */}
            {selectedTask && selectedTask.report && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white">
                                    Reporte: {selectedTask.area}
                                </h2>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="text-white hover:text-gray-200 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Evidencia Fotográfica</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        {Object.entries(selectedTask.report.photos).map(([stage, url]) => (
                                            <div key={stage} className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 capitalize">
                                                    {stage}
                                                </p>
                                                <div className="relative h-48 rounded-lg overflow-hidden shadow-md">
                                                    <Image
                                                        src={url}
                                                        alt={`Foto ${stage}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tareas Completadas</h3>
                                    <ul className="grid grid-cols-2 gap-3">
                                        {selectedTask.report.checklist.map((item, index) => (
                                            <li key={index} className="flex items-center space-x-2 text-gray-700">
                                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{item.task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}