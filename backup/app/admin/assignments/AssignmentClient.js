"use client";

import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-hot-toast';
import { areasData } from '../../mocks/areasData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { initLocalStorage } from '../../utils/initLocalStorage';
import { UserSelect } from './components/UserSelect';
import { AreaSelect } from './components/AreaSelect';
import { DateSelect } from './components/DateSelect';
import { DurationButtons } from './components/DurationButtons';

export default function AssignmentClient() {
  // Definición de horarios de turnos
  const turnoHorarios = {
    A: "08:00 AM - 04:00 PM",
    B: "04:00 PM - 12:00 AM",
    C: "12:00 AM - 08:00 AM"
  };

  // Estado para turnos con más información
  const [turnos, setTurnos] = useState({
    A: {
      usuarios: ["Juan Pérez", "Ana Martínez"],
      logueados: 1,
      color: "blue"
    },
    B: {
      usuarios: ["María López", "Carlos Gómez"],
      logueados: 2,
      color: "green"
    },
    C: {
      usuarios: ["Pedro Sánchez"],
      logueados: 0,
      color: "purple"
    }
  });

  // Estado para el turno seleccionado
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Estado para nuevo usuario
  const [newUser, setNewUser] = useState({
    name: "",
    turno: "",
    rol: "usuario"
  });

  // AGREGAR AQUÍ LOS NUEVOS ESTADOS
  const [assignments, setAssignments] = useState([
    { user: "Juan Pérez", task: "Limpieza", area: "Área 1", shift: "Turno A" },
    { user: "María López", task: "Mantenimiento", area: "Área 2", shift: "Turno B" },
    { user: "Carlos Gómez", task: "Supervisión", area: "Área 3", shift: "Turno C" },
  ]);

  const [formData, setFormData] = useState({
    user: "",
    area: "",
    date: null,
    duration: "",
    startTime: null,
    endTime: null
  });

  // Lista de usuarios disponibles
  const availableUsers = [
    "Juan Pérez",
    "María López",
    "Carlos Gómez",
    "Ana Martínez",
    "Pedro Sánchez",
    "Laura Torres",
    "usuario"
  ];

  // Agregar después de availableUsers
  const [areas, setAreas] = useState([]);

  // Datos de tareas por área (tomados de Enterprise)
  const [areasTareas, setAreasTareas] = useState(areasData);

  // AGREGAR AQUÍ LAS NUEVAS FUNCIONES
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssign = () => {
    if (formData.user && formData.area && formData.date) {
      // Obtener todas las tareas del área seleccionada
      const areaTareas = areasTareas.find(area => area.nombre === formData.area)?.tareas || [];
      
      // Crear nuevas tareas para cada tarea del área
      areaTareas.forEach(tarea => {
        const nuevaTarea = {
          id: Date.now() + Math.random(),
          descripcion: tarea.descripcion,
          asignado: formData.user,
          prioridad: tarea.prioridad || "media",
          estado: "pendiente",
          fechaLimite: formData.date.toISOString().split('T')[0],
          startTime: formData.startTime,
          endTime: formData.endTime
        };

        // Actualizar areasTareas
        setAreasTareas(prev => {
          const newAreasTareas = prev.map(area => {
            if (area.nombre === formData.area) {
              return {
                ...area,
                tareas: [...area.tareas, nuevaTarea]
              };
            }
            return area;
          });
          
          // Guardar en localStorage
          setTareas(newAreasTareas);
          
          return newAreasTareas;
        });
      });

      // Limpiar el formulario
      setFormData({
        user: "",
        area: "",
        date: null,
        duration: "",
        startTime: null,
        endTime: null
      });
      setSelectedDuration(null);
      toast.success("Tareas asignadas correctamente");
    } else {
      toast.error("Por favor, completa los campos obligatorios (Usuario, Área y Fecha)");
    }
  };

  // Manejadores de eventos existentes
  const handleTurnoClick = (turnoKey) => {
    setSelectedTurno(turnoKey === selectedTurno ? null : turnoKey);
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.turno) {
      setTurnos(prev => ({
        ...prev,
        [newUser.turno]: {
          ...prev[newUser.turno],
          usuarios: [...prev[newUser.turno].usuarios, newUser.name]
        }
      }));
      setNewUser({ name: "", turno: "", rol: "usuario" });
      setShowAddUserModal(false);
    }
  };

  const handleRemoveUser = (turno, usuario) => {
    setTurnos(prev => ({
      ...prev,
      [turno]: {
        ...prev[turno],
        usuarios: prev[turno].usuarios.filter(u => u !== usuario)
      }
    }));
  };

  // Estado para el modal de área
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Función para manejar el clic en "Ver detalle" de un área
  const handleVerDetalle = (area) => {
    setSelectedArea(area);
    setShowAreaModal(true);
  };

  // Agregar después de la línea 33
  const [showAllStaff, setShowAllStaff] = useState(false);

  // Primero, modificar el estado de personal total (después de los estados iniciales)
  const personalTotal = [
    { id: 1, nombre: 'Juan Pérez', area: 'Urgencias', estado: 'Activo', rol: 'Limpieza General' },
    { id: 2, nombre: 'María López', area: 'UCI', estado: 'Activo', rol: 'Supervisor' },
    { id: 3, nombre: 'Carlos Ruiz', area: 'Urgencias', estado: 'Inactivo', rol: 'Limpieza General' },
    { id: 4, nombre: 'Ana García', area: 'Quirófano', estado: 'Activo', rol: 'Especialista' },
    { id: 5, nombre: 'Pedro Sánchez', area: 'Urgencias', estado: 'Activo', rol: 'Limpieza General' },
    { id: 6, nombre: 'Laura Torres', area: 'UCI', estado: 'Activo', rol: 'Supervisor' },
    { id: 7, nombre: 'Miguel Ángel', area: 'Laboratorio', estado: 'Activo', rol: 'Técnico' },
    { id: 8, nombre: 'Isabel Díaz', area: 'Urgencias', estado: 'Activo', rol: 'Limpieza General' },
    { id: 9, nombre: 'Roberto Martín', area: 'UCI', turno: 'Tarde', rol: 'Especialista', estado: 'Inactivo' },
    { id: 10, nombre: 'Carmen Vega', area: 'Laboratorio', turno: 'Noche', rol: 'Técnico', estado: 'Activo' },
    { id: 11, nombre: 'Fernando Gil', area: 'Urgencias', turno: 'Mañana', rol: 'Auxiliar', estado: 'Activo' },
    { id: 12, nombre: 'Patricia López', area: 'Farmacia', turno: 'Tarde', rol: 'Supervisor', estado: 'Activo' },
    { id: 13, nombre: 'José Torres', area: 'Pediatría', turno: 'Noche', rol: 'Limpieza General', estado: 'Inactivo' },
    { id: 14, nombre: 'Lucía Martínez', area: 'Quirófano', turno: 'Mañana', rol: 'Especialista', estado: 'Activo' },
    { id: 15, nombre: 'Alberto Ruiz', area: 'UCI', turno: 'Tarde', rol: 'Técnico', estado: 'Activo' },
    { id: 16, nombre: 'usuario', area: 'RRHH', estado: 'Activo', rol: 'Administrativo' },
  ];

  // Funciones para manejar las tareas
  const actualizarEstadoTarea = (areaId, tareaId, nuevoEstado) => {
    setAreasTareas(prev => prev.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          tareas: area.tareas.map(tarea => {
            if (tarea.id === tareaId) {
              return { ...tarea, estado: nuevoEstado };
            }
            return tarea;
          })
        };
      }
      return area;
    }));
    
    showNotification(`Tarea actualizada a: ${nuevoEstado.replace('_', ' ')}`);
  };

  // Agregar estado para el botón toggle de duración
  const [selectedDuration, setSelectedDuration] = useState('daily');

  // Función para manejar la selección de duración
  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
  };

  // Agregar función para eliminar tarea
  const handleDeleteTask = (areaId, tareaId) => {
    setAreasTareas(prev => prev.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          tareas: area.tareas.filter(tarea => tarea.id !== tareaId)
        };
      }
      return area;
    }));
    toast.success("Tarea eliminada correctamente");
  };

  // Actualizar el componente TarjetaArea
  const TarjetaArea = ({ area }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow
      border-l-4 flex flex-col h-[500px]`} style={{ borderLeftColor: area.color }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold" style={{ color: area.color }}>
          {area.nombre}
        </h3>
        <span className="text-sm font-medium px-3 py-1 rounded-full" 
          style={{ 
            backgroundColor: `${area.color}15`,
            color: area.color 
          }}>
          {area.tareas.length} tareas
        </span>
      </div>
      
      {/* Agregamos una altura máxima y scroll al contenedor de tareas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-3">
          {area.tareas.map((tarea) => (
            <div 
              key={tarea.id}
              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors relative"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">{tarea.descripcion}</h5>
                  <p className="text-sm text-gray-500">Asignado a: {tarea.asignado}</p>
                  <div className="flex flex-col space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <FaClock className="w-3 h-3" />
                      <span>
                        Inicio: {tarea.startTime ? 
                          format(new Date(tarea.startTime), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                          'No iniciada'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaRegCalendarCheck className="w-3 h-3" />
                      <span>
                        Finalización: {tarea.endTime ? 
                          format(new Date(tarea.endTime), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                          'En progreso'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleDeleteTask(area.id, tarea.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 
                             transition-colors duration-200"
                  title="Eliminar tarea"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* La barra de progreso siempre estará al final */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Progreso</span>
          <span className="font-medium" style={{ color: area.color }}>
            {area.tareas.filter(t => t.estado === 'completada').length}/{area.tareas.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(area.tareas.filter(t => t.estado === 'completada').length / area.tareas.length) * 100}%`,
              backgroundColor: area.color
            }}
          />
        </div>
      </div>
    </div>
  );

  // Agregar este estado al inicio del componente
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  // Modificar el array de alertas
  const alertasInventario = [
    {
      id: 1,
      tipo: "Productos de Limpieza",
      mensaje: "Bajo stock en desinfectantes y detergentes",
      nivel: "warning",
      fecha: "2024-03-20"
    },
    // ... otras alertas
  ];

  // Componente de Turnos Mejorado
  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
        <h1 className="text-3xl font-bold text-white">Gestión de Asignaciones</h1>
        <p className="text-blue-100 mt-1">Administra los turnos y tareas del personal</p>
      </div>

      {/* Grid principal con mejor diseño */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Turnos */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Turnos del Personal
          </h3>
          
          {/* Lista de Turnos */}
          <div className="space-y-4">
            {Object.entries(turnos).map(([turnoKey, turnoData]) => (
              <div
                key={turnoKey}
                onClick={() => handleTurnoClick(turnoKey)}
                className={`
                  border rounded-xl p-4 cursor-pointer transition-all duration-200
                  ${selectedTurno === turnoKey ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'}
                  ${turnoKey === 'A' ? 'bg-blue-50' : turnoKey === 'B' ? 'bg-green-50' : 'bg-purple-50'}
                `}
              >
                {/* Cabecera del Turno */}
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold">Turno {turnoKey}</h4>
                  <span className="text-sm text-gray-600">{turnoHorarios[turnoKey]}</span>
                </div>

                {/* Información del Turno */}
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{turnoData.usuarios.length} personas asignadas</span>
                  <span>{turnoData.logueados} en línea</span>
                </div>

                {/* Lista de Usuarios (visible solo si el turno está seleccionado) */}
                {selectedTurno === turnoKey && (
                  <div className="mt-3 space-y-2">
                    {turnoData.usuarios.map((usuario, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded-lg">
                        <span>{usuario}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveUser(turnoKey, usuario);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón para Agregar Usuario - Ahora en la parte inferior */}
          <div className="pt-4 mt-auto">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-semibold 
                       shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              Agregar Usuario a Turno
            </button>
          </div>

          {/* Modal para Agregar Usuario */}
          {showAddUserModal && (
            <div className="mt-4 border rounded-xl p-4 bg-gray-50">
              <h4 className="text-lg font-semibold mb-4">Agregar Usuario</h4>
              <select
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mb-3 p-2 border rounded-lg"
              >
                <option value="">Seleccionar Usuario</option>
                {availableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              <select
                value={newUser.turno}
                onChange={(e) => setNewUser(prev => ({ ...prev, turno: e.target.value }))}
                className="w-full mb-3 p-2 border rounded-lg"
              >
                <option value="">Seleccionar Turno</option>
                {Object.keys(turnos).map(turno => (
                  <option key={turno} value={turno}>Turno {turno}</option>
                ))}
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddUser}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel de Nueva Asignación */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Nueva Asignación
          </h3>
          
          <form className="flex flex-col flex-grow space-y-4">
            <UserSelect 
              value={formData.user}
              onChange={handleChange}
              users={personalTotal}
            />

            <AreaSelect 
              value={formData.area}
              onChange={handleChange}
              areas={areasTareas}
            />

            <div className="space-y-4 flex-grow">
              <DateSelect 
                selected={formData.date}
                onChange={(date) => setFormData(prev => ({ ...prev, date }))}
              />

              <DurationButtons 
                selectedDuration={selectedDuration}
                onSelect={handleDurationSelect}
              />
            </div>

            <button
              type="submit"
              disabled={!formData.user || !formData.area || !formData.date}
              className={`
                w-full py-3 rounded-xl text-lg font-semibold shadow-md 
                transition-all duration-200
                ${(formData.user && formData.area && formData.date)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 cursor-not-allowed text-gray-500'}
              `}
            >
              Asignar
            </button>
          </form>
        </div>
      </div>

      {/* Sección de Tareas por Área */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tareas por Área</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areasTareas.map((area) => (
            <TarjetaArea key={area.id} area={area} />
          ))}
        </div>
      </div>

      {/* Modales con mejor diseño */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            {/* ... contenido del modal de área ... */}
          </div>
        </div>
      )}

      {showAllStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Personal Total del Hospital</h3>
                  <p className="text-sm text-gray-500">{personalTotal.length} empleados registrados</p>
                </div>
                <button 
                  onClick={() => setShowAllStaff(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalTotal.map((empleado) => (
                  <div key={empleado.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {empleado.nombre.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {empleado.nombre}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {empleado.rol}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${empleado.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {empleado.estado}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Área: {empleado.area}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalles del Inventario
                </h3>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <p><strong>Tipo:</strong> {selectedItem.tipo}</p>
                <p><strong>Mensaje:</strong> {selectedItem.mensaje}</p>
                <p><strong>Fecha:</strong> {selectedItem.fecha}</p>
                <p><strong>Nivel de Alerta:</strong> {selectedItem.nivel}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
