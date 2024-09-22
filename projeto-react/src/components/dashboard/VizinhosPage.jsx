import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../../contexts/authContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Dropdown,
  Form
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../vizinhos/vizinhos.css";
import { TrashFill, PencilSquare } from "react-bootstrap-icons";
import UserModal from "../vizinhos/UserModal.jsx";

const VizinhosPage = () => {
  const [vizinhos, setVizinhos] = useState([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [filteredVizinhos, setFilteredVizinhos] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchVizinhos = async () => {
      const vizinhosCollection = collection(
        db,
        "Proprietario",
        currentUser.uid,
        "Vizinhos"
      );
      const vizinhosSnapshot = await getDocs(vizinhosCollection);
      const vizinhosList = vizinhosSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setVizinhos(vizinhosList);
    };

    fetchVizinhos();
  }, [currentUser.uid]);

  useEffect(() => {
    setTotalContacts(filteredVizinhos.length);
  }, [filteredVizinhos]);

  useEffect(() => {
    const filtered = vizinhos.filter((vizinho) =>
      vizinho.nome.toLowerCase().includes(searchFilter.toLowerCase())
    );
    setFilteredVizinhos(filtered);
  }, [vizinhos, searchFilter]);

  const handleSort = (key) => {
    setSortConfig((prevSortConfig) => {
      if (prevSortConfig.key === key) {
        if (prevSortConfig.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prevSortConfig.direction === 'desc') {
          return { key: null, direction: 'asc' };
        } else {
          return { key, direction: 'asc' };
        }
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const sortedVizinhos = React.useMemo(() => {
    if (sortConfig.key !== null) {
      const sortedData = [...filteredVizinhos].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortedData;
    }
    return filteredVizinhos;
  }, [filteredVizinhos, sortConfig]);

  // Calculate the index of the last entry on the current page
  const indexOfLastEntry = currentPage * entriesPerPage;
  // Calculate the index of the first entry on the current page
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  // Get the current entries for the current page
  const currentEntries = sortedVizinhos.slice(indexOfFirstEntry, indexOfLastEntry);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (event) => {
    setSearchFilter(event.target.value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(
        doc(db, "Proprietario", currentUser.uid, "Vizinhos", id)
      );
      setVizinhos(vizinhos.filter((vizinho) => vizinho.id !== id));
      setTotalContacts(totalContacts - 1);
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleModalSave = (userData) => {
    if (selectedUser) {
      const updatedVizinhos = vizinhos.map((user) =>
        user.id === userData.id ? userData : user
      );
      setVizinhos(updatedVizinhos);
    } else {
      setVizinhos([...vizinhos, userData]);
    }
    setShowModal(false); // Close the modal after saving changes
  };

  return (
    <div className="container">
      
      <h1 className="header-title">Vizinhos</h1>
      <br />
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Procurar vizinho por nome"
          onChange={handleSearchChange}
        />
      </Form.Group>
      <div className="row align-items-center">
        <div className="col-md-6">
          <div className="mb-3">
            <h5 className="card-title">
              Lista de contactos{" "}
              <span className="text-muted fw-normal ms-2">
                ({totalContacts})
              </span>
            </h5>
          </div>
        </div>
        <div className="col-md-6">
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
            <div>
              <Button className="save-button" onClick={handleAddUser}>
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12">
          <div className="">
            <div className="table-responsive">
              <table className="table project-list-table table-nowrap align-middle table-borderless">
                <thead>
                  <tr>
                    <th scope="col" onClick={() => handleSort('nome')}>
                      Nome {sortConfig.key === 'nome' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '↕')}
                    </th>
                    <th scope="col" onClick={() => handleSort('morada')}>
                      Morada {sortConfig.key === 'morada' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '↕')}
                    </th>
                    <th scope="col" onClick={() => handleSort('contacto')}>
                      Contacto {sortConfig.key === 'contacto' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '↕')}
                    </th>
                    <th scope="col" onClick={() => handleSort('nota')}>
                      Nota {sortConfig.key === 'nota' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '↕')}
                    </th>
                    <th scope="col" style={{ width : "200px" }}>
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                {currentEntries.map((vizinho) => (
                    <tr key={vizinho.id}>
                      <td>{vizinho.nome}</td>
                      <td>{vizinho.morada}</td>
                      <td>{vizinho.contacto}</td>
                      <td>{vizinho.nota}</td>
                      <td>
                        <ul className="list-inline mb-0">
                          <li className="list-inline-item">
                            <button
                              type="button"
                              onClick={() => handleEditUser(vizinho)}
                              className="btn btn-link px-2 text-primary"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="Edit"
                            >
                              <PencilSquare />
                            </button>
                          </li>
                          <li className="list-inline-item">
                            <button
                              type="button"
                              onClick={() => handleDelete(vizinho.id)}
                              className="btn btn-link px-2 text-danger"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="Delete"
                            >
                              <TrashFill />
                            </button>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-0 align-items-center pb-4">
        <div className="col-sm-6">
          <div>
            <p className="mb-sm-0">
              Mostrando {indexOfFirstEntry + 1} a{" "}
              {Math.min(indexOfLastEntry, totalContacts)} de {totalContacts}{" "}
              vizinhos
            </p>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="float-sm-end">
            <ul className="pagination mb-sm-0">
              <li
                className={`page-item ${currentPage === 1 && "disabled"}`}
              >
                <button
                  className="page-link"
                  onClick={() => paginate(currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {Array.from({
                length: Math.ceil(totalContacts / entriesPerPage),
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
                    Math.ceil(totalContacts / entriesPerPage) && "disabled"
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
      <UserModal
        show={showModal}
        onHide={() => setShowModal(false)}
        user={selectedUser}
        onSave={handleModalSave}
      />
      <br />
      <br />
    </div>
  );
};

export default VizinhosPage;
