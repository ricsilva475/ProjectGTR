import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/authContext";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  setDoc,
  query,
  where,
  doc,
  deleteDoc,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import "./home.css";
import AppsIcon from "@mui/icons-material/Apps";
import ListIcon from "@mui/icons-material/List";
import {
  TrashFill,
  PencilSquare,
  EyeFill,
  CheckSquare,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { GeoPoint } from "firebase/firestore";

const Home = () => {
  const { currentUser } = useAuth();
  const [terrenos, setTerrenos] = useState([]);
  const [user, setUser] = useState({});
  const [numTerrenos, setNumTerrenos] = useState(0);
  const [userFields, setUserFields] = useState([]);
  const [view, setView] = useState("mosaic");
  const [filter, setFilter] = useState({
    nome: "",
    area: "",
    freguesia: "",
    confrontacoes: "",
  });
  const [totalArea, setTotalArea] = useState(0);
  const [filteredTerrenos, setFilteredTerrenos] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [totalTerrenos, setTotalTerrenos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const [checkedTerrenos, setCheckedTerrenos] = useState({});
  const [userId, setUserId] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndFields = async () => {
      const querySnapshot = await getDocs(collection(db, "Proprietario"));
      querySnapshot.forEach(async (doc) => {
        if (doc.data().email === currentUser.email) {
          setUser(doc.data());
  
          // Fetch the number of terrenos for the user
          const terrenosSnapshot = await getDocs(
            query(
              collection(db, "Terrenos"),
              where("contribuinte", "==", doc.data().contribuinte)
            )
          );
          setNumTerrenos(terrenosSnapshot.size);
  
          // Fetch the user terrenos
          if (doc.data().contribuinte) {
            const fieldsQuery = query(
              collection(db, "Terrenos"),
              where("contribuinte", "==", doc.data().contribuinte)
            );
            const fieldsSnapshot = await getDocs(fieldsQuery);
            const fieldsData = fieldsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setUserFields(fieldsData);
  
            // Calculate the total area
            const totalArea = fieldsData.reduce(
              (sum, field) => sum + (field.area || 0),
              0
            );
            setTotalArea(totalArea);
  
            const terrenosList = await Promise.all(
              terrenosSnapshot.docs.map(async (doc) => {
                const terrenoData = doc.data();
                const terrenoId = doc.id;
  
                return {
                  ...terrenoData,
                  id: terrenoId,
                };
              })
            );
  
            // Set the fetched terrenosList to the state
            setTerrenos(terrenosList);
          }
        }
      });
    };
  
    getUserAndFields();
  }, [currentUser]);

  useEffect(() => {
    const filteredFields = userFields.filter((field) => {
      let minArea = -Infinity;
      let maxArea = Infinity;

      if (filter.area) {
        const areaFilter = filter.area.split("-");

        if (areaFilter.length === 2) {
          minArea = Number(areaFilter[0]);
          maxArea = Number(areaFilter[1]);
        } else if (filter.area === "2000+") {
          minArea = 2000;
          maxArea = Infinity;
        }
      }

      return (
        (field.nome ? field.nome.toLowerCase().includes(filter.nome.toLowerCase()) : true) &&
        (field.area !== undefined
          ? field.area >= minArea && field.area <= maxArea
          : filter.area === "") &&
        (field.freguesia
          ? String(field.freguesia).includes(filter.freguesia)
          : true) &&
        (field.confrontacoes
          ? JSON.stringify(field.confrontacoes).includes(filter.confrontacoes)
          : true)
      );
    });

    setFilteredTerrenos(filteredFields);
  }, [filter, userFields]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilter((prevFilter) => ({ ...prevFilter, [name]: value }));
  };

  const handleCheck = (id) => {
    setCheckedTerrenos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
  
  const fetchConfrontacoes = async (terrenoId) => {
    const confrontacoesCollection = collection(db, "Terrenos", terrenoId, "Confrontacoes");
    const confrontacoesSnapshot = await getDocs(confrontacoesCollection);
    return confrontacoesSnapshot.docs.map((doc) => ({
      id: doc.id,
      entidade: doc.data().entidade,
      tipo: doc.data().tipo,
      descricao: doc.data().descricao,
      marcos: doc.data().marcos || [], // assume marcos array exists in confrontacao
    }));
  };
  
  const fetchMarkers = async (terrenoId) => {
    const markersCollectionRef = collection(db, "Terrenos", terrenoId, "Marcos");
    const querySnapshot = await getDocs(markersCollectionRef);
    return querySnapshot.docs.map((doc, index) => ({
      id: doc.id,
      nome: doc.data().nome,
      tipo: doc.data().tipo,
      descricao: doc.data().descricao,
      coordinates: doc.data().point || {},
      index: `M${String(index).padStart(2, '0')}`, // generate index for ID
    }));
  };

  const fetchVizinhos = async (ProprietarioId) => {
    const vizinhosCollection = collection(db, "Proprietario", ProprietarioId, "Vizinhos");
    const vizinhosSnapshot = await getDocs(vizinhosCollection);
    return vizinhosSnapshot.docs.map((doc) => ({
      id: doc.id,
      nome: doc.data().nome,
      confrontacoes: doc.data().confrontacoes,
    }));
  };
  
  useEffect(() => {
    const fetchTerrenos = async () => {
      try {
        const terrenosCollection = collection(db, "Terrenos");
        const terrenosSnapshot = await getDocs(terrenosCollection);
        const terrenosList = terrenosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Fetch confrontacoes and marcos for each terreno of the logged-in user
        const terrenosWithDetails = await Promise.all(
          terrenosList.map(async (terreno) => {
            const terrenoId = terreno.id;
            // Assuming currentUser has information like email or contribuinte
            const currentUserInfo = currentUser; // Replace with actual user info
            const terrenoConfrontacoes = await fetchConfrontacoes(terrenoId, currentUserInfo.contribuinte);
            const terrenoMarcos = await fetchMarkers(terrenoId, currentUserInfo.contribuinte);
            const terrenoVizinhos = await fetchVizinhos(terrenoId, currentUserInfo.contribuinte);
            return {
              ...terreno,
              confrontacoes: terrenoConfrontacoes,
              marcos: terrenoMarcos,
              vizinhos: terrenoVizinhos,
            };
          })
        );
  
        setTerrenos(terrenosWithDetails);
      } catch (error) {
        //console.error('Erro ao buscar terrenos:', error);
        // Tratar o erro conforme necessário
      }
    };
  
    fetchTerrenos();
  }, [currentUser]);
  
  const handleImportClick = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .xml';
  
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
  
      const validFileTypes = ['application/xml', 'text/xml'];
      if (!validFileTypes.includes(file.type)) {
        toast.error('Por favor, selecione um ficheiro do tipo .xml');
        return;
      }
  
      if (file.type === 'application/xml' || file.type === 'text/xml') {
        await processXMLFile(file);
      }
    };
  
    fileInput.click();
  };
  
  const processXMLFile = async (file) => {
    const reader = new FileReader();
  
    reader.onload = async (event) => {
      //console.log("Reading XML file...");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(event.target.result, "application/xml");
  
      const terrenos = xmlDoc.getElementsByTagName('terreno');
      const terrenosData = [];
      const marcosData = [];
      const confrontacoesData = [];
  
      for (let i = 0; i < terrenos.length; i++) {
        //console.log("Processing terreno", i + 1)
        const terreno = terrenos[i];
        const terrenoId = terreno.getAttribute('number');
        const terrenoData = {
          regiao: terreno.getElementsByTagName('regiao')[0]?.textContent || '',
          secao: terreno.getElementsByTagName('secao')[0]?.textContent || '',
          area: Number(terreno.getElementsByTagName('area')[0]?.textContent) || 0,
          nome: terreno.getElementsByTagName('nome')[0]?.textContent || '',
          matriz: terreno.getElementsByTagName('matriz')[0]?.textContent || '',
          center: new GeoPoint(
            parseFloat(terreno.getElementsByTagName('latitude')[0]?.textContent) || 0,
            parseFloat(terreno.getElementsByTagName('longitude')[0]?.textContent) || 0
          ),
          contribuinte: terreno.getElementsByTagName('contribuinte')[0]?.textContent || '',
          freguesia: terreno.getElementsByTagName('freguesia')[0]?.textContent || '',
          localizacaoPredio: terreno.getElementsByTagName('localizacaoPredio')[0]?.textContent || '',
          perimetro: terreno.getElementsByTagName('perimetro')[0]?.textContent || '',
          descricao: terreno.getElementsByTagName('descricao')[0]?.textContent || ''
        };
  
        // Processar confrontações norte, sul, nascente, poente
        const confrontacoes2 = terreno.getElementsByTagName('confrontacoes')[0];
        const confrontacaoNorte = confrontacoes2.getElementsByTagName('norte')[0]?.textContent || '';
        const confrontacaoSul = confrontacoes2.getElementsByTagName('sul')[0]?.textContent || '';
        const confrontacaoNascente = confrontacoes2.getElementsByTagName('nascente')[0]?.textContent || '';
        const confrontacaoPoente = confrontacoes2.getElementsByTagName('poente')[0]?.textContent || '';
        terrenoData.confrontacao_norte = confrontacaoNorte;
        terrenoData.confrontacao_sul = confrontacaoSul;
        terrenoData.confrontacao_nascente = confrontacaoNascente;
        terrenoData.confrontacao_poente = confrontacaoPoente;
  
        const marcos = terreno.getElementsByTagName('marco');
        for (let j = 0; j < marcos.length; j++) {
          //console.log("Processing marco", j + 1);
          const marco = marcos[j];
          const marcoData = {
            id: `${terrenoId}-marco-${marco.getAttribute('id')}`,
            tipo: marco.getElementsByTagName('tipo')[0]?.textContent || '',
            descricao: marco.getElementsByTagName('descricao')[0]?.textContent || '',
            coordinates: new GeoPoint(
              parseFloat(marco.getElementsByTagName('latitude')[0]?.textContent) || 0,
              parseFloat(marco.getElementsByTagName('longitude')[0]?.textContent) || 0
            )
          };
          marcosData.push(marcoData);
        }
  
        const confrontacoes = terreno.getElementsByTagName('confrontacao');
        for (let k = 0; k < confrontacoes.length; k++) {
          //console.log("Processing confrontacao", k + 1);
          const confrontacao = confrontacoes[k];
          const confrontacaoData = {
            id: confrontacao.getAttribute('id'),
            entidade: confrontacao.getElementsByTagName('entidade')[0]?.textContent || '',
            nome: confrontacao.getElementsByTagName('nome')[0]?.textContent || '',
            descricao: confrontacao.getElementsByTagName('descricao')[0]?.textContent || ''
          };
          confrontacoesData.push(confrontacaoData);
        }
  
        // Push terrenoData only once per terreno
        terrenosData.push(terrenoData);
      }
  
      //console.log("Parsed XML data:", { terrenosData, marcosData, confrontacoesData });
      await saveDataToFirestore(terrenosData, marcosData, confrontacoesData);
    };
  
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };
  
    reader.readAsText(file);
  };
  

  const saveDataToFirestore = async (terrenosData, marcosData, confrontacoesData) => {
    try {
      for (const [index, terreno] of terrenosData.entries()) {
        const terrenoId = Math.random().toString(36).substring(2, 15);
        const terrenoRef = await setDoc(doc(db, "Terrenos", terrenoId), terreno);
  
        const filteredMarcos = marcosData.filter(marco => marco.terrenoId === terreno.id);
        for (const [marcoIndex, marco] of filteredMarcos.entries()) {
          const marcoId = `M${String(marcoIndex).padStart(2, "0")}`;
          await setDoc(doc(db, "Terrenos", terrenoId, "Marcos", marcoId), {
            point: marco.coordinates,
            descricao: marco.descricao,
            tipo: marco.tipo
          });
        }
  
        const filteredConfrontacoes = confrontacoesData.filter(confrontacao => confrontacao.terrenoId === terreno.id);
        for (const confrontacao of filteredConfrontacoes) {
          await setDoc(doc(db, "Terrenos", terrenoId, "Confrontacoes", confrontacao.id), confrontacao);
        }
        toast.success('Dados importados com sucesso');
        window.location.reload();
      }
    } catch (error) {
      //console.error('Erro ao salvar dados no banco de dados:', error);
      throw error; // Rethrow the error to be caught in the calling function
    }
  };
  
  const handleExportClick = async () => {
    const terrenos = sortedTerrenos; // Supondo que sortedTerrenos contém todos os terrenos carregados
    const selectedTerrenos = Object.keys(checkedTerrenos).length ? terrenos.filter(terreno => checkedTerrenos[terreno.id]) : terrenos;

    toast(
      <div style={{ padding: '20px', fontSize: '20px', width: '100%', maxWidth: '1000px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); toast.dismiss(); }} 
          style={{ 
            position: 'absolute', 
            top: 4, 
            right: 13, 
            fontSize: '1.2em', 
            backgroundColor: 'transparent', 
            border: 'none', 
            color: 'black' 
          }}
        >
          &#x2715;
        </button>
        <div style={{ fontWeight: 'bold', marginBottom: '20px', marginLeft: '-25px' }}>Formatos do Ficheiro</div>
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button 
              style={{ background: 'white', color: '#007AFF', padding: '10px 20px', borderRadius: '20px', whiteSpace: 'nowrap', marginLeft: '-15px' }} 
              onClick={() => exportAsXML(selectedTerrenos)}
            >
              XML
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button 
              style={{ background: 'white', color: '#007AFF', padding: '10px 20px', borderRadius: '20px', whiteSpace: 'nowrap', marginLeft: '-15px' }} 
              onClick={() => exportAsCSV(selectedTerrenos)}
            >
              CSV
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button 
              style={{ background: 'white', color: '#007AFF', padding: '10px 20px', borderRadius: '20px', whiteSpace: 'nowrap', marginLeft: '-15px' }} 
              onClick={() => exportAsPDF(selectedTerrenos)}
            >
              PDF
            </button>
          </div>
        </div>
      </div>,
      {
        position: 'center',
        position: 'top-center',
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        duration: 15000,
        draggable: false,
        closeButton: false,
        onClose: () => console.log('Toast fechado manualmente'),
      }
    );
  };

  const exportAsXML = async () => {
    // Filtra os terrenos selecionados
    const selectedTerrenos = terrenos.filter((terreno) => checkedTerrenos[terreno.id]);
    
    // Se nenhum terreno estiver selecionado, exporta todos os terrenos do usuário
    const terrenosParaExportar = selectedTerrenos.length > 0 ? selectedTerrenos : terrenos;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<terrenos>\n';
    
    // Para cada terreno no array terrenosParaExportar
    for (let index = 0; index < terrenosParaExportar.length; index++) {
      const terreno = terrenosParaExportar[index];
    
      xml += `  <terreno number="${index + 1}">\n`;

      // Confrontações Classic
      
      xml += `    <confrontacoes>\n`;
      xml += `      <norte>${terreno.confrontacao_norte || ''}</norte>\n`;
      xml += `      <sul>${terreno.confrontacao_sul || ''}</sul>\n`;
      xml += `      <nascente>${terreno.confrontacao_nascente || ''}</nascente>\n`;
      xml += `      <poente>${terreno.confrontacao_poente || ''}</poente>\n`;
      xml += `    </confrontacoes>\n`;
  
    
      for (let key in terreno) {
        if (terreno[key] !== null && terreno[key] !== undefined) {
          if (key === 'center') {
            xml += `    <${key}>\n`;
            xml += `      <latitude>${terreno[key].latitude || ''}</latitude>\n`;
            xml += `      <longitude>${terreno[key].longitude || ''}</longitude>\n`;
            xml += `    </${key}>\n`;
          } else if (key === 'confrontacoes' && Array.isArray(terreno[key])) {
            xml += `    <${key}>\n`;
            // Loop através das confrontações
            for (let confrontacao of terreno[key]) {
              // Verifica se a confrontação tem um ID definido
              if (confrontacao.id) {
                // Busca o nome do vizinho usando fetchConfrontacoes
                const detalhesConfrontacao = await fetchConfrontacoes(confrontacao.id);
                const nome = detalhesConfrontacao.nomeVizinho; // Ajuste conforme a estrutura retornada por fetchConfrontacoes
                xml += `      <confrontacao id="${confrontacao.id}">\n`;
                xml += `        <entidade>${confrontacao.entidade || ''}</entidade>\n`;
                // Verifica o tipo da entidade para decidir qual nome usar
                if (confrontacao.entidade === 'pessoa') {
                  xml += `        <nomeVizinho>${nome || ''}</nomeVizinho>\n`;
                } else {
                  xml += `        <nome>${confrontacao.nome || ''}</nome>\n`;
                }             
                xml += `        <descricao>${confrontacao.descricao || ''}</descricao>\n`;
                xml += `      </confrontacao>\n`;
              }
            }
            xml += `    </${key}>\n`;
          } else if (key === 'marcos' && Array.isArray(terreno[key])) {
            xml += `    <${key}>\n`;
            // Loop através dos marcos
            for (let marco of terreno[key]) {
              xml += `      <marco id="${marco.index}">\n`;
              xml += `        <tipo>${marco.tipo || ''}</tipo>\n`;
              xml += `        <descricao>${marco.descricao || ''}</descricao>\n`;
              xml += `        <coordinates>\n`;
              xml += `          <latitude>${marco.coordinates.latitude || ''}</latitude>\n`;
              xml += `          <longitude>${marco.coordinates.longitude || ''}</longitude>\n`;
              xml += `        </coordinates>\n`;
              xml += `      </marco>\n`;
            }
            xml += `    </${key}>\n`;
          } else if (key !== 'id') { // Ignora o id do terreno
            xml += `    <${key}>${terreno[key]}</${key}>\n`;
          }
        }
      }
    
      xml += `  </terreno>\n`;
    }
    
    xml += '</terrenos>';
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'terrenos.xml';
    link.click();
    URL.revokeObjectURL(href);
  };
  
  
  const exportAsCSV = async () => {
    // Filtra os terrenos selecionados
    const selectedTerrenos = terrenos.filter((terreno) => checkedTerrenos[terreno.id]);
    
    // Se nenhum terreno estiver selecionado, exporta todos os terrenos do usuário
    const terrenosParaExportar = selectedTerrenos.length > 0 ? selectedTerrenos : terrenos;
  
    // Cabeçalho do CSV
    let csv = 'id,center_latitude,center_longitude,confrontacoes_norte,confrontacoes_sul,confrontacoes_nascente,confrontacoes_poente,confrontacoes_id,confrontacoes_entidade,confrontacoes_nome,confrontacoes_descricao,marcos_id,marcos_tipo,marcos_descricao,marcos_latitude,marcos_longitude';
    
    // Adiciona todas as chaves de terreno que não são 'center' ou 'confrontacoes'
    for (let key in terrenosParaExportar[0]) {
      if (key !== 'center' && key !== 'confrontacoes' && key !== 'marcos') {
        csv += `,${key}`;
      }
    }
    // Adiciona as chaves para confrontacoes e marcos
    csv += `,confrontacoes_id,confrontacoes_entidade,confrontacoes_nome,confrontacoes_descricao`;
    csv += `,marcos_id,marcos_tipo,marcos_descricao,marcos_latitude,marcos_longitude`;
    
    csv += '\n';
  
    // Loop através de cada terreno
    for (let terreno of terrenosParaExportar) {
      csv += `${terreno.id},`; // ID do terreno
  
      // Informações de 'center' (latitude e longitude)
      csv += `${terreno.center?.latitude || ''},${terreno.center?.longitude || ''},`;
  
      // Informações de 'confrontacoes' (norte, sul, nascente, poente)
      csv += `${terreno.confrontacoes?.norte || ''},${terreno.confrontacoes?.sul || ''},`;
      csv += `${terreno.confrontacoes?.nascente || ''},${terreno.confrontacoes?.poente || ''}`;
  
      // Loop através de todas as chaves de terreno
      for (let key in terreno) {
        // Ignora 'center' e 'confrontacoes'
        if (key !== 'center' && key !== 'confrontacoes' && key !== 'marcos') {
          // Adiciona o valor da chave ao CSV, tratando valores indefinidos
          csv += `,${terreno[key] !== undefined ? terreno[key] : ''}`;
        }
      }
  
      // Informações de 'confrontacoes'
      if (terreno.confrontacoes && Array.isArray(terreno.confrontacoes)) {
        for (let confrontacao of terreno.confrontacoes) {
          if (confrontacao.id) {
            const detalhesConfrontacao = await fetchConfrontacoes(confrontacao.id);
            const nome = detalhesConfrontacao.nomeVizinho; // Ajuste conforme a estrutura retornada por fetchConfrontacoes
            csv += `,${confrontacao.id || ''},${confrontacao.entidade || ''},${nome || confrontacao.nome || ''},${confrontacao.descricao || ''}`;
          }
        }
      }
  
      // Informações de 'marcos'
      if (terreno.marcos && Array.isArray(terreno.marcos)) {
        for (let marco of terreno.marcos) {
          csv += `,${marco.index || ''},${marco.tipo || ''},${marco.descricao || ''},${marco.coordinates?.latitude || ''},${marco.coordinates?.longitude || ''}`;
        }
      }
  
      csv += '\n'; // Nova linha para o próximo terreno
    }
  
    // Criação do blob e download do arquivo CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'terrenos.csv';
    link.click();
    URL.revokeObjectURL(href);
  };
  
  const exportAsPDF = (terrenos) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const img = new Image();
    img.src = 'logotipo.jpg';
  
    terrenos.forEach((terreno, index) => {
      if (index > 0) {
        doc.addPage();
      }
  
      doc.setFontSize(14); // Ajuste o tamanho da fonte para o título
      doc.setTextColor(0, 0, 0); // Definir a cor do texto para preto
      const pageWidth = doc.internal.pageSize.getWidth();
      const title = 'GTR - Gestão Terrenos Rústicos';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, pageWidth - 15, 20, { align: 'right' }); // Mover o título para o canto superior direito
  
      // Desenhar uma linha logo abaixo do texto para sublinhá-lo
      const underlineY = 25; // Ajuste este valor conforme necessário para mover a linha para cima ou para baixo
      doc.line(pageWidth - 15 - titleWidth, underlineY, pageWidth - 15, underlineY);
      doc.addImage(img, 7, 10, 60, 37); // Mover a imagem para alinhar com a tabela
  
      doc.setFontSize(20);
      const text = `Terreno ${index + 1}`;
      const textSize = doc.getTextWidth(text);
      const x = (pageWidth - textSize) / 2;
      doc.text(text, x, 50); // Mover o texto "Terreno" para cima da tabela
  
      const rows = [];
  
      // Função auxiliar para converter a primeira letra para maiúscula
      const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
  
      // Objeto de mapeamento para chaves personalizadas
      const keyMapping = {
        area: 'Área',
        regiao: 'Região',
        perimetro: 'Perímetro',
        secao: 'Secção',
        nome: 'Nome do Terreno',
        localizacaoPredio: 'Localização Prédio',
        descricao: 'Descrição',
        confrontacao_norte: 'Confrontação - Norte',
        confrontacao_sul: 'Confrontação - Sul',
        confrontacao_nascente: 'Confrontação - Nascente',
        confrontacao_poente: 'Confrontação - Poente',
      };
  
      for (let key in terreno) {
        if (terreno[key] !== null && terreno[key] !== undefined && key !== 'id') { 
          let value = terreno[key];
          if (key === 'area') {
            value = `${value} m²`;
          } else if (key === 'perimetro') {
            value = `${value} m`;
          }
  
          if (key === 'center') {
            rows.push(['Centro do Terreno (latitude)', terreno[key].latitude || '']);
            rows.push(['Centro do Terreno (longitude)', terreno[key].longitude || '']);
          } else if (key === 'confrontacoes') {
            rows.push(['Confrontação - Norte', terreno[key].norte || '']);
            rows.push(['Confrontação - Sul', terreno[key].sul || '']);
            rows.push(['Confrontação - Nascente', terreno[key].nascente || '']);
            rows.push(['Confrontação - Poente', terreno[key].poente || '']);
          } else {
            // Use o objeto de mapeamento para obter a string de exibição personalizada, se houver
            const displayKey = keyMapping[key] || capitalizeFirstLetter(key);
            rows.push([displayKey, value]);
          }
        }
      }
  
      // Sort the rows alphabetically by the first column
      rows.sort((a, b) => a[0].localeCompare(b[0]));
  
      doc.autoTable({
        startY: 60,
        head: [['Campos', 'Valores']],
        body: rows,
      });
    });
  
    // Download the PDF document
    doc.save('terrenos.pdf');
  }
  
  const handleRedirectToTerrenoView = (terrenoId) => {
    navigate(`/terrenos/${terrenoId}`);
  };

  const handleViewDetails = (terrenoId) => {
    navigate(`/dashboard/terrenos/${terrenoId}`);
  };

  /*const handleSort = (key) => {
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
  };*/

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

  useEffect(() => {
    // Calculate the total number of terrenos after filtering
    setTotalTerrenos(filteredTerrenos.length);
  }, [filteredTerrenos]);

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

  const handleDelete = async (id) => {
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
                const marcosCollectionRef = collection(db, "Terrenos", id.trim(), "Marcos");
                const confrontacoesCollectionRef = collection(db, "Terrenos", id.trim(), "Confrontacoes");
                const fotografiasCollectionRef = collection(db, "Terrenos", id.trim(), "Fotografias");
  
                const marcosQuerySnapshot = await getDocs(marcosCollectionRef);
                const confrontacoesQuerySnapshot = await getDocs(confrontacoesCollectionRef);
                const fotografiasQuerySnapshot = await getDocs(fotografiasCollectionRef);
  
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
  
                await deleteDoc(doc(db, "Terrenos", id.trim()));
  
                // Após deletar, filtre os terrenos do usuário atual
              const updatedTerrenos = terrenos.filter((terreno) => terreno.id !== id);
              const terrenosDoUsuario = updatedTerrenos.filter((terreno) => terreno.userId === userId); // Supondo que cada terreno tenha um 'userId'

              // Atualize os estados com os terrenos filtrados
              setTerrenos(terrenosDoUsuario);
              setUserFields(terrenosDoUsuario); // Se necessário, atualize de acordo
              setFilteredTerrenos(terrenosDoUsuario); // Se estiver usando filtragem

              toast.dismiss();
              toast.success("Terreno removido");
              // adicionar um refresh na pagina
              window.location.reload();
            } catch (error) {
              //console.error("Error removing document: ", error);
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
      pauseOnHover: false,
    }
  );
};

  const MosaicView = () => (
    <div className="card-grid">
      {filteredTerrenos.length > 0 ? (
        filteredTerrenos.map((field) => (
          <Link
            to={`/terrenos/${field.id}`}
            key={field.id}
            className="card-link"
          >
            <div className="card" key={field.id}>
              <img
                src={"/terreno.jpg"}
                alt="Imagem do terreno"
                className="card-image"
              />
              <div className="card-content">
                <strong>Nome do Terreno:</strong> {field.nome}
                <br />
                <strong>Freguesia:</strong> {field.freguesia}
                <br />
                <strong>Área:</strong>{" "}
                {field.area ? `${field.area} m2` : "Sem área definida"}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <p className="centered-message">NÃO POSSUI TERRENOS REGISTADOS NESTE MOMENTO!</p>
      )}
    </div>
  );

  const ListView = () => (
    <div className="container">
    <br />
    <div className="row align-items-center text-center text-md-start">
      <div className="col-md-6">
        <div className="col-md-6 mb-3 mb-md-0">
          <h5 className="card-title d-inline-block">
            Lista de terrenos{" "}
            <span className="text-muted fw-normal ms-2">
              ({totalTerrenos})
            </span>
          </h5>
        </div>
      </div>
      <div className="col-md-6">
      <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-2">
      <button className="get-freguesia-btn atualizar-button" onClick={() => handleImportClick()} style={{ marginLeft: '0px' }}>
        Importar
      </button>      
      <button className="get-freguesia-btn atualizar-button" onClick={() => handleExportClick()} style={{ marginRight: '0px' }}>
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
                  <th scope="col">Nome</th>
                  <th scope="col">Área</th>
                  <th scope="col">Freguesia</th>
                  <th scope="col">Matriz</th>
                  <th scope="col" style={{ width: "200px" }}>Ação</th>
                  <th scope="col">
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
                            onClick={() => handleRedirectToTerrenoView(terreno.id)}
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
                    <td>
                      <input
                        type="checkbox"
                        checked={checkedTerrenos[terreno.id] || false}
                        onChange={() => handleCheck(terreno.id)}
                      />
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
            
          </ul>
        </div>
      </div>
    </div>
  </div>
);

  return (
    <div className="container">
      <br />
      <br />
      <h1 className="welcome-text">Bem-vind@, {user.name}</h1>
      <p className="numTerrenos">Tem {numTerrenos} terrenos registados.</p>

      <div className="filter-container">
        <input
          type="text"
          name="nome"
          value={filter.nome}
          onChange={handleFilterChange}
          placeholder="Filtrar por Nome"
          className="filter-input"
        />
        <select
          name="area"
          value={filter.area}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">Filtrar por Área</option>
          <option value="0-100">0-100 m2</option>
          <option value="100-500">100-500 m2</option>
          <option value="500-1000">500-1000 m2</option>
          <option value="1000-2000">1000-2000 m2</option>
          <option value="2000+">+2000 m2</option>
        </select>
        <input
          type="text"
          name="freguesia"
          value={filter.freguesia}
          onChange={handleFilterChange}
          placeholder="Filtrar por Freguesia"
          className="filter-input"
        />
      </div>

      <div className="view-toggle-container">
        <button onClick={() => setView("mosaic")}>
          <AppsIcon />
        </button>
        <button onClick={() => setView("list")}>
          <ListIcon />
        </button>
      </div>

      {view === "mosaic" ? <MosaicView /> : <ListView />}
    </div>
  );
};


export default Home;
