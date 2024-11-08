import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import './PantallaInicio.css'; // Asegúrate de crear este archivo CSS

interface PantallaInicioProps {
  onLogin: () => void;
}

const PantallaInicio: React.FC<PantallaInicioProps> = ({ onLogin }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000); // Espera 1 segundo antes de mostrar el logo

    return () => clearTimeout(timer);
  }, []);

  const handleFullscreen = () => {
    const elem = document.documentElement as HTMLElement; // Asegúrate de que sea un HTMLElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err: Error) => {
        console.error(`Error al intentar activar pantalla completa: ${err.message}`);
      });
    } else if ((elem as any).mozRequestFullScreen) { // Firefox
      (elem as any).mozRequestFullScreen().catch((err: Error) => {
        console.error(`Error al intentar activar pantalla completa: ${err.message}`);
      });
    } else if ((elem as any).webkitRequestFullscreen) { // Chrome, Safari y Opera
      (elem as any).webkitRequestFullscreen().catch((err: Error) => {
        console.error(`Error al intentar activar pantalla completa: ${err.message}`);
      });
    } else if ((elem as any).msRequestFullscreen) { // IE/Edge
      (elem as any).msRequestFullscreen().catch((err: Error) => {
        console.error(`Error al intentar activar pantalla completa: ${err.message}`);
      });
    }
  };

  return (
    <div className="pantalla-inicio">
      <div className="text-6xl mb-8">
        <Calendar className="text-white drop-shadow-lg" />
      </div>
      <h1 className="text-4xl font-bold mb-8 font-montserrat drop-shadow-lg slide-in">
        Gestion Seguridad RT22
      </h1>
      <div
        className={`transition-opacity duration-700 ${isVisible ? 'opacity-100 slide-in' : 'opacity-0'}`}
      >
        <div className="w-32 h-32 mb-8 rounded-full overflow-hidden shadow-lg">
          <img
            src="/src/Logo.png" 
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <button 
        onClick={() => { handleFullscreen(); onLogin(); }} 
        className="pulse-button hover-button"
      >
        Entrar en la aplicación
      </button>
    </div>
  );
};

export default PantallaInicio;
