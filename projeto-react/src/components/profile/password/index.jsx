import React, { useState } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function EditPasswordForm() {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast.error('No user is currently signed in');
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    try {
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      toast.error('Current password is incorrect');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      await updatePassword(user, newPassword);
      toast.success('Password atualizada com sucesso');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  
  return (
    <div className='profile-container' style={{ marginTop: '100px' }}>
    <form onSubmit={handleSubmit} className="form-container">
      <h1 style={{ fontSize: '2.3em', textAlign: 'center' }}>
        Editar Password
      </h1>
      <br />
      <br />
      <div className="form-group">
        <label className="form-label">Password atual</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div className="form-group">
  <label className="form-label">
    Nova password
    <div className="user-box" style={{ position: 'relative' }}>
      <input
        type={showPassword ? "text" : "password"}
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        className="input-field"
        required
        style={{ paddingRight: '40px' }} // Reserve space for the icon
      />
      <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
        <FontAwesomeIcon 
          icon={showPassword ? faEyeSlash : faEye} 
          className="eye-icon"
        />
      </span>
    </div>
  </label>
</div>

<div className="form-group">
  <label className="form-label">
    Confirme a nova password
    <div className="user-box" style={{ position: 'relative' }}>
      <input
        type={showPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        className="input-field"
        required
        style={{ paddingRight: '40px' }} // Reserve space for the icon
      />
      <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
        <FontAwesomeIcon 
          icon={showPassword ? faEyeSlash : faEye} 
          className="eye-icon"
        />
      </span>
    </div>
  </label>
</div>
      <div className="button-container">
        <button type="submit" className="btn-update">Guardar Password</button>
      </div>
    </form>
    </div>
  );
}

export default EditPasswordForm;