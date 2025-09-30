import React, { useState, useEffect, useCallback } from 'react';
import { obtenerProspectos, eliminarProspecto } from '../../services/prospectosService';
import FormularioProspecto from './FormularioProspecto';

const combineClasses = (...clases) => clases.filter(Boolean).join(' ');

const PlusIcon = ({ className = '' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={combineClasses('h-6 w-6', className)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = ({ className = '' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={combineClasses('h-5 w-5', className)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
    </svg>
);

const TrashIcon = ({ className = '' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={combineClasses('h-5 w-5', className)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PaginaProspectos = () => {
    const [prospectos, setProspectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const cargarProspectos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: loadError } = await obtenerProspectos();

            if (loadError) {
                throw loadError instanceof Error
                    ? loadError
                    : new Error(loadError?.message || 'No se pudieron obtener los prospectos');
            }

            setProspectos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            const message = err?.message || 'Error al cargar los prospectos';
            setError(message);
            setFeedback({ type: 'error', message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarProspectos();
    }, [cargarProspectos]);

    const handleCrear = () => {
        setProspectoSeleccionado(null);
        setIsFormOpen(true);
    };

    const handleEditar = (prospecto) => {
        setProspectoSeleccionado(prospecto);
        setIsFormOpen(true);
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este prospecto?')) {
            try {
                const { error: deleteError } = await eliminarProspecto(id);

                if (deleteError) {
                    throw deleteError instanceof Error
                        ? deleteError
                        : new Error(deleteError?.message || 'No se pudo eliminar el prospecto');
                }

                await cargarProspectos();
                setFeedback({ type: 'success', message: 'Prospecto eliminado correctamente' });
            } catch (err) {
                console.error(err);
                setFeedback({ type: 'error', message: err?.message || 'Error al eliminar el prospecto' });
            }
        }
    };

    const handleFormClose = (resultado) => {
        setIsFormOpen(false);
        setProspectoSeleccionado(null);

        if (resultado === true) {
            cargarProspectos();
            setFeedback({ type: 'success', message: 'Prospecto guardado correctamente' });
            return;
        }

        if (resultado && typeof resultado === 'object') {
            if (resultado.updated) {
                cargarProspectos();
                if (resultado.message) {
                    setFeedback({ type: 'success', message: resultado.message });
                }
            } else if (resultado.message) {
                setFeedback({ type: 'info', message: resultado.message });
            }
            if (resultado.error) {
                setFeedback({ type: 'error', message: resultado.error });
            }
        }
    };

    useEffect(() => {
        if (!feedback) {
            return undefined;
        }
        const timer = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timer);
    }, [feedback]);

    if (loading) {
        return <div className="text-center p-8">Cargando prospectos...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-green-400">Gestión de Prospectos</h1>
                <button
                    onClick={handleCrear}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition duration-300"
                >
                    <PlusIcon className="mr-2" />
                    Nuevo Prospecto
                </button>
            </header>

            {feedback && (
                <div
                    role="status"
                    className={combineClasses(
                        'mb-4 rounded-lg border px-4 py-3 text-sm',
                        feedback.type === 'success' && 'border-green-500/50 bg-green-500/10 text-green-300',
                        feedback.type === 'error' && 'border-red-500/50 bg-red-500/10 text-red-300',
                        feedback.type === 'info' && 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                    )}
                >
                    {feedback.message}
                </div>
            )}

            <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left">Nombre</th>
                            <th className="py-3 px-4 text-left">Empresa</th>
                            <th className="py-3 px-4 text-left">Email</th>
                            <th className="py-3 px-4 text-left">Teléfono</th>
                            <th className="py-3 px-4 text-left">Estado</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {prospectos.length > 0 ? (
                            prospectos.map(prospecto => (
                                <tr key={prospecto.id} className="hover:bg-gray-700 transition duration-150">
                                    <td className="py-3 px-4">{prospecto.nombre}</td>
                                    <td className="py-3 px-4">{prospecto.empresa || '-'}</td>
                                    <td className="py-3 px-4">{prospecto.email || '-'}</td>
                                    <td className="py-3 px-4">{prospecto.telefono || '-'}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 text-sm rounded-full bg-blue-500 text-white">
                                            {prospecto.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 flex justify-center items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEditar(prospecto)}
                                            className="text-yellow-400 hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 rounded"
                                            aria-label={`Editar prospecto ${prospecto.nombre}`}
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminar(prospecto.id)}
                                            className="text-red-500 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 rounded"
                                            aria-label={`Eliminar prospecto ${prospecto.nombre}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-6">No se encontraron prospectos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <FormularioProspecto
                    prospectoInicial={prospectoSeleccionado}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
};

export default PaginaProspectos;