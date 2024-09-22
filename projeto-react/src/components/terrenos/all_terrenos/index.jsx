import React from 'react';
import AllTerrenos from './allTerrenos';

const Terrenos = () => {
    return (
        <div><br/>
            <h1 style={{ 
            fontSize: '2.5em', 
            textAlign: 'center', 
            marginTop: '50px' 
        }}>
    Os meus Terrenos
</h1>
            <AllTerrenos /> {/* Renderize o componente AllTerrenos */}
        </div>
    );
};

export default Terrenos;