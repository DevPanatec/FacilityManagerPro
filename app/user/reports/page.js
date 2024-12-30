'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaExclamationTriangle, FaCamera, FaUpload, FaCheckCircle } from 'react-icons/fa'
import { MdDescription, MdLocationOn } from 'react-icons/md'
import { BiPhotoAlbum } from 'react-icons/bi'

export default function ReportsPage() {
    const router = useRouter()
    const [reportData, setReportData] = useState({
        area: '',
        tipoContingencia: '',
        descripcion: '',
        fotos: {
            antes: null,
            durante: null,
            despues: null
        },
        fotoUnica: null,
        modoFoto: 'multiple'
    })

    const [showSuccess, setShowSuccess] = useState(false)

    const areas = [
        'Área de Inyección',
        'Área de Producción',
        'Área de Almacén',
        'Área de Empaque',
        'Área de Control de Calidad',
        'Área de Mantenimiento'
    ]

    const tiposContingencia = [
        'Derrame de químicos',
        'Falla de maquinaria',
        'Contaminación de área',
        'Falla en sistema de limpieza',
        'Accidente laboral',
        'Material defectuoso',
        'Problema de sanitización',
        'Otro'
    ]

    const handlePhotoUpload = (stage, e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                if (reportData.modoFoto === 'multiple') {
                    setReportData(prev => ({
                        ...prev,
                        fotos: {
                            ...prev.fotos,
                            [stage]: reader.result
                        }
                    }))
                } else {
                    setReportData(prev => ({
                        ...prev,
                        fotoUnica: reader.result
                    }))
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!reportData.area || !reportData.tipoContingencia || !reportData.descripcion) {
            toast.error('Por favor complete todos los campos requeridos')
            return
        }

        if (reportData.modoFoto === 'multiple' && 
            (!reportData.fotos.antes || !reportData.fotos.durante || !reportData.fotos.despues)) {
            toast.error('Por favor suba todas las fotos requeridas')
            return
        }

        if (reportData.modoFoto === 'unica' && !reportData.fotoUnica) {
            toast.error('Por favor suba una foto del estado actual')
            return
        }

        // Aquí iría la lógica para enviar el reporte
        setShowSuccess(true)
        setTimeout(() => {
            setShowSuccess(false)
        }, 3000)

        setReportData({
            area: '',
            tipoContingencia: '',
            descripcion: '',
            fotos: { antes: null, durante: null, despues: null },
            fotoUnica: null,
            modoFoto: 'multiple'
        })
    }

    return (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 bg-gray-50">
            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center transform animate-success">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <svg 
                                className="w-10 h-10 text-green-500" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Reporte Enviado!</h2>
                        <p className="text-gray-600">Tu reporte ha sido enviado correctamente</p>
                    </div>
                </div>
            )}
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
                    <h1 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
                        <FaExclamationTriangle className="text-yellow-300" />
                        Reporte de Incidentes
                    </h1>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Sección de información básica */}
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                    <MdDescription className="text-blue-600 text-2xl" />
                                    Información del Incidente
                                </h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <MdLocationOn className="text-blue-500" />
                                            Área
                                        </label>
                                        <select
                                            value={reportData.area}
                                            onChange={(e) => setReportData(prev => ({ ...prev, area: e.target.value }))}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 
                                                     hover:border-blue-400 transition-colors"
                                        >
                                            <option value="">Seleccione un área</option>
                                            {areas.map(area => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <FaExclamationTriangle className="text-orange-500" />
                                            Tipo de Contingencia
                                        </label>
                                        <select
                                            value={reportData.tipoContingencia}
                                            onChange={(e) => setReportData(prev => ({ ...prev, tipoContingencia: e.target.value }))}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500
                                                     hover:border-blue-400 transition-colors"
                                        >
                                            <option value="">Seleccione el tipo</option>
                                            {tiposContingencia.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
                                        <textarea
                                            value={reportData.descripcion}
                                            onChange={(e) => setReportData(prev => ({ ...prev, descripcion: e.target.value }))}
                                            rows={4}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="Describa la situación detalladamente..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección de fotos */}
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                    <BiPhotoAlbum className="text-blue-600 text-2xl" />
                                    Evidencia Fotográfica
                                </h2>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                                        <label className="inline-flex items-center hover:text-blue-600 transition-colors cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={reportData.modoFoto === 'multiple'}
                                                onChange={() => setReportData(prev => ({ ...prev, modoFoto: 'multiple' }))}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 flex items-center gap-2">
                                                <FaCamera className="text-blue-500" />
                                                Fotos antes/durante/después
                                            </span>
                                        </label>
                                        <label className="inline-flex items-center hover:text-blue-600 transition-colors cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={reportData.modoFoto === 'unica'}
                                                onChange={() => setReportData(prev => ({ ...prev, modoFoto: 'unica' }))}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 flex items-center gap-2">
                                                <FaCamera className="text-blue-500" />
                                                Foto única del estado actual
                                            </span>
                                        </label>
                                    </div>

                                    {reportData.modoFoto === 'multiple' ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            {['antes', 'durante', 'despues'].map((stage) => (
                                                <div key={stage} className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                                                        <FaCamera className="text-blue-500" />
                                                        {stage === 'despues' ? 'después' : stage}
                                                    </p>
                                                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                                        {reportData.fotos[stage] ? (
                                                            <div className="relative h-48">
                                                                <Image
                                                                    src={reportData.fotos[stage]}
                                                                    alt={`Foto ${stage}`}
                                                                    fill
                                                                    className="object-cover rounded-lg"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer block text-center">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handlePhotoUpload(stage, e)}
                                                                />
                                                                <div className="text-gray-500">
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
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                            {reportData.fotoUnica ? (
                                                <div className="relative h-48">
                                                    <Image
                                                        src={reportData.fotoUnica}
                                                        alt="Estado actual"
                                                        fill
                                                        className="object-cover rounded-lg"
                                                    />
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer block text-center">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handlePhotoUpload('unica', e)}
                                                    />
                                                    <div className="text-gray-500">
                                                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <p className="mt-1">Subir foto del estado actual</p>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg 
                                         font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 
                                         transition-all duration-200 shadow-lg
                                         flex items-center gap-2"
                            >
                                <FaCheckCircle className="text-xl" />
                                Enviar Reporte
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}
