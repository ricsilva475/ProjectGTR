import React, { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/authContext'
import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../../../firebase/firebase'
import { toast } from "react-toastify";

const Register = () => {

    const [name, setName] = useState('')    
    const [email, setEmail] = useState('')
    const [contribuinte, setContribuinte] = useState('')
    const [numero, setNumero] = useState('')
    const [morada, setMorada] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setconfirmPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const { userLoggedIn } = useAuth()
    const navigate = useNavigate()

    /*
    As regras para a validação do NIF são:

    Tem de ter 9 dígitos;
    O primeiro dígito tem de ser 1, 2, 5, 6, 8 ou 9; (Esta é a informação que circula na maior parte dos fóruns da internet, mas a realidade é que o 3 está reservado para uso de particulares assim que os começados por 2 se esgotarem e o 4 e 7 são utilizados em casos especiais, pelo que, por omissão, a nossa função ignora esta validação)
    O dígito de controlo (último digíto do NIF) é obtido da seguinte forma:
    9*d1 + 8*d2 + 7*d3 + 6*d4 + 5*d5 + 4*d6 + 3*d7 + 2*d8 + 1*d9  (em que d1 a d9 são os 9 dígitos do NIF);
    Esta soma tem de ser múltiplo de 11 (quando divídida por 11 dar 0);
    Subtraír o resto da divisão da soma por 11 a 11;
    Se o resultado for 10, é assumído o algarismo 0;
    [in webdados]
    */
    const isValidNif = (nif, handleError) => {
        try {
            const max = 9;
            if (!nif.match(/^[0-9]+$/) || nif.length !== max) return false;
            return true;
        } catch (e) {
            if (handleError) {
                handleError("Contribuinte inválido");
            }
            return false;
        }
    }
        
    // função para validar emails
    const isValidEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // função para validar password
    const isValidPassword = (password) => {
        const passwordRegex = /^.{6,}$/;
        return passwordRegex.test(password);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
    
        if (!isValidNif(contribuinte)) {
            toast.error('Contribuinte invalido.');
            return;
        }
        if (!isValidEmail(email)) {
            toast.error('Email invalido.')
            return;
        }
        if (!isValidPassword(password)) {
            toast.error('Password tem de ter 6 carateres.');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
    
        // Faça a validação para o "contribuinte"
        const existingUserQuery = query(collection(db, "Proprietario"), where("contribuinte", "==", contribuinte));
        const existingUserSnapshot = await getDocs(existingUserQuery);
    
        // Verifique se o contribuinte já existe
        const existingUser = existingUserSnapshot.docs.length > 0;
        if (existingUser) {
            toast.error('Já existe um utilizador com este contribuinte.');
            return;
        }
    
        if (!isRegistering) {
            setIsRegistering(true);
    
            try {
                // Create user in Firebase Authentication with custom ID
                const userCredential = await doCreateUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
    
                // Add user data to Firestore with user ID as document ID
                await setDoc(doc(db, "Proprietario", user.uid), {
                    name: name,
                    email: email,
                    contribuinte: contribuinte,
                    numero: numero,
                    morada: morada
                });
    
                // Redirect or perform any other actions upon successful registration
            } catch (error) {
                console.error("Error registering user: ", error);
                setErrorMessage('Error registering user. Please try again.');
            } finally {
                setIsRegistering(false);
            }
        }
    }
    
    return (
        <>
            {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}

            <main className="w-full h-screen flex self-center place-content-center place-items-center" 
                style={{
                    backgroundImage: `url(/wall2.jpg)`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    position: 'fixed',
                    top: 0,
                    right: 0, 
                    bottom: 0, 
                    left: 0,
                    width: '100%',
                    height: '100%',
                }}>
                <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl bg-white">
                    <div className="text-center mb-6">
                        <div className="mt-2">
                            <h3 className="text-gray-800 text-xl font-semibold sm:text-2xl">Create a New Account</h3>
                        </div>

                    </div>
                    <form
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        <div>
                        <label className="form-label">Nome <span className="required">*</span> </label>
                            <input
                                type="name"
                                autoComplete='name'
                                required
                                value={name} onChange={(e) => { setName(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>
                        <div>
                        <label className="form-label">Email <span className="required">*</span> </label>
                            <input
                                type="email"
                                autoComplete='email'
                                required
                                value={email} onChange={(e) => { setEmail(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>
                        <div>
                        <label className="form-label">Contribuinte <span className="required">*</span> </label>
                            <input
                                type="contribuinte"
                                autoComplete='contribuinte'
                                required
                                value={contribuinte} onChange={(e) => { setContribuinte(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        <div>
                        <label className="form-label">Numero de Telemóvel </label>
                            <input
                                type="numero"
                                autoComplete='numero'
                                opcional
                                value={numero} onChange={(e) => { setNumero(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        <div>
                        <label className="form-label">Morada </label>
                            <input
                                type="morada"
                                autoComplete='morada'
                                opcional
                                value={morada} onChange={(e) => { setMorada(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>


                        <div>
                        <label className="form-label">Password <span className="required">*</span> </label>
                            <input
                                disabled={isRegistering}
                                type="password"
                                autoComplete='new-password'
                                required
                                value={password} onChange={(e) => { setPassword(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        <div>
                        <label className="form-label">Confirmar Password <span className="required">*</span> </label>
                            <input
                                disabled={isRegistering}
                                type="password"
                                autoComplete='off'
                                required
                                value={confirmPassword} onChange={(e) => { setconfirmPassword(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        {errorMessage && (
                            <span className='text-red-600 font-bold'>{errorMessage}</span>
                        )}

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${isRegistering ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'}`}
                        >
                            {isRegistering ? 'Signing Up...' : 'Sign Up'}
                        </button>
                        <div className="text-sm text-center">
                            Already have an account? {'   '}
                            <Link to={'/'} className="text-center text-sm hover:underline font-bold">Continue</Link>
                        </div>
                    </form>
                </div>
            </main>
        </>
    )
}

export default Register