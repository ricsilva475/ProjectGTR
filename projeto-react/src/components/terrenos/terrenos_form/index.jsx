import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../../../firebase/firebase";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  writeBatch,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./terreno_form.css";

const TerrenoView = () => {
  const { id } = useParams();
  const [terreno, setTerreno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfrontacoes, setShowConfrontacoes] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTerreno = async () => {
      console.log(`Fetching terreno with ID: ${id}`);
      const startTime = new Date().getTime();

      try {
        const docRef = doc(db, "Terrenos", id.trim());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTerreno({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.log("Error fetching terreno:", error);
      } finally {
        const endTime = new Date().getTime();
        console.log(`Data fetched in ${endTime - startTime} ms`);
        setLoading(false);
      }
    };

    fetchTerreno();
  }, [id]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const keys = name.split(".");

    setTerreno((prevState) => {
      let newState = { ...prevState };
      let currentPart = newState;

      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          currentPart[keys[i]] = value;
        } else {
          currentPart[keys[i]] = { ...currentPart[keys[i]] };
          currentPart = currentPart[keys[i]];
        }
      }

      return newState;
    });
  };

  const handleUpdate = async () => {
    try {
      const docRef = doc(db, "Terrenos", id.trim());
      await updateDoc(docRef, terreno);
      console.log("Document updated successfully");
      toast.success("Informações atualizadas");
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Erro ao atualizar informações");
    }
  };

  const handleDelete = async () => {
    toast(
      <div
        style={{
          padding: "20px",
          fontSize: "20px",
          width: "auto",
          maxWidth: "90vw",
        }}
      >
        Deseja mesmo eliminar o terreno?
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
                const marcosCollectionRef = collection(
                  db,
                  "Terrenos",
                  id.trim(),
                  "Marcos"
                );
                const confrontacoesCollectionRef = collection(
                  db,
                  "Terrenos",
                  id.trim(),
                  "Confrontacoes"
                );
                const fotografiasCollectionRef = collection(
                  db,
                  "Terrenos",
                  id.trim(),
                  "Fotografias"
                );

                const marcosQuerySnapshot = await getDocs(marcosCollectionRef);
                const confrontacoesQuerySnapshot = await getDocs(
                  confrontacoesCollectionRef
                );
                const fotografiasQuerySnapshot = await getDocs(
                  fotografiasCollectionRef
                );

                const batch = writeBatch(db);
                marcosQuerySnapshot.forEach((doc) => {
                  batch.delete(doc.ref);
                });
                confrontacoesQuerySnapshot.forEach((doc) => {
                  batch.delete(doc.ref);
                });
                fotografiasQuerySnapshot.forEach((doc) => {
                  batch.delete(doc.ref);
                });
                await batch.commit();

                const docRef = doc(db, "Terrenos", id.trim());
                await deleteDoc(docRef);

                console.log("Document deleted successfully");
                toast.dismiss();
                toast.success("Terreno removido");
                setTimeout(() => {
                  navigate("/home");
                }, 1000);
              } catch (error) {
                console.error("Error deleting document: ", error);
                toast.dismiss();
                toast.error("Erro ao remover terreno");
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
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="add-terreno-form">
  <div className="form-group">
    <br />
    <br />
    <h1 className="form-header text-center">Informações do Terreno</h1>
    <br />
    <br />

    <div className="row">
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Nome do Terreno</label>
          <input
            type="text"
            name="nome"
            value={terreno?.nome || ""}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Matriz</label>
          <input
            type="text"
            name="matriz"
            value={terreno?.matriz || ""}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Região</label>
          <input
            type="text"
            name="regiao"
            value={terreno?.regiao || ""}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Freguesia/Distrito</label>
          <input
            type="text"
            name="freguesia"
            value={terreno?.freguesia || ""}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Localização do Prédio</label>
          <input
            type="text"
            name="localizacaoPredio"
            value={terreno?.localizacaoPredio || ""}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Secção</label>
          <input
            type="text"
            name="secao"
            value={terreno?.secao || ""}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
    </div>

    <div className="form-group mb-3">
      <label className="form-label">Descrição</label>
      <input
        type="text"
        name="descricao"
        value={terreno?.descricao || ""}
        onChange={handleInputChange}
        className="form-input"
      />
    </div>

    <br />
    <div>
          <h3
            onClick={() => setShowConfrontacoes(!showConfrontacoes)}
            className="confrontacoes-header text-center"
            style={{ marginLeft: "30px" }}
          >
            Confrontações
            
          </h3>
          <br/>
            <>
            <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label">Norte</label>
                <input
                  type="text"
                  name="confrontacao_norte"
                  value={terreno?.confrontacao_norte || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label">Sul</label>
                <input
                  type="text"
                  name="confrontacao_sul"
                  value={terreno?.confrontacao_sul || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label">Nascente</label>
                <input
                  type="text"
                  name="confrontacao_nascente"
                  value={terreno?.confrontacao_nascente || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label">Poente</label>
                <input
                  type="text"
                  name="confrontacao_poente"
                  value={terreno?.confrontacao_poente || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
            </>
          
        </div>
      </div>

      <br />
      <div className="form-actions">
        <div className="button-row">
          <button
            type="button"
            onClick={handleUpdate}
            className="atualizar-button"
          >
            Atualizar
          </button>
          
          <Link to={`/terrenos/${id}/desenho`} className="seguinte-button">Seguinte</Link>

          <button
            type="button"
            onClick={handleDelete}
            className="apagar-button"
          >
            Apagar
          </button>
        </div>
        
         <br/>
        <br/>
            
 
        
      </div>
    </form>
  );
};

export default TerrenoView;
