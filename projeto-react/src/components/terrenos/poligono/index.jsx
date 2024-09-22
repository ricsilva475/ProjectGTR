import React from 'react';
import FreguesiaMap from '../FreguesiaMap';

const Poligono = () => {


    
    return (
        <div><br/>
            <h1 style={{ 
            fontSize: '2.5em', 
            textAlign: 'center', 
            marginTop: '50px' 
        }}>
    Desenho do Poligono
</h1>
            <FreguesiaMap /> {/* Renderize o componente FreguesiaMap */}
        </div>
    );
};

export default Poligono;