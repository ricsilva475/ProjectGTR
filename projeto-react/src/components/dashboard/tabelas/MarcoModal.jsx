import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { db } from "../../../firebase/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const MarcoModal = ({ show, onHide, marcoId, terrenoId, onSave }) => {
  const [marcoData, setMarcoData] = useState({
    descricao: "",
    tipo: "Fisico", // Default to "Fisico"
  });

  useEffect(() => {
    const fetchMarcoData = async () => {
      if (marcoId) {
        try {
          const marcoRef = doc(db, "Terrenos", terrenoId, "Marcos", marcoId);
          const marcoSnap = await getDoc(marcoRef);
          if (marcoSnap.exists()) {
            setMarcoData(marcoSnap.data());
          }
        } catch (error) {
          console.error("Error fetching marco data:", error);
        }
      } else {
        // Reset data if no marcoId is provided (new marco)
        setMarcoData({
          descricao: "",
          tipo: "Fisico", // Default to "Fisico"
        });
      }
    };

    fetchMarcoData();
  }, [marcoId, terrenoId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMarcoData({ ...marcoData, [name]: value });
  };

  const handleTipoChange = () => {
    setMarcoData((prevData) => ({
      ...prevData,
      tipo: prevData.tipo === "Fisico" ? "Virtual" : "Fisico",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const marcoRef = doc(db, "Terrenos", terrenoId, "Marcos", marcoId);
      await updateDoc(marcoRef, marcoData);
      onSave({ ...marcoData, id: marcoId });
      onHide();
      toast.success("Marco atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating marco:", error);
      toast.error("Erro ao atualizar o marco.");
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Marco</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formDescricao">
            <Form.Label>Descrição:</Form.Label>
            <Form.Control
              type="text"
              name="descricao"
              value={marcoData.descricao}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formTipo">
            <Form.Label>Tipo:</Form.Label>
            <Form.Check
              type="switch"
              id="tipo-switch"
              label={marcoData.tipo}
              checked={marcoData.tipo === "Fisico"}
              onChange={handleTipoChange}
            />
          </Form.Group>
          <div className="d-flex justify-content-center">
            <Button className="save-button" type="submit">
              Guardar
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default MarcoModal;
