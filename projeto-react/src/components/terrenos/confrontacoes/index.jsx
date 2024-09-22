import React, { useState, useEffect } from "react";
import { db, auth } from "../../../firebase/firebase";
import { useAuth } from "../../../contexts/authContext";
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import TerrenoMap from "../terrenoMap";
import "./confrontacoes.css";

const Confrontações = () => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const { id } = useParams();
  const [values, setValues] = useState({});
  const [confrontacoes, setConfrontacoes] = useState([]);
  const [entidade, setEntidade] = useState({});
  const [selectedConfrontacao, setSelectedConfrontacao] = useState(null);
  const [vizinhos, setVizinhos] = useState([]);
  const [selectedVizinho, setSelectedVizinho] = useState(null);
  const [vizinhoNome, setVizinhoNome] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfrontacoes = async () => {
      const confrontacoesCollection = collection(
        db,
        "Terrenos",
        id,
        "Confrontacoes"
      );
      const confrontacoesSnapshot = await getDocs(confrontacoesCollection);
      const confrontacoesList = confrontacoesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          entidade: data.entidade,
          nome: data.nome,
          contacto: data.contacto,
          morada: data.morada,
          descricao: data.descricao,
          vizinhoId: data.vizinho,
        };
      });

      // Fetch vizinho data for 'Pessoa' entities
      for (const confrontacao of confrontacoesList) {
        if (confrontacao.entidade === "Pessoa" && confrontacao.vizinhoId) {
          try {
            const vizinhoDoc = doc(
              db,
              "Proprietario",
              currentUser.uid,
              "Vizinhos",
              confrontacao.vizinhoId
            );
            const vizinhoSnapshot = await getDoc(vizinhoDoc);
            if (vizinhoSnapshot.exists()) {
              const vizinhoData = vizinhoSnapshot.data();
              // Update the form fields with fetched vizinho data
              setValues((prevValues) => ({
                ...prevValues,
                [confrontacao.id]: {
                  ...prevValues[confrontacao.id],
                  nome: vizinhoData.nome || "",
                  contacto: vizinhoData.contacto || "",
                  morada: vizinhoData.morada || "",
                },
              }));
            }
          } catch (error) {
            console.error("Error fetching vizinho data:", error);
            toast.error("Erro ao obter os dados do vizinho");
          }
        }
      }

      // Create a new object to store the entidade, nome, contacto, morada, descricao and vizinho values
      const newValues = {};
      for (const confrontacao of confrontacoesList) {
        newValues[confrontacao.id] = {
          entidade: confrontacao.entidade,
          nome: confrontacao.nome,
          contacto: confrontacao.contacto,
          morada: confrontacao.morada,
          descricao: confrontacao.descricao,
          vizinhoId: confrontacao.vizinhoId,
        };
      }

      // Update the values state with the newValues object
      setValues(newValues);

      // Update the entidade state with the newEntidade object
      setEntidade((prevEntidade) => {
        const newEntidade = {};
        for (const confrontacao of confrontacoesList) {
          newEntidade[confrontacao.id] = confrontacao.entidade;
        }
        return newEntidade;
      });

      // Update the vizinhoNome state with the newVizinhoNome object
      setVizinhoNome((prevEntidade) => {
        const newNome = {};
        for (const confrontacao of confrontacoesList) {
          newNome[confrontacao.id] = confrontacao.entidade;
        }
        return newNome;
      });

      // Update the confrontacoes state
      setConfrontacoes(confrontacoesList);
    };

    fetchConfrontacoes();
  }, [db, id]);

  useEffect(() => {
    const fetchVizinhos = async () => {
      const proprietarioSnapshot = await getDocs(
        collection(db, "Proprietario")
      );
      proprietarioSnapshot.forEach(async (doc) => {
        const vizinhosCollectionRef = collection(
          db,
          "Proprietario",
          currentUser.uid,
          "Vizinhos"
        );
        const vizinhosSnapshot = await getDocs(vizinhosCollectionRef);

        const vizinhosData = [];
        vizinhosSnapshot.forEach((doc) => {
          vizinhosData.push({ id: doc.id, ...doc.data() });
        });

        setVizinhos(vizinhosData);
      });
    };

    fetchVizinhos();
  });

  const handleDescriptionChange = (id, event) => {
    const newDescription = event.target.value;
  
    // Update the confrontacoes state
    setConfrontacoes((prevConfrontacoes) =>
      prevConfrontacoes.map((confrontacao) =>
        confrontacao.id === id
          ? { ...confrontacao, descricao: newDescription }
          : confrontacao
      )
    );
  
    // Update the values state with the new description
    setValues((prevValues) => ({
      ...prevValues,
      [id]: {
        ...prevValues[id],
        descricao: newDescription,
      },
    }));
  };
  

  const handleEntidadeChange = (id, event) => {
    // Update the entidade state
    setEntidade((prevEntidade) => ({
      ...prevEntidade,
      [id]: event.target.value,
    }));

    if (event.target.value === "Pessoa") {
      toast.info("Selecionou 'Pessoa'. Por favor, escolha um vizinho da lista.");
    }
  };

  const handleVizinhoChange = (confrontacaoId, event) => {
    const vizinhoId = event.target.value;
    const selectedConfrontacao = confrontacoes.find(
      (confrontacao) => confrontacao.id === confrontacaoId
    );
    const updatedConfrontacao = {
      ...selectedConfrontacao,
      selectedVizinhoId: vizinhoId,
    };
    const updatedConfrontacoes = confrontacoes.map((confrontacao) =>
      confrontacao.id === confrontacaoId ? updatedConfrontacao : confrontacao
    );
    setSelectedVizinho(vizinhos.find((v) => v.id === vizinhoId));
    setConfrontacoes(updatedConfrontacoes);
  };

  const handleNameChange = async (id, event) => {
    // Update the values state
    setValues((prevValues) => ({
      ...prevValues,
      [id]: {
        ...prevValues[id],
        nome: event.target.value,
      },
    }));
  };

  const handleItemClick = (confrontacao) => {
    setSelectedConfrontacao(confrontacao);
  };

  const handleList = async () => {
    try {
      const selectedConfrontacaoId = selectedConfrontacao.id;
      const updatedValues = values[selectedConfrontacaoId] || {};
  
      // Construct the confrontacao data with the current values
      const confrontacaoData = {
        descricao: updatedValues.descricao || "",
        entidade: entidade[selectedConfrontacaoId] || "",
        nome: updatedValues.nome || "",
        contacto: selectedVizinho ? selectedVizinho.contacto || "" : "",
        morada: selectedVizinho ? selectedVizinho.morada || "" : "",
        vizinho: selectedVizinho ? selectedVizinho.id || null : selectedConfrontacao.vizinhoId || null,
      };
  
      // Update the confrontacao document in Firestore
      const confrontacaoDoc = doc(
        db,
        "Terrenos",
        id,
        "Confrontacoes",
        selectedConfrontacaoId
      );
  
      await updateDoc(confrontacaoDoc, confrontacaoData);
      window.location.reload();
      toast.success("Informações da confrontação guardadas com sucesso");
    } catch (error) {
      console.error("Error saving confrontação data:", error);
      toast.error("Erro ao guardar as informações da confrontação");
    } finally {
      setSelectedConfrontacao(null);
    }
  };
      
  const handleReturn = () => {
    navigate(`/terrenos/${id}/desenho`);
  };

  const handleVizinhos = () => {
    navigate(`/vizinhos`);
  };

  const handleReturnMenu = () => {
    setSelectedConfrontacao(null); 
  };

  return (
    <div>
      <br />
      <br />
      <h1 className="header-title">Confrontações</h1>
      <div className="content-wrapper">
        <div className="map-container">
        <h2 className="list-title">Mapa do Terreno</h2>
          <TerrenoMap
            id={id}
            width="100%"
            height="700px"
            selectedConfrontacao={selectedConfrontacao}
          />
        </div>
        <div className="markers-list">
          <h2 className="list-title">Lista de Confrontações</h2>
          <br />
          {confrontacoes.length === 0 ? (
            <div className="no-confrontacoes-message">
              <p className="no-confrontacoes-text">
                Não há confrontações disponíveis para este terreno. Complete o
                desenho do polígono.
              </p>
              <button
                className="no-confrontacoes-button"
                onClick={handleReturn}
              >
                Voltar
              </button>
            </div>
          ) : (
            <div className="markers-grid">
              {selectedConfrontacao ? (
                <div key={selectedConfrontacao.id} className="marker-item">
                  {/* Expanded details content */}
                  <h3 className="marker-name">{selectedConfrontacao.id}</h3>
                  <div className="expanded-details">
                    <div className="additional-info">
                      <label htmlFor="entidade">Entidade:</label>
                      <select
                        value={entidade[selectedConfrontacao.id] || ""}
                        onChange={(event) =>
                          handleEntidadeChange(selectedConfrontacao.id, event)
                        }
                        className="marker-entidade-select col-md-3"
                      >
                        <option value=""></option>
                        <option value="Pessoa"> Pessoa</option>
                        <option value="Rio"> Rio/Ribeiro</option>
                        <option value="Caminho"> Caminho/Estrada</option>
                        <option value="Outro"> Outro</option>
                      </select>
                      {entidade[selectedConfrontacao.id] === "Pessoa" && (
                        <>
                          <div className="vizinho-container">
                            <div className="vizinho-select-wrapper col-md-4">
                              <label htmlFor="vizinho">Vizinho:</label>
                              <select
                                className="vizinhos-select"
                                onChange={(event) =>
                                  handleVizinhoChange(
                                    selectedConfrontacao.id,
                                    event
                                  )
                                }
                              >
                                <option value="">Selecione um vizinho</option>
                                {vizinhos.map((vizinho) => (
                                  <option key={vizinho.id} value={vizinho.id}>
                                    {vizinho.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="button-wrapper col-md-6" >
                              <button
                                onClick={handleVizinhos}
                                className="add-vizinho-button"
                              >
                                Lista Vizinhos
                              </button>
                            </div>
                          </div>

                          <div className="vizinho-details">
                            <label htmlFor="nome">Nome:</label>
                            <input
                              type="text"
                              id="nome"
                              className="marker-nome conf-input"
                              value={
                                selectedVizinho
                                  ? selectedVizinho.nome
                                  : values[selectedConfrontacao.id]?.vizinhoId
                                  ? vizinhos.find(
                                      (v) =>
                                        v.id ===
                                        values[selectedConfrontacao.id]
                                          .vizinhoId
                                    )?.nome || ""
                                  : values[selectedConfrontacao.id]?.nome || ""
                              }
                              disabled
                            />

                            <label htmlFor="contacto">Contacto:</label>
                            <input
                              type="text"
                              id="contacto"
                              className="marker-contacto conf-input"
                              value={
                                selectedVizinho
                                  ? selectedVizinho.contacto
                                  : values[selectedConfrontacao.id]?.vizinhoId
                                  ? vizinhos.find(
                                      (v) =>
                                        v.id ===
                                        values[selectedConfrontacao.id]
                                          .vizinhoId
                                    )?.contacto || ""
                                  : values[selectedConfrontacao.id]?.contacto ||
                                    ""
                              }
                              disabled
                            />

                            <label htmlFor="morada">Morada:</label>
                            <input
                              type="text"
                              id="morada"
                              className="marker-morada conf-input"
                              value={
                                selectedVizinho
                                  ? selectedVizinho.morada
                                  : values[selectedConfrontacao.id]?.vizinhoId
                                  ? vizinhos.find(
                                      (v) =>
                                        v.id ===
                                        values[selectedConfrontacao.id]
                                          .vizinhoId
                                    )?.morada || ""
                                  : values[selectedConfrontacao.id]?.morada ||
                                    ""
                              }
                              disabled
                            />
                          </div>
                        </>
                      )}

                      {/* More conditional rendering based on selected entity */}
                      {["Rio", "Caminho", "Outro"].includes(
                        entidade[selectedConfrontacao.id]
                      ) && (
                        <>
                          <label htmlFor="nome">Nome:</label>
                          <input
                            type="text"
                            id="nome"
                            className="marker-nome conf-input"
                            value={values[selectedConfrontacao.id]?.nome || ""}
                            onChange={(event) =>
                              handleNameChange(selectedConfrontacao.id, event)
                            }
                          />
                        </>
                      )}

                      <label htmlFor="descricao">Descrição da Confrontação:</label>
                      <input
                        type="text"
                        id="descricao"
                        defaultValue={selectedConfrontacao.descricao}
                        onChange={(event) =>
                          handleDescriptionChange(
                            selectedConfrontacao.id,
                            event
                          )
                        }
                        className="marker-descricao conf-input"
                      />
                    </div>
                    <div className="button-container">
                      <button className="save-button" onClick={handleList}>
                        Guardar
                      </button>
                      <button className="return-button" onClick={handleReturnMenu}>
                        Voltar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Render the list of confrontacoes
                confrontacoes.map((confrontacao) => (
                  <div
                    key={confrontacao.id}
                    className="marker-item"
                    onClick={() => handleItemClick(confrontacao)}
                  >
                    <h3 className="marker-name">{confrontacao.id}</h3>
                    <p>
                      <strong>Entidade: </strong>{" "}
                      {entidade[confrontacao.id] || ""}
                    </p>
                    <br />
                    <p>
                      <strong>Nome: </strong>{" "}
                      {entidade[confrontacao.id] === "Pessoa" &&
                      values[confrontacao.id]?.vizinhoId ? (
                        <span>
                          {/* Fetch the nome from the Vizinho collection */}
                          {vizinhos.find(
                            (vizinho) =>
                              vizinho.id === values[confrontacao.id]?.vizinhoId
                          )?.nome || (
                            <span>Loading...</span> // Optionally show a loading message while fetching
                          )}
                        </span>
                      ) : (
                        (values[confrontacao.id] || {}).nome || ""
                      )}
                    </p>
                    <br />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <br />
      <div className="button-container">
        <button className="return-button" onClick={handleReturn}>
          Voltar
        </button>
      </div>
    </div>
  );
};

export default Confrontações;
