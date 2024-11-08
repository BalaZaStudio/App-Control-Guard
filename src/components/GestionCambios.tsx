import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import './GestionCambios.css';

// Define el tipo para un evento
interface Evento {
  id: string;
  empleado: string;
  nombreCompleto: string;
  empleo: string;
  fecha: string;
  tipo: string;
}

// Define el tipo para documentosCambios
interface DocumentosCambios {
  [key: string]: File | null; // Ajusta el tipo según lo que necesites
}

// Establece el elemento raíz para el modal
Modal.setAppElement('#root');

const GestionCambios = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [documentosCambios, setDocumentosCambios] = useState<DocumentosCambios>({});
  const [nuevoDocumento, setNuevoDocumento] = useState<File | null>(null); // Estado para almacenar el archivo
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null); // Estado para editar
  const [nuevaFecha, setNuevaFecha] = useState<string>(''); // Estado para la nueva fecha
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false); // Estado para controlar el modal de edición
  const [modalDocumentoIsOpen, setModalDocumentoIsOpen] = useState<boolean>(false); // Estado para el modal del documento
  const [documentoVisualizando, setDocumentoVisualizando] = useState<File | null>(null); // Estado para el documento a visualizar

  // Carga los eventos desde el localStorage al iniciar
  useEffect(() => {
    const eventosGuardados = localStorage.getItem('eventos');
    if (eventosGuardados) {
      setEventos(JSON.parse(eventosGuardados));
    }
  }, []);

  // Filtra solo los eventos de tipo "X"
  const eventosTipoX = eventos.filter(evento => evento.tipo === "X");

  // Función para eliminar un evento
  const eliminarEvento = (id: string) => {
    console.log(`Intentando eliminar el evento con ID: ${id}`);
    setEventos((prevEventos) => {
      const eventosActualizados = prevEventos.filter(evento => evento.id !== id);

      // Actualiza el localStorage
      localStorage.setItem('eventos', JSON.stringify(eventosActualizados));

      return eventosActualizados; // Devuelve el nuevo estado
    });

    // Elimina el documento relacionado, si es necesario
    setDocumentosCambios((prevDocumentos) => {
      const nuevosDocumentos = { ...prevDocumentos };
      delete nuevosDocumentos[id]; // Cambia 'id' a la clave correspondiente del documento
      localStorage.setItem('documentosCambios', JSON.stringify(nuevosDocumentos));
      return nuevosDocumentos;
    });
  };

  // Función para abrir el modal de edición
  const abrirModal = (evento: Evento) => {
    setEventoEditando(evento);
    setNuevaFecha(evento.fecha); // Carga la fecha actual para editar
    setModalIsOpen(true); // Abre el modal de edición
  };

  // Función para cerrar el modal de edición
  const cerrarModal = () => {
    setModalIsOpen(false);
    setEventoEditando(null);
  };

  // Función para abrir el modal de visualización del documento
  const abrirModalDocumento = (id: string) => {
    setDocumentoVisualizando(documentosCambios[id]);
    setModalDocumentoIsOpen(true); // Abre el modal de visualización del documento
  };

  // Función para cerrar el modal de visualización del documento
  const cerrarModalDocumento = () => {
    setModalDocumentoIsOpen(false);
    setDocumentoVisualizando(null);
  };

  // Función para guardar la nueva fecha
  const guardarFecha = () => {
    if (eventoEditando) {
      const eventosActualizados = eventos.map(evento =>
        evento.id === eventoEditando.id ? { ...evento, fecha: nuevaFecha } : evento
      );
      setEventos(eventosActualizados);
      localStorage.setItem('eventos', JSON.stringify(eventosActualizados));
      cerrarModal(); // Cierra el modal
      alert("Fecha actualizada con éxito.");
    }
  };

  // Función para guardar un nuevo documento
  const guardarDocumento = () => {
    if (nuevoDocumento && eventoEditando) {
      const nuevosDocumentos = { ...documentosCambios, [eventoEditando.id]: nuevoDocumento };
      setDocumentosCambios(nuevosDocumentos);
      localStorage.setItem('documentosCambios', JSON.stringify(nuevosDocumentos));
      setNuevoDocumento(null); // Reinicia el estado del documento
      alert("Documento adjuntado con éxito.");
    }
  };

  // Función para manejar el cambio de archivo
  const manejarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0] || null;
    setNuevoDocumento(archivo);
  };

  return (
    <div className='container'>
      <h1 className='titulo'>Gestión de Cambios</h1>
      <ul className='eventList'>
        {eventosTipoX.map(evento => (
          <li key={evento.id} className='eventItem'>
            <span className='eventText'>
              {evento.nombreCompleto} - {evento.empleo} - {evento.fecha}
            </span>
            <div className='buttonContainer'>
              <button className='button' onClick={() => eliminarEvento(evento.id)}>Eliminar</button>
              <button className='button' onClick={() => abrirModal(evento)}>Editar</button>
              <button className='button' onClick={() => abrirModalDocumento(evento.id)}>Ver Documento</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal para editar el evento */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={cerrarModal}
        style={modalStyles}
        contentLabel="Editar Evento"
      >
        <h2 className='editTitle'>Editar Evento: {eventoEditando?.nombreCompleto}</h2>
        <input
          type="date"
          value={nuevaFecha}
          onChange={(e) => setNuevaFecha(e.target.value)}
          className='dateInput'
        />
        <button className='button' onClick={guardarFecha}>Guardar Fecha</button>
        <h3 className='editSubTitle'>Adjuntar Documento</h3>
        <input type="file" onChange={manejarArchivo} />
        <button className='button' onClick={guardarDocumento}>Guardar Documento</button>
        <button className='button' onClick={cerrarModal}>Cerrar</button>
      </Modal>

      {/* Modal para visualizar el documento */}
      <Modal
        isOpen={modalDocumentoIsOpen}
        onRequestClose={cerrarModalDocumento}
        style={modalStyles}
        contentLabel="Visualizar Documento"
      >
        <h2 className='editTitle'>Documento Adjunto</h2>
        {documentoVisualizando ? (
          <div>
            <h3>{documentoVisualizando.name}</h3>
            <iframe
              src={URL.createObjectURL(documentoVisualizando)}
              className='documentIframe'
              title="Document Viewer"
            />
          </div>
        ) : (
          <p>No hay documento adjunto.</p>
        )}
        <button className='button' onClick={cerrarModalDocumento}>Cerrar</button>
      </Modal>
    </div>
  );
};

// Estilos para el modal
const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '600px',
    padding: '20px',
    borderRadius: '10px',
  },
};

export default GestionCambios;
