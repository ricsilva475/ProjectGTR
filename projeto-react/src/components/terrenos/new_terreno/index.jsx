import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/authContext";
import { db } from "../../../firebase/firebase";
import { collection, addDoc, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddTerreno.css";
import firebase from "firebase/compat/app";
import { QuestionCircleFill } from 'react-bootstrap-icons';
import { Modal } from 'react-bootstrap';

const AddTerreno = () => {
  const { currentUser } = useAuth();
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [codigoRegiao, setCodigoRegiao] = useState('');
  const navigate = useNavigate();
  const [showConfrontacoes, setShowConfrontacoes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [freguesia, setFreguesia] = useState('');
  const [inputValue, setInputValue] = useState('');
  
  const [terreno, setTerreno] = useState({
    nome: "",
    descricao: null,
    freguesia: "",
    localizacaoPredio: "",
    matriz: "",
    regiao: "",
    secao: "",
    confrontacao_norte: "",
    confrontacao_sul: "",
    confrontacao_nascente: "",
    confrontacao_poente: "",
});

  useEffect(() => {
    const getUser = async () => {
      const querySnapshot = await getDocs(collection(db, "Proprietario"));
      querySnapshot.forEach((doc) => {
        if (doc.data().email === currentUser.email) {
          setUser(doc.data());
          setUserId(doc.id);
        }
      });
    };
    getUser();
  }, [currentUser]);

    /*useEffect(() => {
    const checkUserContribuinte = async () => {
      // Busca no Firestore pelo documento do usuário atual
      const userRef = query(collection(db, "Proprietario"), where("email", "==", currentUser.email));
      const querySnapshot = await getDocs(userRef);
      if (!querySnapshot.empty) {
        // Extrai os dados do usuário
        const userData = querySnapshot.docs[0].data();
        setUser(userData);
        // Verifica se o campo 'contribuinte' está presente e não é nulo
        if (!userData.contribuinte) {
          // Exibe um toast de erro se não houver 'contribuinte'
          toast.error("Conta sem Contribuinte. Por favor, associe um contribuinte à sua conta.", {
           
            autoClose: false,
          });
        }
      }
    };
  
    checkUserContribuinte();
  }, [currentUser]); */

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTerreno({
      ...terreno,
      [name]: value,
    });
    if (name === 'regiao') {
      setCodigoRegiao(value);
    }
  };

  const handleChangeFreguesia = (value) => {
    setTerreno((prev) => ({ ...prev, freguesia: value }));
  };

  const handleInputChange = (value) => {
    setInputValue(value);
    if (!value) {
      setTerreno((prev) => ({ ...prev, freguesia: null }));
    }
  };

  const handleConfrontacoesChange = (event, direction) => {
    const { value } = event.target;
    const directionKey = `confrontacao_${direction}`; // Converte a direção para a chave correspondente
    setTerreno({
      ...terreno,
      [directionKey]: value, // Atualiza a propriedade correta baseada na direção
    });
  };

  const checkIfMatrizExists = async (matriz) => {
    try {
      const user = firebase.auth().currentUser;
      const terrenosCollection = collection(db, "Terrenos");
      const matrizQuery = query(terrenosCollection, where("matriz", "==", matriz), where("contribuinte", "==", user.contribuinte));
      const querySnapshot = await getDocs(matrizQuery);
      return querySnapshot.size > 0;
    } catch (error) {
      //console.error("Error checking if matriz exists: ", error);
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    // Verificar se a matriz tem 4 dígitos, não é 0000 e não é negativa
    if (terreno.matriz.length !== 4 || terreno.matriz === '0000' || isNaN(terreno.matriz) || terreno.matriz < 0) {
      toast.error("A matriz deve ser um número de 4 dígitos diferente de 0000");
      return;
    }
  
    try {
      const matrizExists = await checkIfMatrizExists(terreno.matriz);
      if (matrizExists) {
        toast.error("Já existe um terreno registrado com esta matriz!");
        return;
      }
    } catch (error) {
      //console.error("Error checking if matriz exists: ", error);
      toast.error("Erro ao verificar a existência da matriz. Tente novamente.");
      return;
    }
  
    // Verificar se todos os campos obrigatórios estão preenchidos
    const requiredFields = ['nome', 'freguesia', 'matriz'];
    for (let field of requiredFields) {
      if (!terreno[field]) {
        toast.info("Faltam preencher campos obrigatórios");
        return;
      }
    }
  
    try {
      
      const docRef = await addDoc(collection(db, "Terrenos"), {
        ...terreno,
        contribuinte: user.contribuinte,
      });
      //console.log("Document written with ID: ", docRef.id);
  
      navigate(`/terrenos/${docRef.id}/desenho/poligono`);
  
      // Resetar o estado do terreno para vazio, exceto freguesia
      setTerreno({
        nome: "",
        descricao: null,
        freguesia: "",
        localizacaoPredio: "",
        matriz: "",
        regiao: "",
        secao: "",
        confrontacao_norte: "",
        confrontacao_sul: "",
        confrontacao_nascente: "",
        confrontacao_poente: "",
    });
  
      toast.success("Terreno adicionado com sucesso");
    } catch (error) {
      //console.error("Error adding document: ", error);
      toast.error("Erro ao adicionar terreno. Tente novamente.");
    }
  };
  
 const getFreguesia = async (event) => {
    event.preventDefault()
    try {
      if (!codigoRegiao) {
        toast.error('Por favor, insira um código de região válido');
        return;
      }
  
      const docRef = doc(db, 'DICOFRE', codigoRegiao);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const dados = docSnap.data();
        const nomeFreguesia = dados.FREGUESIA;
        const nomeDistrito = dados.DISTRITO;
        const nomeCompleto = `${nomeFreguesia}, ${nomeDistrito}`;
        //console.log('Codigo:', codigoRegiao);
        //console.log('Freguesia:', nomeCompleto);
        terreno.freguesia = nomeCompleto;
        setFreguesia(nomeCompleto);
      } else {
        toast.error('Código de região inválido');
      }
    } catch (error) {
      //console.error('Erro ao buscar dados da freguesia:', error);
      toast.error('Erro ao buscar dados da freguesia');
    }
};


return (
  <form onSubmit={handleSubmit} className="add-terreno-form">
  <div className="form-group">
    <br />
    <br />
    <h1 className="form-header text-center">Inserir Terreno</h1>
    <br />
    <br />
    
    <div className="row">
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Nome do Terreno <span className="required">*</span></label>
          <input
            type="text"
            name="nome"
            value={terreno.nome}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Matriz <span className="required">*</span></label>
          <input
            type="text"
            name="matriz"
            value={terreno.matriz}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label d-flex justify-content-between align-items-center">
            Região
            <div>
              <span>Como preencher: </span>
              <button type="button" className="btn btn-link px-0 text-info" onClick={() => setShowHelp(true)}>
                <QuestionCircleFill style={{ fontSize: '1.5em' }} />
              </button>
              <Modal show={showHelp} onHide={() => setShowHelp(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Ajuda</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <img src="/Codigos.png" alt="Códigos"/> 
                </Modal.Body>
            </Modal>
            </div>
          </label>
          <input
            type="text"
            name="regiao"
            value={terreno.regiao}
            onChange={handleChange}
            className="form-input"
            placeholder="Exemplo: 100919"
          />
          <button className="get-freguesia-btn atualizar-button mt-2" onClick={getFreguesia} style={{ marginLeft: '0px' }}>
            Obter Freguesia
          </button>
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="form-group">
          <label className="form-label">Freguesia/Distrito <span className="required">*</span></label>
          <input
            type="text"
            name="freguesia"
            value={terreno.freguesia}
            onChange={handleChange}
            className="form-input"
            required
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
            value={terreno.localizacaoPredio}
            onChange={handleChange}
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
            value={terreno.secao}
            onChange={handleChange}
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
        value={terreno.descricao || ""}
        onChange={handleChange}
        className="form-input"
      />
    </div>

    <br />
    <div>
      <h3 
        onClick={() => setShowConfrontacoes(!showConfrontacoes)} 
        className="confrontacoes-header text-center"
      >
        Confrontações 
        <span className="confrontacoes-arrow"> ▼ </span> 
      </h3>
      <br />

      {showConfrontacoes && (
        <>
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label" style={{minWidth: '150px'}}>Norte</label>
                <input
                  type="text"
                  name="vizinho"
                  value={terreno.confrontacao_norte || ""}
                  onChange={(e) => handleConfrontacoesChange(e, "norte")}
                  className="form-input"
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label" style={{minWidth: '150px'}}>Sul</label>
                <input
                  type="text"
                  name="vizinho"
                  value={terreno.confrontacao_sul || ""}
                  onChange={(e) => handleConfrontacoesChange(e, "sul")}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label" style={{minWidth: '150px'}}>Nascente</label>
                <input
                  type="text"
                  name="vizinho"
                  value={terreno.confrontacao_nascente || ""}
                  onChange={(e) => handleConfrontacoesChange(e, "nascente")}
                  className="form-input"
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-group">
                <label className="form-label" style={{minWidth: '150px'}}>Poente</label>
                <input
                  type="text"
                  name="vizinho"
                  value={terreno.confrontacao_poente || ""}
                  onChange={(e) => handleConfrontacoesChange(e, "poente")}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
  <div className="row">
  <label className="form-label campos"><span className="required">*</span> Campos obrigatórios a preencher</label>
  </div>
  <div className="form-group d-flex justify-content-center">
    <button className="submit-btn seguinte-button" type="submit">
      SEGUINTE
    </button>
  </div>

</form>

);
};

export default AddTerreno;
