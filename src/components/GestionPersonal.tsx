import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './GestionPersonal.css';

interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  puesto: string;
  empleo: 'Cabo 1' | 'Cabo' | 'Soldado';
  fechaAntiguedad: string;
  email: string;
}

const GestionPersonal: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [puesto, setPuesto] = useState('');
  const [empleo, setEmpleo] = useState<'Cabo 1' | 'Cabo' | 'Soldado' | ''>('');
  const [fechaAntiguedad, setFechaAntiguedad] = useState('');
  const [email, setEmail] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  
  // Ref para el contenedor de la lista
  const listaEmpleadosRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const empleadosGuardados = localStorage.getItem('empleados');
    if (empleadosGuardados) {
      setEmpleados(JSON.parse(empleadosGuardados));
    }
  }, []);

  const guardarEmpleados = (nuevosEmpleados: Empleado[]) => {
    setEmpleados(nuevosEmpleados);
    localStorage.setItem('empleados', JSON.stringify(nuevosEmpleados));
    
    // Desplazar hacia abajo cuando se agregue un nuevo empleado
    setTimeout(() => {
      if (listaEmpleadosRef.current) {
        listaEmpleadosRef.current.scrollTop = listaEmpleadosRef.current.scrollHeight;
      }
    }, 100);  // Un ligero retraso para asegurarse de que el DOM esté actualizado
  };

  const agregarEmpleado = () => {
    if (nombre && apellidos && puesto && empleo && fechaAntiguedad && email) {
      const nuevoEmpleado = {
        id: Date.now(),
        nombre,
        apellidos,
        puesto,
        empleo,
        fechaAntiguedad,
        email,
      };
      guardarEmpleados([...empleados, nuevoEmpleado]);
      resetForm();
    }
  };

  const eliminarEmpleado = (id: number) => {
    guardarEmpleados(empleados.filter(emp => emp.id !== id));
  };

  const editarEmpleado = (id: number) => {
    const empleado = empleados.find(emp => emp.id === id);
    if (empleado) {
      setNombre(empleado.nombre);
      setApellidos(empleado.apellidos);
      setPuesto(empleado.puesto);
      setEmpleo(empleado.empleo);
      setFechaAntiguedad(empleado.fechaAntiguedad);
      setEmail(empleado.email);
      setEditando(id);
    }
  };

  const actualizarEmpleado = () => {
    if (editando !== null && nombre && apellidos && puesto && empleo && fechaAntiguedad && email) {
      guardarEmpleados(empleados.map(emp =>
        emp.id === editando ? { ...emp, nombre, apellidos, puesto, empleo, fechaAntiguedad, email } : emp
      ));
      resetForm();
    }
  };

  const resetForm = () => {
    setNombre('');
    setApellidos('');
    setPuesto('');
    setEmpleo('');
    setFechaAntiguedad('');
    setEmail('');
    setEditando(null);
  };

  const ordenarEmpleados = (empleados: Empleado[]) => {
    const prioridadEmpleo: { [key: string]: number } = { 'Cabo 1': 1, 'Cabo': 2, 'Soldado': 3 };
    return empleados.sort((a, b) => {
      if (prioridadEmpleo[a.empleo] !== prioridadEmpleo[b.empleo]) {
        return prioridadEmpleo[a.empleo] - prioridadEmpleo[b.empleo];
      }
      return new Date(a.fechaAntiguedad).getTime() - new Date(b.fechaAntiguedad).getTime();
    });
  };

  return (
    <div className="container">
      <motion.h2
        className="title"
      >
        Gestión de Personal
      </motion.h2>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-6 gap-2">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="input"
        />
        <input
          type="text"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          placeholder="Apellidos"
          className="input"
        />
        <select
          value={puesto}
          onChange={(e) => setPuesto(e.target.value)}
          className="input"
        >
          <option value="">Seleccione puesto</option>
          <option value="Comandante">Comandante</option>
          <option value="Camaras">Camaras</option>
        </select>
        <select
          value={empleo}
          onChange={(e) => setEmpleo(e.target.value as 'Cabo 1' | 'Cabo' | 'Soldado')}
          className="input"
        >
          <option value="">Seleccione empleo</option>
          <option value="Cabo 1">Cabo 1</option>
          <option value="Cabo">Cabo</option>
          <option value="Soldado">Soldado</option>
        </select>
        <input
          type="date"
          value={fechaAntiguedad}
          onChange={(e) => setFechaAntiguedad(e.target.value)}
          className="input"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
        />
      </div>
      {editando === null ? (
        <button onClick={agregarEmpleado} className="button button-add">
          Agregar Empleado
        </button>
      ) : (
        <button onClick={actualizarEmpleado} className="button button-update">
          Actualizar Empleado
        </button>
      )}
      <div className="list-container">
        <ul ref={listaEmpleadosRef} className="list">
          {ordenarEmpleados(empleados).map((empleado) => (
            <li key={empleado.id} className="list-item">
              <span className="item-text">
                {empleado.nombre} {empleado.apellidos} - {empleado.puesto} - {empleado.empleo}
                <span className="item-empleo"> ({empleado.fechaAntiguedad})</span>
              </span>
              <div>
                <button onClick={() => editarEmpleado(empleado.id)} className="button button-edit">
                  Editar
                </button>
                <button onClick={() => eliminarEmpleado(empleado.id)} className="button button-delete">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GestionPersonal;
