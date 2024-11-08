import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import emailjs from 'emailjs-com';
import { Download } from 'lucide-react'; // Importa el nuevo iconoi
import { jsPDF } from "jspdf";
import domtoimage from 'dom-to-image';
import './Calendario.css'; // Asegúrate de crear este archivo CSS
import Swal from 'sweetalert2';


// Define el tipo de empleado
interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  puesto: string;
  empleo: string;
  fechaAntiguedad: string;
  email: string;
}



// Función para Generar PDF con formato actualizado
const generarPDF = async (fecha: Date, seleccionados: Empleado[]): Promise<Blob> => {
  const fechaHoraActual = new Date();
  const opcionesFecha: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const opcionesHora: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

  // Obtener mes y año visualizados desde la fecha proporcionada
  const mesVisualizando = fecha.toLocaleString('default', { month: 'long' }).toUpperCase();
  const anioVisualizando = fecha.getFullYear();

  // Crear la fecha y hora de generación
  const fechaImpresion = `${fechaHoraActual.toLocaleDateString('es-ES', opcionesFecha)} a las ${fechaHoraActual.toLocaleTimeString('es-ES', opcionesHora)}`;

  // Crear el encabezado de manera similar al de descargarCuadrantePDF
  const encabezado = `CUADRANTE DE ${mesVisualizando} ${anioVisualizando}\nFecha y Hora de Generación: ${fechaImpresion}`;

  // Seleccionar el área de impresión
  const areaImpresion = document.querySelector('.print-area') as HTMLElement;
  if (!areaImpresion) {
    throw new Error('No se encontró el área de impresión.');
  }

  // Crear una copia del área de impresión
  const areaImpresionCopia = areaImpresion.cloneNode(true) as HTMLElement;
  document.body.appendChild(areaImpresionCopia); // Añadir la copia temporal al DOM (fuera de la vista)

  // Ajustar las celdas en la copia
  const celdas = areaImpresionCopia.querySelectorAll('th, td');
  celdas.forEach(celda => {
    const celdaElement = celda as HTMLElement;
    celdaElement.style.textAlign = 'center'; // Centrar el texto horizontalmente
    celdaElement.style.verticalAlign = 'middle'; // Centrar el texto verticalmente
    celdaElement.style.border = '1px solid #000'; // Borde claro y uniforme
    celdaElement.style.boxSizing = 'border-box'; // Asegurar tamaño constante
  });

  // Convertir el área de impresión en una imagen usando dom-to-image
  const imgData = await domtoimage.toPng(areaImpresionCopia);

  // Crear un nuevo PDF en formato landscape A4
  const pdf = new jsPDF('landscape', 'pt', 'a4');
  const imgWidth = 800;
  const imgHeight = (imgWidth * areaImpresionCopia.clientHeight) / areaImpresionCopia.clientWidth; // Ajustar proporciones

  // Añadir el encabezado
  pdf.setFontSize(14);
  pdf.text(encabezado, pdf.internal.pageSize.width / 2, 30, { align: 'center' });

  // Añadir la imagen de la tabla
  pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);

  // Guardar el PDF como un Blob en lugar de descargarlo directamente
  const blob = pdf.output('blob');

  // Eliminar la copia temporal
  document.body.removeChild(areaImpresionCopia);

  return blob;
};



// Función para subir el PDF a un servicio como Cloudinary
const subirPDF = async (pdfBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', pdfBlob);
  formData.append('upload_preset', 'Cuadrante');

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/ddszlhe3i/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // URL del archivo subido
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    throw new Error('Error al subir el archivo a Cloudinary. Por favor, inténtalo de nuevo.');
  }
};

// Función para enviar el cuadrante por correo
const enviarCuadrantePorCorreo = async (empleados: Empleado[], fecha: Date, seleccionados: Empleado[]) => {
  if (seleccionados.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Atención',
      text: "Por favor, selecciona al menos un empleado."
    });
    return;
  }

  const correos = seleccionados.map(e => e.email);
  console.log('Correos seleccionados:', correos); // Verifica los correos que se están seleccionando
  const asunto = `Cuadrante para la fecha ${fecha.toLocaleDateString()}`;
  const mensaje = `Estimados empleados,\n\nAdjunto encontrarán el enlace para descargar el cuadrante correspondiente a la fecha ${fecha.toLocaleDateString()}.\n\nSaludos,\n[Tu nombre]`;

  // Validación de correos electrónicos
  const invalidEmails = correos.filter(email => !/\S+@\S+\.\S+/.test(email));
  if (invalidEmails.length > 0) {
    Swal.fire({
      icon: 'error',
      title: 'Errores en los correos',
      text: `Los siguientes correos son inválidos: ${invalidEmails.join(', ')}`
    });
    return;
  }

  try {
    // Generar el PDF
    const pdfBlob = await generarPDF(fecha, seleccionados);

    // Abre el PDF generado en una nueva pestaña para verificación
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl); // Abre el PDF generado en una nueva pestaña

    // Subir el PDF y obtener la URL
    const pdfUrlCloudinary = await subirPDF(pdfBlob);
    console.log('URL del PDF:', pdfUrlCloudinary);

    // Configuración de EmailJS
    const templateParams = {
      subject: asunto,
      message: mensaje,
      emails: correos.join(','),
      pdfLink: pdfUrlCloudinary,
    };

    console.log('Parámetros del correo:', templateParams); // Verifica los parámetros antes de enviar


    // Envío del correo usando EmailJS
    const response = await emailjs.send('service_w0t9ttz', 'Guardia', templateParams, 'kYSi4Ul0jf8UDegcT');

    if (response.status === 200) {
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Cuadrante enviado exitosamente.'
      });
    } else {
      console.error('Error al enviar el cuadrante:', response.text);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al enviar el cuadrante. Por favor, inténtalo de nuevo.'
      });
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.'
    });
  }
};



interface Evento {
  id: string;
  empleado: string; // ID o nombre del empleado
  nombreCompleto: string; // Nombre y apellidos
  empleo: string; // Empleo del empleado
  fecha: string;
  tipo: 'G' | 'X' | 'V' | 'B';
}

interface CalendarioProps {
  fecha: Date;
}

interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  puesto: string;
  empleo: string;
  fechaAntiguedad: string;
  email: string; // Agregar el campo de correo electrónico
}

const tiposEvento = {
  G: { nombre: 'G', color: 'bg-red-800' },
  X: { nombre: 'C', color: 'bg-yellow-800' },
  V: { nombre: 'V', color: 'bg-green-800' },
  B: { nombre: 'B', color: 'bg-purple-800' },
};


const Calendario: React.FC<{ fecha: Date }> = ({ fecha }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [menuContextual, setMenuContextual] = useState<{ x: number; y: number; empleado: string; fecha: Date } | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [filaActiva, setFilaActiva] = useState<number | null>(null);
  const [columnaActiva, setColumnaActiva] = useState<number | null>(null);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<Empleado[]>([]);
  const [mostrarListado, setMostrarListado] = useState(false);
  const [menuContextualAbierto, setMenuContextualAbierto] = useState(false);



  const menuRef = useRef<HTMLDivElement | null>(null);

  const prioridadEmpleo: Record<string, number> = {
    'Cabo 1': 1,
    'Cabo': 2,
    'Soldado': 3,
  };

  const ordenarEmpleados = (empleados: Empleado[]) => {
    return empleados.sort((a, b) => {
      const prioridadA = prioridadEmpleo[a.empleo] || 4;
      const prioridadB = prioridadEmpleo[b.empleo] || 4;

      if (prioridadA === prioridadB) {
        return new Date(a.fechaAntiguedad).getTime() - new Date(b.fechaAntiguedad).getTime();
      }
      return prioridadA - prioridadB;
    });
  };

  useEffect(() => {
    const eventosGuardados = localStorage.getItem('eventos');
    if (eventosGuardados) {
      setEventos(JSON.parse(eventosGuardados));
    }

    const empleadosGuardados = localStorage.getItem('empleados');
    if (empleadosGuardados) {
      const empleadosCargados: Empleado[] = JSON.parse(empleadosGuardados);
      setEmpleados(ordenarEmpleados(empleadosCargados));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuContextual && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuContextual(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuContextual]);

  // Guardar eventos al agregar o eliminar eventos
  const guardarEventos = (nuevosEventos: Evento[]) => {
    setEventos(nuevosEventos);
    localStorage.setItem('eventos', JSON.stringify(nuevosEventos));
  };

  const agregarEvento = (tipo: 'G' | 'X' | 'V' | 'B') => {
    if (menuContextual) {
      const fechaSinHora = new Date(menuContextual.fecha.getFullYear(), menuContextual.fecha.getMonth(), menuContextual.fecha.getDate() + 1);
      const fechaStr = fechaSinHora.toISOString().split('T')[0];

      const empleadoSeleccionado = empleados.find(e => e.nombre === menuContextual.empleado);

      if (empleadoSeleccionado) {
        const eventoExistente = eventos.find(e => e.empleado === menuContextual.empleado && e.fecha === fechaStr);

        if (!eventoExistente) {
          const nuevoEvento: Evento = {
            id: Date.now().toString(),
            empleado: empleadoSeleccionado.nombre,
            nombreCompleto: `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellidos}`,
            empleo: empleadoSeleccionado.empleo,
            fecha: fechaStr,
            tipo,
          };
          guardarEventos([...eventos, nuevoEvento]);
        }
      }
      setMenuContextual(null);
    }
  };

  const eliminarEvento = (id: string) => {
    const eventosActualizados = eventos.filter(evento => evento.id !== id);
    guardarEventos(eventosActualizados);
    setMenuContextual(null);
  };

  const diasEnMes = (fecha: Date) => {
    return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  };

  const cambiarMes = (incremento: number) => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + incremento, 1));
  };

  const handleClick = (e: React.MouseEvent, empleado: string, fecha: Date) => {
    e.preventDefault(); // Prevenir el comportamiento predeterminado del clic

    const menuWidth = 200; // Ancho del menú contextual
    const menuX = e.clientX - menuWidth + 100; // Posición X del menú
    const menuY = e.clientY; // Posición Y del menú

    setMenuContextual({
      x: Math.max(menuX, 0), // Asegúrate de que no se salga de la ventana
      y: menuY,
      empleado,
      fecha,
    });

    // Obtener la fecha en formato correcto para buscar el evento
    const fechaStr = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1).toISOString().split('T')[0];
    const evento = eventos.find(e => e.empleado === empleado && e.fecha === fechaStr);
    setEventoSeleccionado(evento || null); // Establecer el evento seleccionado
  };



  const getEventosDelDia = (empleado: string, fecha: Date) => {
    const fechaStr = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1).toISOString().split('T')[0];
    return eventos.filter(e => e.empleado === empleado && e.fecha === fechaStr);
  };

  const obtenerDiaSemana = (fecha: Date) => {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return diasSemana[fecha.getDay()];
  };

  const esFinDeSemana = (fecha: Date) => {
    const dia = fecha.getDay();
    return dia === 0 || dia === 6;
  };

  // Funcion Imprimir Cuadrante
  const imprimirCuadrante = () => {
    // Mostrar el div de carga (si es necesario)
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex'; // Muestra el div de carga

    // Obtener la fecha y hora actuales
    const fechaHoraActual = new Date();
    const opcionesFecha: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const opcionesHora: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

    // Obtener el mes y año del cuadrante que se está visualizando
    const mesVisualizando = fechaActual.toLocaleString('default', { month: 'long' }).toUpperCase();
    const anioVisualizando = fechaActual.getFullYear();
    const fechaImpresion = `${fechaHoraActual.toLocaleDateString('es-ES', opcionesFecha)} a las ${fechaHoraActual.toLocaleTimeString('es-ES', opcionesHora)}`;

    // Crear el encabezado
    const encabezadoHTML = `
    <div style="text-align: top; margin-bottom: 5px;">
      <h2><strong>CUADRANTE DE ${mesVisualizando} ${anioVisualizando}</strong></h2>
      <h2><strong>Fecha y Hora de Impresión: ${fechaImpresion}</strong></h2>
    </div>
  `;

    // Seleccionar el área de impresión
    const areaImpresion = document.querySelector('.print-area') as HTMLElement;
    if (areaImpresion) {
      // Eliminar encabezados anteriores
      const encabezadosPrevios = areaImpresion.querySelectorAll('.temp-encabezado');
      encabezadosPrevios.forEach(encabezado => encabezado.remove());

      // Insertar el encabezado en el área de impresión
      const nuevoEncabezado = document.createElement('div');
      nuevoEncabezado.className = 'temp-encabezado'; // Añadir clase para identificación
      nuevoEncabezado.innerHTML = encabezadoHTML;
      areaImpresion.insertAdjacentElement('afterbegin', nuevoEncabezado);

      // Ajustar estilo de la tabla en el área de impresión
      const tabla = areaImpresion.querySelector('table') as HTMLElement;
      if (tabla) {
        tabla.style.borderCollapse = 'collapse';
        tabla.style.width = '100%';
        tabla.style.tableLayout = 'auto'; // Mantener el tamaño de celdas fijo

        // Ajustar las celdas en el área de impresión
        const celdas = areaImpresion.querySelectorAll('th, td');
        celdas.forEach(celda => {
          const celdaElement = celda as HTMLElement;
          celdaElement.style.textAlign = 'center'; // Centrar el texto horizontalmente
          celdaElement.style.verticalAlign = 'middle'; // Centrar el texto verticalmente
          celdaElement.style.border = '1px solid #000'; // Borde claro y uniforme
          celdaElement.style.boxSizing = 'border-box'; // Asegurar tamaño constante
        });
      }

      // Imprimir
      window.print();

      // Eliminar el encabezado después de imprimir
      areaImpresion.removeChild(nuevoEncabezado);
    }

    // Ocultar el loading después de imprimir
    if (loading) loading.style.display = 'none';
  };


  // Función para descargar el cuadrante como PDF
  const descargarCuadrantePDF = () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex'; // Muestra el div de carga

    const fechaHoraActual = new Date();
    const opcionesFecha: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const opcionesHora: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

    // Obtener mes y año visualizados desde fechaActual
    const mesVisualizando = fechaActual.toLocaleString('default', { month: 'long' }).toUpperCase();
    const anioVisualizando = fechaActual.getFullYear();
    const fechaImpresion = `${fechaHoraActual.toLocaleDateString('es-ES', opcionesFecha)} a las ${fechaHoraActual.toLocaleTimeString('es-ES', opcionesHora)}`;

    // Encabezado que incluye el mes visualizado
    const encabezado = `CUADRANTE DE ${mesVisualizando} ${anioVisualizando}\nFecha y Hora de Descarga: ${fechaImpresion}`;

    const areaImpresion = document.querySelector('.print-area') as HTMLElement;
    if (areaImpresion) {
      // Crear una copia del área de impresión
      const areaImpresionCopia = areaImpresion.cloneNode(true) as HTMLElement;
      document.body.appendChild(areaImpresionCopia); // Añadir la copia temporal al DOM (fuera de la vista)

      // Ajustar estilo de la tabla en la copia
      const tablaCopia = areaImpresionCopia.querySelector('table') as HTMLElement;
      if (tablaCopia) {
        tablaCopia.style.borderCollapse = 'collapse';
        tablaCopia.style.width = '100%';
        tablaCopia.style.tableLayout = 'auto'; // Mantener el tamaño de celdas fijo
      }

      // Ajustar las celdas en la copia
      const celdas = areaImpresionCopia.querySelectorAll('th, td');
      celdas.forEach(celda => {
        const celdaElement = celda as HTMLElement;
        celdaElement.style.textAlign = 'center'; // Centrar el texto horizontalmente
        celdaElement.style.verticalAlign = 'middle'; // Centrar el texto verticalmente
        celdaElement.style.border = '1px solid #000'; // Borde claro y uniforme
        celdaElement.style.boxSizing = 'border-box'; // Asegurar tamaño constante
      });

      // Capturar la copia de la tabla y generar el PDF usando dom-to-image
      domtoimage.toPng(areaImpresionCopia).then((imgData) => {
        const pdf = new jsPDF('landscape', 'pt', 'a4');
        const imgWidth = 800;
        const imgHeight = (imgWidth * areaImpresionCopia.clientHeight) / areaImpresionCopia.clientWidth; // Ajustar proporciones

        // Añadir el encabezado
        pdf.setFontSize(14);
        pdf.text(encabezado, pdf.internal.pageSize.width / 2, 30, { align: 'center' });

        // Añadir la imagen de la tabla
        pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);

        // Guardar el PDF con el nombre que incluye el mes visualizado
        pdf.save(`cuadrante_${mesVisualizando}_${anioVisualizando}.pdf`);

        // Ocultar el loading y mostrar notificación
        if (loading) {
          loading.style.display = 'none';
          mostrarNotificacion('PDF creado y descargado con éxito.');
        }

        // Eliminar la copia temporal
        document.body.removeChild(areaImpresionCopia);
      }).catch((error) => {
        console.error('Error al generar el PDF:', error);
        if (loading) loading.style.display = 'none';
        mostrarNotificacion('Hubo un problema al generar el PDF.');
      });
    } else {
      console.error('No se encontró el área de impresión.');
      if (loading) loading.style.display = 'none';
    }
  };


  // Función para mostrar notificaciones modernas
  const mostrarNotificacion = (mensaje: string) => {
    Swal.fire({
      title: 'Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      background: '#fff', // Fondo blanco
      color: '#333', // Color del texto
      confirmButtonColor: '#4caf50', // Color del botón de confirmación
      timer: 3000, // Duración de la notificación
      timerProgressBar: true, // Barra de progreso
    });
  };

  // Funcion Manejar Empleado
  function manejarSeleccionEmpleado(empleado: Empleado): void {
    // Comprobar si el empleado ya está seleccionado
    const yaSeleccionado = empleadosSeleccionados.some(e => e.id === empleado.id);

    if (yaSeleccionado) {
      // Si ya está seleccionado, quitarlo de la lista
      setEmpleadosSeleccionados(prev => prev.filter(e => e.id !== empleado.id));
    } else {
      // Si no está seleccionado, agregarlo a la lista
      setEmpleadosSeleccionados(prev => [...prev, empleado]);
    }
  }

  return (
    <div className="flex flex-col items-center mx+1 p-1" style={{ maxWidth: '1900px', width: '100%' }}>
      <h2 className="text-lg font-bold mb-2 font-montserrat ml-1 text-center">Cuadrante Seguridad RT22</h2>
      <div className="mb-2 flex justify-center items-center ml-1 w-full">
        <button onClick={() => cambiarMes(-1)} className="p-4 bg-gray-300 rounded shadow-md hover:bg-red-400 transform active:scale-95 transition-transform duration-150 mr-9">
          <ChevronLeft size={20} />
        </button>

        {/* Texto del mes */}
        <span className="font-bold text-base font-montserrat mx-2 text-center">
          {fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' })
            .replace(/\b\w/g, char => char.toUpperCase())
            .replace(/de /gi, '')}
        </span>

        {/* Botón de impresión */}
        <button onClick={imprimirCuadrante} className="no-print p-2 bg-blue-500 text-white rounded shadow-md hover:bg-blue-600 transform active:scale-95 transition-transform duration-150 mx-2">
          <Printer size={20} />
        </button>

        {/* Botón de descarga */}
        <button onClick={descargarCuadrantePDF} className="no-print p-2 bg-blue-500 text-white rounded shadow-md hover:bg-blue-600 transform active:scale-95 transition-transform duration-150 mx-2">
          <Download size={20} />
        </button>

        {/* Botón de enviar */}
        <button onClick={() => setMostrarListado(true)}>Enviar Cuadrante</button>

        <button onClick={() => cambiarMes(1)} className="p-4 bg-gray-300 rounded shadow-md hover:bg-red-400 transform active:scale-95 transition-transform duration-150 ml-9">
          <ChevronRight size={20} />
        </button>

        {/* Div para la animación de carga */}
        <div id="loading" style={{ display: 'none', position: 'absolute', zIndex: 1000 }}>
          <div className="loading-content">
            <span>Cargando...</span> {/* Ejemplo de texto de carga */}
            <div className="spinner"></div> {/* El spinner ahora está aquí */}
          </div>
        </div>
      </div>


      {/* Listado de empleados para enviar el cuadrante */}
      {mostrarListado && (
        <div className="lista-empleados mb-4">
          <h4>Selecciona empleados para enviar el cuadrante:</h4>
          {empleados.map(empleado => (
            <div key={empleado.id}>
              <input
                type="checkbox"
                checked={empleadosSeleccionados.some(e => e.id === empleado.id)}
                onChange={() => manejarSeleccionEmpleado(empleado)}
              />
              {`${empleado.nombre} ${empleado.apellidos}`}
            </div>
          ))}
          <button onClick={() => {
            enviarCuadrantePorCorreo(empleados, fechaActual, empleadosSeleccionados);
            setMostrarListado(false); // Ocultar listado después de enviar
          }}>Enviar</button>
          <button onClick={() => setMostrarListado(false)}>Cancelar</button>
        </div>
      )}

      {/* Área de impresión */}
      <div className="print-area flex-grow overflow-hidden min-w-full">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-black p-2 text-xs" style={{ width: '100px', height: '30px' }}>Personal</th>
              {Array.from({ length: diasEnMes(fechaActual) }, (_, i) => {
                const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), i + 1);
                return (
                  <th
                    key={i}
                    className={`border border-black text-center ${esFinDeSemana(fecha) ? 'bg-gray-300' : ''} ${columnaActiva === i ? 'dia-activo' : ''}`} // Aplica clase activa
                    style={{ width: '8px', height: '20px', position: 'relative' }} // Añadir posición relativa
                    onMouseEnter={() => setColumnaActiva(i)} // Selecciona el día activo al pasar el mouse
                    onMouseLeave={() => setColumnaActiva(null)} // Limpia la columna activa al salir
                  >
                    {`${i + 1} (${obtenerDiaSemana(fecha).slice(0, 3)})`}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {empleados.map((empleado, empleadoIndex) => (
              <tr
                key={empleado.id}
                className={`${empleado.puesto === 'Comandante' ? 'bg-green-100' : empleado.puesto === 'Camaras' ? 'bg-yellow-100' : ''} ${filaActiva === empleadoIndex ? 'bg-blue-200 celda-activa' : ''}`}
                onMouseEnter={() => setFilaActiva(empleadoIndex)}
                onMouseLeave={() => {
                  // Mantener el estado activo si el menú contextual está abierto
                  if (!menuContextualAbierto) {
                    setFilaActiva(null);
                  }
                }}
              >
                <td className={`border border-black p-1 ${filaActiva === empleadoIndex ? 'nombre celda-activa' : ''}`} style={{ width: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {`${empleado.empleo} ${empleado.apellidos}`}
                </td>

                {Array.from({ length: diasEnMes(fechaActual) }, (_, i) => {
                  const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), i + 1);
                  const eventosDelDia = getEventosDelDia(empleado.nombre, fecha);
                  const esCeldaActiva = filaActiva === empleadoIndex && columnaActiva === i;

                  return (
                    <td
                      key={i}
                      className={`border border-black relative ${esFinDeSemana(fecha) ? 'bg-gray-300' : ''} ${filaActiva === empleadoIndex ? 'celda-activa' : ''} ${columnaActiva === i ? 'celda-activa' : ''}`}
                      onMouseEnter={() => {
                        setColumnaActiva(i);
                        setFilaActiva(empleadoIndex);
                      }}
                      onMouseLeave={() => {
                        // Mantener el estado activo si el menú contextual está abierto
                        if (!menuContextualAbierto) {
                          setColumnaActiva(null);
                          setFilaActiva(null);
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        if (esCeldaActiva) {
                          handleClick(e, empleado.nombre, fecha);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuContextualAbierto(true);
                        // Guardar el estado de fila y columna activa al abrir el menú
                        setFilaActiva(empleadoIndex);
                        setColumnaActiva(i);
                      }}
                      style={{ width: '8px', height: '10px' }}
                    >
                      {esCeldaActiva && (
                        <div className="rectangle-overlay" />
                      )}
                      {eventosDelDia.map(evento => (
                        <div
                          key={evento.id}
                          className={`${tiposEvento[evento.tipo].color} text-white text-xl font-bold`}
                          style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, opacity: 0.75, display: 'fixed', justifyContent: 'center', alignItems: 'center' }}
                        >
                          {tiposEvento[evento.tipo].nombre}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Menú contextual */}
      {menuContextual && (
        <div
          ref={menuRef}
          className="absolute z-10 bg-white border border-gray-300 rounded shadow-md"
          style={{ left: menuContextual.x, top: menuContextual.y }}
        >
          <div className="p-2">
            <h4 className="text-m font-bold">Opciones:</h4>
            {eventoSeleccionado ? (
              <div className="flex flex-col items-start">
                <button onClick={() => eliminarEvento(eventoSeleccionado.id)} className="text-red-500">Eliminar</button>
              </div>
            ) : (
              <div className="flex flex-col">
                <button onClick={() => agregarEvento('G')} className="mb-2 text-red-500">Guardia</button>
                <button onClick={() => agregarEvento('X')} className="mb-2 text-yellow-500">Cambio</button>
                <button onClick={() => agregarEvento('V')} className="mb-2 text-green-500">Vacaciones</button>
                <button onClick={() => agregarEvento('B')} className="mb-2 text-purple-500">Baja</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Calendario;

