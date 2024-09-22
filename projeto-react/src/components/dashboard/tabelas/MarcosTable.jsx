import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import { Form } from "react-bootstrap";
import { PencilSquare } from "react-bootstrap-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import MarcoModal from "./MarcoModal";

const MarcosTable = ({ terrenoId }) => {
  const [marcos, setMarcos] = useState([]);
  const [filteredMarcos, setFilteredMarcos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedMarcoId, setSelectedMarcoId] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchMarcos = async () => {
      const marcosCollection = collection(db, "Terrenos", terrenoId, "Marcos");
      const marcosSnapshot = await getDocs(marcosCollection);
      const marcosList = marcosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarcos(marcosList);
      setFilteredMarcos(marcosList);
      console.log(marcosList);
    };
    fetchMarcos();
  }, [terrenoId]);

  const handleSearchChange = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredData = marcos.filter((marco) =>
      marco.id.toLowerCase().includes(searchTerm)
    );
    setFilteredMarcos(filteredData);
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredMarcos.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditClick = (marcoId) => {
    setSelectedMarcoId(marcoId);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedMarcoId(null);
  };

  const handleModalSave = (marcoData) => {
    if (selectedMarcoId) {
      const updatedMarcos = marcos.map((marco) =>
        marco.id === marcoData.id ? marcoData : marco
      );
      setMarcos(updatedMarcos);
      setFilteredMarcos(updatedMarcos);
    } else {
      const newMarcos = [...marcos, marcoData];
      setMarcos(newMarcos);
      setFilteredMarcos(newMarcos);
    }
    setShowModal(false); // Close the modal after saving changes
  };

  return (
    <>
      <h1 className="header-title">Lista de Marcos</h1>
      <br />
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Procurar Marco por ID"
          onChange={handleSearchChange}
        />
      </Form.Group>
      <div className="table-responsive">
        <div className="col-md-6">
          <div className="mb-3">
            <h5 className="card-title">
              Lista de Marcos{" "}
              <span className="text-muted fw-normal ms-2">
                ({filteredMarcos.length})
              </span>
            </h5>
          </div>
        </div>
        <table className="table project-list-table table-nowrap align-middle table-borderless">
          <thead>
            <tr>
              <th scope="col">Marco ID</th>
              <th scope="col">Descrição</th>
              <th scope="col">Tipo</th>
              <th scope="col">Coordenadas</th>
          
            </tr>
          </thead>
          <tbody>
            {currentEntries.map((marco) => (
              <tr key={marco.id}>
                <td>{marco.id}</td>
                <td>{marco.descricao}</td>
                <td>{marco.tipo}</td>
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${marco.point.latitude}, ${marco.point.longitude}`
                    );
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 1500); // Reset copied state after 1.5 seconds
                  }}
                >
                  {Number(marco.point.latitude).toFixed(5)},{" "}
                  {Number(marco.point.longitude).toFixed(5)}
                </td>

              
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
              {Math.min(indexOfLastEntry, filteredMarcos.length)} de{" "}
              {filteredMarcos.length} Marcos
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
                length: Math.ceil(filteredMarcos.length / entriesPerPage),
              }).map((_, index) => (
                <li
                  key={index}
                  className={`page-item ${
                    currentPage === index + 1 && "active"
                  }`}
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
                    Math.ceil(filteredMarcos.length / entriesPerPage) &&
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
      {selectedMarcoId && (
        <MarcoModal
          show={showModal}
          onHide={handleModalClose}
          marcoId={selectedMarcoId}
          terrenoId={terrenoId}
          onSave={handleModalSave}
        />
      )}
    </>
  );
};

export default MarcosTable;
