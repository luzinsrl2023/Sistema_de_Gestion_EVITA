import React, { useState, useEffect } from 'react';
import { crearProspecto, actualizarProspecto } from '../../services/prospectosService';

const FormularioProspecto = ({ prospectoInicial, onClose }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        empresa: '',
        email: '',
        telefono: '',
        fuente: '',
        estado: 'Nuevo',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const esEdicion = prospectoInicial && prospectoInicial.id;

    useEffect(() => {
        if (esEdicion) {
            // Si estamos editando, llenamos el formulario con los datos existentes.
            setFormData({
                nombre: prospectoInicial.nombre || '',
                empresa: prospectoInicial.empresa || '',
                email: prospectoInicial.email || '',
                telefono: prospectoInicial.telefono || '',
                fuente: prospectoInicial.fuente || '',
                estado: prospectoInicial.estado || 'Nuevo',
            });
        }
    }, [prospectoInicial, esEdicion]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let resultado;

            if (esEdicion) {
                resultado = await actualizarProspecto(prospectoInicial.id, formData);
            } else {
                resultado = await crearProspecto(formData);
            }

            if (resultado?.error) {
                const supabaseError = resultado.error;
                throw supabaseError instanceof Error
                    ? supabaseError
                    : new Error(supabaseError?.message || 'No se pudo guardar el prospecto');
            }

            onClose({
                updated: true,
                message: esEdicion
                    ? 'Prospecto actualizado correctamente'
                    : 'Prospecto creado correctamente',
                data: resultado?.data || null,
            });
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    // Lista de estados posibles, obtenida del tipo ENUM de la DB
    const estadosPosibles = [
        'Nuevo', 'Contactado', 'Calificado', 'Propuesta Enviada',
        'Negociación', 'Ganado', 'Perdido'
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg text-white">
                <h2 className="text-2xl font-bold mb-6 text-green-400">
                    {esEdicion ? 'Editar Prospecto' : 'Crear Nuevo Prospecto'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2">
                            <label htmlFor="nombre" className="block mb-2 text-sm font-medium">Nombre Completo *</label>
                            <input
                                type="text"
                                name="nombre"
                                id="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="empresa" className="block mb-2 text-sm font-medium">Empresa</label>
                            <input
                                type="text"
                                name="empresa"
                                id="empresa"
                                value={formData.empresa}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="telefono" className="block mb-2 text-sm font-medium">Teléfono</label>
                            <input
                                type="tel"
                                name="telefono"
                                id="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="fuente" className="block mb-2 text-sm font-medium">Fuente</label>
                            <input
                                type="text"
                                name="fuente"
                                id="fuente"
                                value={formData.fuente}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                         <div>
                            <label htmlFor="estado" className="block mb-2 text-sm font-medium">Estado</label>
                            <select
                                name="estado"
                                id="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
                            >
                                {estadosPosibles.map(estado => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">Error: {error}</p>}

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={() => onClose({ updated: false })}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Crear Prospecto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioProspecto;