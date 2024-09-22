import React, { useState, useEffect, useRef } from "react";
import { db } from "../../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { collection, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router-dom";
import TerrenoMap from "../terrenoMap";
import { useNavigate } from "react-router-dom";
import Switch from "react-switch";
import "./terreno_view.css";
import { set } from "firebase/database";

const Desenho = () => {
  const { id } = useParams();
  const [terreno, setTerreno] = useState({ area: 0, perimetro: 0 });
  const [initialCenter, setInitialCenter] = useState({
    lat: 39.74362,
    lng: -8.80705,
  });
  const [markers, setMarkers] = useState([]);
  const [hasMarkers, setHasMarkers] = useState(false);
  const [showHectares, setShowHectares] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTerreno = async () => {
      try {
        const terrenoDoc = await getDoc(doc(db, "Terrenos", id));
        if (terrenoDoc.exists()) {
          const terrenoData = terrenoDoc.data();
          console.log("Fetched terreno data:", terrenoData);
          setTerreno(terrenoData);
          setMarkers(terrenoData.markers || []); // Set markers based on the data from terrenoDoc
          console.log("Markers:", setMarkers);
          setHasMarkers((terrenoData.markers || []).length > 0); // Update hasMarkers based on whether markers are present
        } else {
          console.log("Terreno not found");
        }
      } catch (error) {
        console.error("Error fetching terreno:", error);
        toast.error("Erro ao carregar o terreno");
      }
    };

    fetchTerreno();
  }, [id]);

  const handleDrawPolygon = async () => {
    try {
      const markersCollectionRef = collection(db, "Terrenos", id, "Marcos");
      const querySnapshot = await getDocs(markersCollectionRef);

      if (querySnapshot.empty) {
        // If there are no markers associated, directly navigate to drawing polygon
        navigate(`/terrenos/${id}/desenho/poligono`);
        setHasMarkers(true); // Set hasMarkers to true to indicate that markers are associated now
      } else {
        // If there are markers associated, show the confirmation message
        toast(
          <div
            style={{
              padding: "25px",
              fontSize: "20px",
              width: "auto",
              maxWidth: "90vw",
            }}
          >
            <div>
            <p>Deseja mesmo desenhar um novo polígono?</p>
            <p>Ao desenhar um novo polígono do terreno, vai acontecer o seguinte :</p>
            <p><strong>- Vai apagar o polígono antigo</strong></p>
            <p><strong>- Vai apagar as informações dos marcos e confrontações</strong></p>
            
          </div>
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                marginTop: "20px",
              }}
            >
              <button
                style={{
                  background: "white",
                  color: "#007AFF",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
                onClick={async () => {
                  try {
                    // Verifique se db, id e navigate estão definidos
                    if (!db || !id || !navigate) {
                      throw new Error("db, id or navigate is undefined");
                    }

                    // Obtenha uma referência para a coleção de marcadores
                    const markersDocumentRef = collection(
                      db,
                      "Terrenos",
                      id,
                      "Marcos"
                    );

                    // Obtenha todos os documentos na coleção
                    const querySnapshot = await getDocs(markersDocumentRef);

                    // Exclua cada documento
                    const batch = writeBatch(db);
                    querySnapshot.forEach((doc) => {
                      batch.delete(doc.ref);
                    });
                    await batch.commit();

                    // Obtenha uma referência para a coleção de confrontações
                    const confrontacoesDocumentRef = collection(
                      db,
                      "Terrenos",
                      id,
                      "Confrontacoes"
                    );

                    // Obtenha todos os documentos na coleção
                    const confrontacoesQuerySnapshot = await getDocs(
                      confrontacoesDocumentRef
                    );

                    // Exclua cada documento
                    const confrontacoesBatch = writeBatch(db);
                    confrontacoesQuerySnapshot.forEach((doc) => {
                      confrontacoesBatch.delete(doc.ref);
                    });
                    await confrontacoesBatch.commit();

                    // Obtenha uma referência para o documento do terreno
                    const terrenoRef = doc(db, "Terrenos", id);

                    // Redefina o campo da área
                    await updateDoc(terrenoRef, {
                      area: null,
                      perimetro: null,
                    });

                    toast.dismiss();

                    setTimeout(() => {
                      navigate(`/terrenos/${id}/desenho/poligono`);
                    }, 1000);
                  } catch (error) {
                    console.error("Error drawing polygon: ", error);
                    toast.dismiss();
                    toast.error("Erro ao desenhar polígono"); // Use toast here
                  }
                }}
              >
                Sim
              </button>
              <button
                style={{
                  background: "white",
                  color: "#007AFF",
                  padding: "10px 30px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
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
          }
        );
      }
    } catch (error) {
      console.error("Error checking markers:", error);
      toast.error("Erro ao verificar os marcos");
    }
  };

  return (
    <div>
      <br />
      <br />
      <h1 style={{ fontSize: "2.3em", textAlign: "center", marginTop: "30px" }}>
        Desenho do Terreno
      </h1>
      <br />
      <div className="link-button-container">
        <button className="link-button" onClick={handleDrawPolygon}>
          Desenhar
        </button>
        <Link to={`/terrenos/${id}/desenho/marcos`} className="link-button">
          Marcos
        </Link>
        <Link
          to={`/terrenos/${id}/desenho/confrontações`}
          className="link-button"
        >
          Confrontações
        </Link>
        <Link to={`/terrenos/${id}/fotos`} className="link-button">
          Multimedia
        </Link>
      </div>

      <TerrenoMap id={id} onAreaPerimeterChange={setTerreno} />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "25px",
          backgroundColor: "#f2f2f2",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        
        <div className="label-input-container ">
          <label>Área(Metros):</label>
          <input type="text" className="filter-input" value={`${terreno?.area || 0} m²`} readOnly />
        </div>
        <div className="label-input-container">
          <label>Área(Hectares):</label>
          <input
            type="text" className="filter-input"
            value={((terreno?.area || 0) / 10000).toFixed(2) + " ha"} 
            readOnly
          />
        </div>

        <div className="label-input-container">
          <label>Perímetro:</label>
          <input
            type="text" className="filter-input"
            value={terreno?.perimetro ? `${terreno.perimetro} m` : "0 m"}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default Desenho;
