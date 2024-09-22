import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/authContext';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../profile.css';
import { Link, useNavigate } from 'react-router-dom';
import { query, where, addDoc } from 'firebase/firestore';


const EditProfile = () => {
    const { currentUser, refreshUserData } = useAuth();
    const [user, setUser] = useState({});
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const getUser = async () => {
            const querySnapshot = await getDocs(collection(db, "Proprietario"));
            let userExists = false;
            querySnapshot.forEach((doc) => {
                if (doc.data().email === currentUser.email) {
                    setUser(doc.data());
                    setUserId(doc.id);
                    userExists = true;
                }
            });
            if (!userExists) {
                setUser({
                    email: currentUser.email,
                    name: currentUser.displayName,
                });
            }
        }
        getUser();
    }, [currentUser]);

    // Função para validar o número de telemóvel
    const isValidNumber = (numero) => {
        const phoneRegex = /^(91|93|96)\d{7}$|^2\d{8}$/;
        return phoneRegex.test(numero);
    }

    const handleChange = (event) => {
        setUser({
            ...user,
            [event.target.name]: event.target.value
        });
    };

    let originalContribuinte = user.contribuinte;

    const handleUpdate = async () => {
        if (!user.contribuinte) {
            toast.error('O campo contribuinte é obrigatório.');
            return;
        }
    
        if (user.numero && !isValidNumber(user.numero)) {
            toast.error('Número de telemóvel inválido.');
            return;
        }
    
        // validação para o "contribuinte"
        const existingUserQuery = query(collection(db, "Proprietario"), where("contribuinte", "==", user.contribuinte));
        const existingUserSnapshot = await getDocs(existingUserQuery);
    
        // Verificar se o contribuinte já existe e não está associado ao mesmo userId
        const existingUser = existingUserSnapshot.docs.find(doc => doc.id !== userId);
        if (existingUser) {
            toast.error('Já existe um utilizador com este contribuinte.');
            return;
        }
    
        let userRef;
        if (!userId) {
            userRef = await addDoc(collection(db, "Proprietario"), user);
            toast.success("Utilizador criado com sucesso!");
        } else {
            userRef = doc(db, "Proprietario", userId);
            await updateDoc(userRef, user);
            toast.success("Alterações confirmadas com sucesso!");
        }

        await refreshUserData();
    
        setTimeout(() => {
            navigate('/home');
        }, 1000); // 1000 milliseconds = 1 seconds
    };

    return (
        
        <div className='profile-container' style={{ marginTop: '100px' }}>
                <h1 style={{ fontSize: '2.3em', textAlign: 'center', marginTop: '30px' }}>
                    Editar Perfil
                </h1>
                <br />
            
                
                <div className='profile-form'>
                    <div className='form-row'>
                        <label className='form-label'>Nome</label>
                        <input type="text" name="name" value={user.name || ''} onChange={handleChange} className='form-input conf-input' />
                    </div>
                    <div className='form-row'>
                        <label className='form-label'>Email</label>
                        <input type="text" name="email" value={user.email || ''} onChange={handleChange} className='form-input conf-input' />
                    </div>
                    <div className='form-row'>
                        <label className='form-label'>Contribuinte</label>
                        <input type="text" name="contribuinte" value={user.contribuinte || ''} onChange={handleChange} className={`form-input conf-input ${!user.contribuinte ? 'input-error' : ''}`} />
                    </div>
                    <div className='form-row'>
                        <label className='form-label'>Telemóvel</label>
                        <input type="text" name="numero" value={user.numero || ''} onChange={handleChange} className='form-input conf-input' />
                    </div>
                    <div className='form-row'>
                        <label className='form-label'>Morada</label>
                        <input type="text" name="morada" value={user.morada || ''} onChange={handleChange} className='form-input conf-input' />
                    </div>
                   
                </div>
                <br />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <button
                            className="btn-update"
                            onClick={handleUpdate}>
                            Confirmar Alterações
                        </button>

                        <Link to="/perfil/edit/password">
                        <button 
                            className="btn-update">
                           Editar Password
                        </button>
                    </Link>
                    </div>
            </div>

    );
};

export default EditProfile;
