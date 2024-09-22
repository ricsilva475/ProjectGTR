import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import { Form, Button } from "react-bootstrap";
import { PencilSquare } from "react-bootstrap-icons";
import { useAuth } from "../../../contexts/authContext";
import ConfrontacaoModal from "./ConfrontacaoModal";

const ConfrontacoesTable = ({ terrenoId }) => {
  const [confrontacoes, setConfrontacoes] = useState([]);
  const [filteredConfrontacoes, setFilteredConfrontacoes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [neighborNames, setNeighborNames] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedConfrontacao, setSelectedConfrontacao] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchConfrontacoes = async () => {
      const confrontacoesCollection = collection(
        db,
        "Terrenos",
        terrenoId,
        "Confrontacoes"
      );
      const confrontacoesSnapshot = await getDocs(confrontacoesCollection);
      const confrontacoesList = confrontacoesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setConfrontacoes(confrontacoesList);
      setFilteredConfrontacoes(confrontacoesList);
    };
    fetchConfrontacoes();
  }, [terrenoId]);

  useEffect(() => {
    const fetchNeighborNames = async () => {
      const names = {};
      try {
        await Promise.all(
          confrontacoes.map(async (confrontacao) => {
            if (confrontacao.entidade === "Pessoa") {
              const vizinhoDocRef = doc(
                db,
                "Proprietario",
                currentUser.uid,
                "Vizinhos",
                confrontacao.vizinho
              );
              console.log(currentUser.uid);
              const vizinhoDocSnapshot = await getDoc(vizinhoDocRef);
              if (vizinhoDocSnapshot.exists()) {
                const vizinhoData = vizinhoDocSnapshot.data();
                names[confrontacao.id] = vizinhoData.nome;
              } else {
                names[confrontacao.id] = "Nome do Vizinho não encontrado";
              }
            }
          })
        );
        setNeighborNames(names);
      } catch (error) {
        console.error("Error fetching neighbor names:", error);
      }
    };
    
    fetchNeighborNames();
  }, [confrontacoes, currentUser.uid]);

  const handleSearchChange = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredData = confrontacoes.filter((confrontacao) =>
      confrontacao.id.toLowerCase().includes(searchTerm)
    );
    setFilteredConfrontacoes(filteredData);
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredConfrontacoes.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleRedirectToConfrontacaoEdit = (confrontacaoId) => {
    // Handle redirection to confrontacao edit page
  };

  const handleShowModal = (confrontacao) => {
    setSelectedConfrontacao(confrontacao);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConfrontacao(null);
  };

  return (
    <>
      <h1 className="header-title">Lista de Confrontações</h1>
      <br />
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Procurar Confrontação por ID"
          onChange={handleSearchChange}
        />
      </Form.Group>
      <div className="table-responsive">
        <div className="col-md-6">
          <div className="mb-3">
            <h5 className="card-title">
              Lista de Confrontações{" "}
              <span className="text-muted fw-normal ms-2">
                ({filteredConfrontacoes.length})
              </span>
            </h5>
          </div>
        </div>
        <table className="table project-list-table table-nowrap align-middle table-borderless">
          <thead>
            <tr>
              <th scope="col">Confrontacao ID</th>
              <th scope="col">Entidade</th>
              <th scope="col">Descrição</th>
            
            </tr>
          </thead>
          <tbody>
            {currentEntries.map((confrontacao) => (
              <tr key={confrontacao.id}>
                <td>{confrontacao.id}</td>
                <td>
                  {confrontacao.entidade !== "Pessoa"
                    ? confrontacao.entidade 
                    : neighborNames[confrontacao.id] || "Nome do Vizinho"}
                </td>
                <td>{confrontacao.descricao}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row g-0 align-items-center pb-4">
        <div className="col-sm-6">
          <div>
            <p className="mb-sm-0">
              Mostrando {indexOfFirstEntry + 1} a{" "}
              {Math.min(indexOfLastEntry, filteredConfrontacoes.length)} de{" "}
              {filteredConfrontacoes.length} Confrontações
            </p>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="float-sm-end">
            <ul className="pagination mb-sm-0">
              <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                <button
                  className="page-link"
                  onClick={() => paginate(currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {Array.from({
                length: Math.ceil(
                  filteredConfrontacoes.length / entriesPerPage
                )
              }).map((_, index) => (
                <li
                  key={index}
                  className
                  ={`page-item ${currentPage === index + 1 && "active"}`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${
                  currentPage ===
                    Math.ceil(filteredConfrontacoes.length / entriesPerPage) &&
                  "disabled"
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => paginate(currentPage + 1)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <ConfrontacaoModal
        show={showModal}
        handleClose={handleCloseModal}
        confrontacao={selectedConfrontacao}
        neighborNames={neighborNames}
      />
    </>
  );
};

export default ConfrontacoesTable;
