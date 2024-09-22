import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/authContext";
import { db } from "../../firebase/firebase";
import { toast } from 'react-toastify';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./profile.css";

const Profile = () => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const querySnapshot = await getDocs(collection(db, "Proprietario"));
      querySnapshot.forEach((doc) => {
        if (doc.data().email === currentUser.email) {
          setUser(doc.data());
        }
      });
    };
    getUser();
  }, [currentUser]);


  useEffect(() => {
    if (!user.contribuinte && Object.keys(user).length > 0) {
      toast.error('Introduza um contribuinte para ter acesso a todas as funcionalidades.');
    }
  }, [user]);

  return (
    <div className='profile-container' style={{ marginTop: '100px' }}>
      
      <h1 style={{ fontSize: '2.3em', textAlign: 'center', marginTop: '30px' }}>
            Perfil do Proprietário
        </h1>
        <br />
        
        <div className='profile-form'>
          
            <div className='form-row'>
            
                <label className='form-label'>Nome</label>
                <input type="text" name="name" value={user.name || ''} readOnly className='form-input conf-input' />
            </div>
            <div className='form-row'>
                <label className='form-label'>Email</label>
                <input type="text" name="email" value={user.email || ''} readOnly className='form-input conf-input' />
            </div>
            <div className='form-row'>
                <label className='form-label'>Contribuinte</label>
                <input type="text" name="contribuinte" value={user.contribuinte || ''} readOnly className={`form-input conf-input ${!user.contribuinte ? 'input-error' : ''}`} />
            </div>
            <div className='form-row'>
                <label className='form-label'>Telemóvel</label>
                <input type="text" name="numero" value={user.numero || ''} readOnly className='form-input conf-input' />
            </div>
            <div className='form-row'>
                <label className='form-label'>Morada</label>
                <input type="text" name="morada" value={user.morada || ''} readOnly className='form-input conf-input' />
            </div>
            
            
        </div>
        <br />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Link to="/perfil/edit">
                    <button className="btn-update">
                        Editar Perfil
                    </button>
                </Link>
            </div>
    </div>
);
};

export default Profile;
