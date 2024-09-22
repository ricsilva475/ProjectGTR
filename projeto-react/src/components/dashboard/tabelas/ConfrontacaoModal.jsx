import React from "react";
import { Modal } from "react-bootstrap";

const ConfrontacaoModal = ({ show, handleClose, confrontacao, neighborNames }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Confrontacao Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {confrontacao ? (
          <div>
            <p>Confrontacao ID: {confrontacao.id}</p>
            <p>Entidade: {confrontacao.entidade}</p>
            <p>Descrição: {confrontacao.descricao}</p>
            {confrontacao.entidade === "Pessoa" ? (
              <div>
                <p>Nome do Vizinho: {neighborNames[confrontacao.id] || "Nome não encontrado"}</p>
                {/* Render additional fields for Pessoa */}
                {/* Add your additional fields here */}
              </div>
            ) : (
              <div>
                {/* Render fields for other types of entities */}
                {/* Add your fields for other entities here */}
              </div>
            )}
          </div>
        ) : (
          <p>No confrontacao selected</p>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ConfrontacaoModal;
