import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
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
import "./vizinhos.css";
import { TrashFill, PencilSquare } from "react-bootstrap-icons";
import UserModal from "./UserModal.jsx";
import { toast } from "react-toastify";

const Vizinhos = () => {
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

  const handleDelete = (id) => {
    toast(
      <div style={{ padding: '20px', fontSize: '20px', width: 'auto', maxWidth: '90vw' }}>
        Deseja mesmo eliminar o contato?
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
          <button 
            style={{ background: 'white', color: '#007AFF', padding: '10px 20px', borderRadius: '20px', whiteSpace: 'nowrap' }} 
            onClick={async () => {
              try {
                await deleteDoc(doc(db, "Proprietario", currentUser.uid, "Vizinhos", id));
                setVizinhos(vizinhos.filter((vizinho) => vizinho.id !== id));
                setTotalContacts(totalContacts - 1);
  
                console.log("Contato excluído com sucesso");
                toast.dismiss();
                toast.success("Contato removido"); // Use toast here
              } catch (error) {
                console.error("Erro ao excluir contato: ", error);
                toast.dismiss();
                toast.error("Erro ao remover contato"); // Use toast here
              }
            }}
          >
            Sim
          </button>
          <button 
            style={{ background: 'white', color: '#007AFF', padding: '10px 30px', borderRadius: '20px', whiteSpace: 'nowrap' }} 
            onClick={() => toast.dismiss()}
          >
            Cancelar
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        pauseOnHover: false,
      }
    );
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

  const handleReturn = () => {
    navigate(-1);
  };

  const handleImportClick = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xml';
  
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
  
      await processXMLFile(file);
    };
  
    fileInput.click();
  };
  
  const processXMLFile = async (file) => {
    const reader = new FileReader();
  
    reader.onload = async (event) => {
      try {
        console.log("Reading XML file...");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(event.target.result, "application/xml");
  
        const vizinhos = xmlDoc.getElementsByTagName('vizinho');
        const vizinhosData = [];
  
        Array.from(vizinhos).forEach((vizinhoElement) => {
          const vizinhoId = vizinhoElement.getElementsByTagName('id')[0]?.textContent || '';
          const vizinhoData = {
            id: vizinhoId,
            nome: vizinhoElement.getElementsByTagName('nome')[0]?.textContent || '',
            morada: vizinhoElement.getElementsByTagName('morada')[0]?.textContent || '',
            contacto: vizinhoElement.getElementsByTagName('contacto')[0]?.textContent || '',
            nota: vizinhoElement.getElementsByTagName('nota')[0]?.textContent || ''
          };
  
          vizinhosData.push(vizinhoData);
        });
  
        console.log("Parsed XML data:", vizinhosData);
        // Supondo que você tenha acesso ao ID do proprietário aqui, passe para a função de salvamento
        const proprietarioId = currentUser.uid;
        await saveDataToFirestore(proprietarioId, vizinhosData);
      } catch (error) {
        console.error('Erro ao processar o arquivo XML:', error);
      }
    };
  
    reader.onerror = () => {
      console.error('Erro ao ler o arquivo:', reader.error);
    };
  
    reader.readAsText(file);
  };
  
  const saveDataToFirestore = async (proprietarioId, vizinhosData) => {
    // Verifica se vizinhosData é um array
    if (!Array.isArray(vizinhosData)) {
      console.error('Erro: vizinhosData esperado como array, recebido:', vizinhosData);
      toast.error('Erro ao processar dados dos vizinhos.');
      return; // Sai da função se vizinhosData não for um array
    }
  
    const batch = writeBatch(db);
  
    try {
      vizinhosData.forEach((vizinho) => {
        // Caminho completo para o documento do vizinho no Firestore
        const vizinhoRef = doc(db, "Proprietario", currentUser.uid, "Vizinhos", vizinho.id);
        batch.set(vizinhoRef, {
          nome: vizinho.nome,
          morada: vizinho.morada,
          contacto: vizinho.contacto,
          nota: vizinho.nota
        });
      });
  
      await batch.commit();
      console.log('Vizinhos importados com sucesso!');
      toast.success('Vizinhos importados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados dos vizinhos no Firestore:', error);
      toast.error('Erro ao salvar dados dos vizinhos no Firestore.');
    }
  };
  
  
  const exportVizinhos = async () => {
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
  
    // Função para gerar o XML a partir dos dados
    const generateXML = (vizinhos) => {
      let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n<vizinhos>\n';
      vizinhos.forEach((vizinho) => {
        xmlString += `  <vizinho>\n`;
        xmlString += `    <id>${vizinho.id}</id>\n`;
        xmlString += `    <nome>${vizinho.nome}</nome>\n`;
        xmlString += `    <morada>${vizinho.morada}</morada>\n`;
        xmlString += `    <contacto>${vizinho.contacto}</contacto>\n`;
        xmlString += `    <nota>${vizinho.nota}</nota>\n`;
        xmlString += `  </vizinho>\n`;
      });
      xmlString += '</vizinhos>';
      return xmlString;
    };
  
    const xmlString = generateXML(vizinhosList);
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vizinhos.xml';
    a.click();
  };
  

  return (
    <div className="container">
      <br />
      <h1 className="header-title">Vizinhos</h1>
      <br />     
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Procurar vizinho por nome"
          onChange={handleSearchChange}
        />
      </Form.Group>
      <div className="row align-items-center text-center text-md-start">
  <div className="col-md-6 mb-3 mb-md-0">
    <h5 className="card-title d-inline-block">
      Lista de contactos{" "}
      <span className="text-muted fw-normal ms-2">
        ({totalContacts})
      </span>
    </h5>
    <Button className="add-button ms-md-2 mt-2 mt-md-0" onClick={handleAddUser}>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="bi bi-person-fill-add" viewBox="0 0 16 16">
        <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
        <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
      </svg>
    </Button>
  </div>
  <div className="col-md-6">
    <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-2">
      <button className="get-freguesia-btn atualizar-button" onClick={handleImportClick} style={{ marginLeft: '0px' }}>
        Importar
      </button>
      <button className="get-freguesia-btn atualizar-button" onClick={exportVizinhos} style={{ marginRight: '0px' }}>
        Exportar
      </button>
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
      <div className="d-flex justify-content-center"> {/* Center the button */}
      <Button className="return-button" onClick={handleReturn}>
       Voltar
      </Button>
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

export default Vizinhos;
