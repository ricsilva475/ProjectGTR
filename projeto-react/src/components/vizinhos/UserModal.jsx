import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, addDoc, getDocs, collection } from "firebase/firestore";
import { useAuth } from "../../contexts/authContext";
import { toast } from "react-toastify";

const UserModal = ({ show, onHide, user, onSave }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState({
    nome: "",
    morada: "",
    contacto: "",
    nota: "",
  });
console.log(user);
  // Update userData when user prop changes
  useEffect(() => {
    if (user) {
      setUserData({
        contacto: user.contacto,
        id: user.id,
        nome: user.nome,
        morada: user.morada,
        nota: user.nota,
      });
    } else {
      // Reset userData when adding a new user
      setUserData({
        nome: "",
        morada: "",
        contacto: "",
        nota: "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate contact number
    const phoneRegex = /^(91|93|96)\d{7}$|^2\d{8}$/;
    if (!phoneRegex.test(userData.contacto)) {
        toast.error("O número de contato não é válido!");
        return;
    }

    // Fetch all contacts
    const contactsSnapshot = await getDocs(collection(db, "Proprietario", currentUser.uid, "Vizinhos"));
  
    // Check if a contact with the same number already exists
    const contactExists = contactsSnapshot.docs.some(doc => {
      const contactData = doc.data();
      return contactData.contacto === userData.contacto && (!user || doc.id !== user.id);
    });
  
    if (contactExists) {
      toast.error("Já existe um contato com este número!");
      return;
    }
  
    if (user) {
      // Edit existing user
      await updateDoc(doc(db, "Proprietario", currentUser.uid, "Vizinhos", user.id), userData);
    } else {
      // Add new user
      const docRef = await addDoc(collection(db, "Proprietario", currentUser.uid, "Vizinhos"), userData);
      // Update userData state after adding the new user
      setUserData({ nome: "", morada: "", contacto: "", nota: ""}); // Reset the form fields
      userData.id = docRef.id;
    }
    onSave(userData);
    onHide();
    toast.success(user ? "Contacto editado com sucesso!" : "Contacto adicionado com sucesso!");
};
  

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{user ? "Editar Vizinho" : "Adicionar Vizinho"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formNome">
            <Form.Label>Nome:</Form.Label>
            <Form.Control
              type="text"
              
              name="nome"
              value={userData.nome}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formMorada">
            <Form.Label>Morada:</Form.Label>
            <Form.Control
              type="text"
             
              name="morada"
              value={userData.morada}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formContacto">
            <Form.Label>Contacto:</Form.Label>
            <Form.Control
              type="text"
              
              name="contacto"
              value={userData.contacto}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formNotas">
            <Form.Label>Nota:</Form.Label>
            <Form.Control
              type="text"
              
              name="nota"
              value={userData.nota}
              onChange={handleInputChange}
            />
          </Form.Group>

          <div className="d-flex justify-content-center"> {/* Center the button */}
      <Button className="save-button" type="submit">
        {user ? "Guardar" : "Adicionar"}
      </Button>
    </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UserModal;
