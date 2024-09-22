import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form } from "react-bootstrap";
import { getAuth } from "firebase/auth";
import "../vizinhos/vizinhos.css";
import { TrashFill, PencilSquare, EyeFill } from "react-bootstrap-icons";

const TerrenosPage = () => {
  const [terrenos, setTerrenos] = useState([]);
  const [totalTerrenos, setTotalTerrenos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [filteredTerrenos, setFilteredTerrenos] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userId = user.uid;
        console.log("Fetching user data for user ID:", userId);
        const userDoc = doc(db, "Proprietario", userId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          setUserData(userSnapshot.data());
          console.log("User data:", userSnapshot.data());
          // Once userData is fetched, call fetchTerrenos
          fetchTerrenos(userSnapshot.data().contribuinte);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const fetchTerrenos = async (contribuinte) => {
    const terrenosCollection = collection(db, "Terrenos");
    const terrenosSnapshot = await getDocs(
      query(terrenosCollection, where("contribuinte", "==", contribuinte))
    );
    const terrenosList = await Promise.all(
      terrenosSnapshot.docs.map(async (doc) => {
        const terrenoData = doc.data();
        const terrenoId = doc.id;

        // Fetch Marcos collection for the current terreno
        const marcosCollection = collection(
          db,
          "Terrenos",
          terrenoId,
          "Marcos"
        );
        const marcosSnapshot = await getDocs(marcosCollection);
        const numMarcos = marcosSnapshot.docs.length;

        // Fetch Confrontacoes collection for the current terreno
        const confrontacoesCollection = collection(
          db,
          "Terrenos",
          terrenoId,
          "Confrontacoes"
        );
        const confrontacoesSnapshot = await getDocs(confrontacoesCollection);
        const numConfrontacoes = confrontacoesSnapshot.docs.length;

        return {
          ...terrenoData,
          id: terrenoId,
          numMarcos,
          numConfrontacoes,
        };
      })
    );

    setTerrenos(terrenosList);
  };

  useEffect(() => {
    // Calculate the total number of terrenos after filtering
    setTotalTerrenos(filteredTerrenos.length);
  }, [filteredTerrenos]);

  // Calculate the index of the last entry on the current page
  const indexOfLastEntry = currentPage * entriesPerPage;
  // Calculate the index of the first entry on the current page
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  // Get the current entries for the current page
  const currentEntries = terrenos.slice(indexOfFirstEntry, indexOfLastEntry);

  // Calculate the terreno with the largest and smallest area
  const terrenoWithLargestArea =
    terrenos.length > 0
      ? terrenos.reduce((prev, current) =>
          prev.area > current.area ? prev : current
        )
      : null;
  const terrenoWithSmallestArea =
    terrenos.length > 0
      ? terrenos.reduce((prev, current) =>
          prev.area < current.area ? prev : current
        )
      : null;

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredTerrenos = terrenos.filter((terreno) =>
      terreno.nome.toLowerCase().includes(searchTerm)
    );
    setFilteredTerrenos(filteredTerrenos);
  };

  useEffect(() => {
    // Initialize filteredTerrenos with all terrenos on component mount
    setFilteredTerrenos(terrenos);
  }, [terrenos]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "Terrenos", id));
      setTerrenos(terrenos.filter((terreno) => terreno.id !== id));
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  const handleRedirectToAddTerreno = () => {
    navigate("/terrenos");
  };

  const handleRedirectToTerrenoView = (terrenoId) => {
    navigate(`/terrenos/${terrenoId}`);
  };

  const handleViewDetails = (terrenoId) => {
    navigate(`/dashboard/terrenos/${terrenoId}`);
  };

  const handleSort = (key) => {
    setSortConfig((prevSortConfig) => {
      if (prevSortConfig.key === key) {
        if (prevSortConfig.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prevSortConfig.direction === "desc") {
          return { key: null, direction: "asc" };
        } else {
          return { key, direction: "asc" };
        }
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  const sortedTerrenos = React.useMemo(() => {
    if (sortConfig.key !== null) {
      const sortedData = [...filteredTerrenos].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
      return sortedData;
    }
    return filteredTerrenos;
  }, [filteredTerrenos, sortConfig]);

  return (
    <div className="container">
      <br />
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Procurar terreno por nome"
          onChange={handleSearchChange}
        />
      </Form.Group>
      <div className="row align-items-center">
        <div className="col-md-6">
          <div className="mb-3">
            <h5 className="card-title">
              Lista de terrenos{" "}
              <span className="text-muted fw-normal ms-2">
                ({totalTerrenos})
              </span>
            </h5>
          </div>
        </div>
        <div className="col-md-6">
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
            <div>
              <Button
                className="save-button"
                onClick={handleRedirectToAddTerreno}
              >
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
                    <th scope="col" onClick={() => handleSort("nome")}>
                      Nome{" "}
                      {sortConfig.key === "nome" &&
                        (sortConfig.direction === "asc"
                          ? "↑"
                          : sortConfig.direction === "desc"
                          ? "↓"
                          : "↕")}
                    </th>
                    <th scope="col" onClick={() => handleSort("area")}>
                      Area{" "}
                      {sortConfig.key === "area" &&
                        (sortConfig.direction === "asc"
                          ? "↑"
                          : sortConfig.direction === "desc"
                          ? "↓"
                          : "↕")}
                    </th>
                    <th scope="col" onClick={() => handleSort("freguesia")}>
                      Freguesia{" "}
                      {sortConfig.key === "freguesia" &&
                        (sortConfig.direction === "asc"
                          ? "↑"
                          : sortConfig.direction === "desc"
                          ? "↓"
                          : "↕")}
                    </th>
                    <th scope="col">Matriz</th>
                    <th scope="col">Marcos</th>
                    <th scope="col">Confrontacoes</th>
                    <th scope="col" style={{ width: "200px" }}>
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTerrenos.map((terreno) => (
                    <tr key={terreno.id}>
                      <td>{terreno.nome}</td>
                      <td>{terreno.area}</td>
                      <td>{terreno.freguesia}</td>
                      <td>{terreno.matriz}</td>
                      <td>{terreno.numMarcos}</td>
                      <td>{terreno.numConfrontacoes}</td>
                      <td>
                        <ul className="list-inline mb-0">
                          <li className="list-inline-item">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(terreno.id)}
                              className="btn btn-link px-2 text-info"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="View Details"
                            >
                              <EyeFill />
                            </button>
                          </li>
                          <li className="list-inline-item">
                            <button
                              type="button"
                              onClick={() =>
                                handleRedirectToTerrenoView(terreno.id)
                              }
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
                              onClick={() => handleDelete(terreno.id)}
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
              {Math.min(indexOfLastEntry, totalTerrenos)} de {totalTerrenos}{" "}
              terrenos
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
                length: Math.ceil(totalTerrenos / entriesPerPage),
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
                  currentPage === Math.ceil(totalTerrenos / entriesPerPage) &&
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
      <br />
      <br />
    </div>
  );
};

export default TerrenosPage;
