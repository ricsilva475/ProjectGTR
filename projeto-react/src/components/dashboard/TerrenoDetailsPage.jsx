import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { Row, Col } from "react-bootstrap";
import MarcosTable from "./tabelas/MarcosTable";
import ConfrontacoesTable from "./tabelas/ConfrontacoesTable";
import Mapa from "./Mapa.jsx";

const TerrenoDetailsPage = () => {
  const { terrenoId } = useParams();
  const [terrenoName, setTerrenoName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTerrenoName = async () => {
      try {
        const terrenoRef = doc(db, "Terrenos", terrenoId);
        const terrenoSnap = await getDoc(terrenoRef);
        if (terrenoSnap.exists()) {
          const terrenoData = terrenoSnap.data();
          setTerrenoName(terrenoData.nome); // Assuming "nome" is the field containing the name of the terreno
        }
      } catch (error) {
        console.error("Error fetching terreno name:", error);
      }
    };

    fetchTerrenoName();
  }, [terrenoId]);

  const handleReturn = () => {
    navigate(`/home`);
  };

  return (
    <div className="container">
      <h1 className="header-title">{terrenoName}</h1>
      
      <div className="map-container">
          <Mapa
            id={terrenoId}
          />
        </div>
      
      <Row>
        <Col md={6}>
          <MarcosTable terrenoId={terrenoId} />
        </Col>
        <Col md={6}>
          <ConfrontacoesTable terrenoId={terrenoId} />
        </Col>
      </Row>
      <div className="button-container">
        <br />
        <br />
        <br />
        <button className="return-button" onClick={handleReturn}>
          Voltar
        </button>
      </div>
    </div>
  );
};

export default TerrenoDetailsPage;
