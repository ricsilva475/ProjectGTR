import React, { useState, useEffect } from "react";
import { db } from "../../../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import TerrenoMap from "../terrenoMap";
import Switch from "react-switch";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FiCopy } from "react-icons/fi";
import "./marcos.css";

const Marcos = () => {
  const { id } = useParams();
  const [terreno, setTerreno] = useState(null);
  const [initialCenter, setInitialCenter] = useState({});
  const [markers, setMarkers] = useState([]);
  const [images, setImages] = useState([]);
  const [url, setUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [showVirtual, setShowVirtual] = useState({});
  const [tempShowVirtual, setTempShowVirtual] = useState({});
  const [isCopied, setIsCopied] = useState(false);
  const [selectedMarcoId, setSelectedMarcoId] = useState(null);
  const [selectedMarco, setSelectedMarco] = useState(null);
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [photoExistsForMarkers, setPhotoExistsForMarkers] = useState({});
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [index, setIndex] = useState(0);
  
  

const fileInput = React.createRef();
const navigate = useNavigate();

useEffect(() => {
  // This function will be called when the component is unmounted
  return () => {
    setImage(null);
    setFile(null);
    setPreviewImage(null);
  };
}, []);

useEffect(() => {
  if (selectedMarco) {
    checkIfPhotoExistsForMarkers([selectedMarco.id])
      .then((photoExists) => {
        setPhotoExistsForMarkers(prevState => ({ ...prevState, [selectedMarco.id]: photoExists[selectedMarco.id] }));
      })
      .catch((error) => {
        console.error(`Error checking if photos exist for marker ${selectedMarco.id}:`, error);
      });
  }
}, [selectedMarco]); // Substitua isso pela dependência correta

  useEffect(() => {
    const fetchTerreno = async () => {
      try {
        const terrenoDoc = await getDoc(doc(db, "Terrenos", id));
        if (terrenoDoc.exists()) {
          const terrenoData = terrenoDoc.data();
          setTerreno(terrenoData);

          if (
            terrenoData &&
            terrenoData.center &&
            terrenoData.center.latitude &&
            terrenoData.center.longitude
          ) {
            const { latitude, longitude } = terrenoData.center;
            setInitialCenter({ lat: latitude, lng: longitude });
          } else {
            console.error("Invalid center data:", terrenoData.center);
            //toast.error('Erro ao carregar o centro do terreno');
          }
        } else {
   
        }
      } catch (error) {
        console.error("Error fetching terreno:", error);
        toast.error("Erro ao carregar o terreno");
      }
    };

    fetchTerreno();
    
  }, [id]);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const markersCollectionRef = collection(db, "Terrenos", id, "Marcos");
        const querySnapshot = await getDocs(markersCollectionRef);

        const markersData = [];
        querySnapshot.forEach((doc) => {
          const markerData = {
            id: doc.id,
            nome: doc.data().nome,
            descricao: doc.data().descricao,
            tipo: doc.data().tipo,
            coordinates: doc.data().point || {}, // ensure coordinates object exists
          };
          markersData.push(markerData);
        });

        setMarkers(markersData);

        // Initialize tempShowVirtual with the initial marker types
        const tempShowVirtualData = markersData.reduce((acc, marker) => {
          acc[marker.id] = marker.tipo === "Fisico";
          return acc;
        }, {});
        setTempShowVirtual(tempShowVirtualData);
      } catch (error) {
        console.error("Error fetching markers:", error);
        toast.error("Erro ao carregar os marcos");
      }
    };
    fetchMarkers();
  }, [id]);


  const handleDescriptionChange = (id, event) => {
    setMarkers((prevMarkers) =>
      prevMarkers.map((marker) => {
        if (marker.id === id) {
          return { ...marker, descricao: event.target.value };
        } else {
          return marker;
        }
      })
    );
  };

  useEffect(() => {
    loadMarcoPhotos();
}, [selectedMarcoId]);

  const handleSwitchChange = (id) => {
    setTempShowVirtual((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleCopy = () => {
    setIsCopied(true);
    toast.success("Coordenadas copiadas!");
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarco(marker);
    setSelectedMarcoId(marker.id);
  };

  const handleReturn = () => {
    navigate(`/terrenos/${id}/desenho`);
  };

  const handleReturnMenu = () => {
    setSelectedMarco(null); 
    setSelectedMarcoId(null);
  };



  const handlePhotoUpload = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  
      if (!validImageTypes.includes(file.type)) {
        toast.error('Formato invalido. PNG, JPG or JPEG file only.');
        return;
      }
  
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setFile(file); // Store the file in the state
        setPreviewImage(URL.createObjectURL(file)); // Add this line
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (file) {
      // Prepare the data for Cloudinary
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "myCloud");
      data.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);
      data.append("folder", `Terrenos/${id}/Marcos/${selectedMarcoId}`);
  
      // Upload the image to Cloudinary
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,{
        method : "POST",
        body : data
      });
  
      if (!res.ok) {
        console.error('Error uploading image:', res.statusText);
        return;
      }
  
      const cloudData = await res.json();
      setUrl(cloudData.url);
  
      // Get the number of existing photos
      const fotosCollection = collection(db, "Terrenos", id, "Marcos", selectedMarcoId, "Fotos");
      const fotoSnapshot = await getDocs(fotosCollection);
      const numFotos = fotoSnapshot.size;
  
      // Create the photo ID
      const fotoId = `Foto${numFotos + 1}`;
  
      // Save the image URL to Firestore
      const fotoRef = doc(db, "Terrenos", id, "Marcos", selectedMarcoId, "Fotos", fotoId);
      await setDoc(fotoRef, {
        Link: cloudData.url,
      });
  
    }
  
    // Save descriptions
    try {
      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        const markerDoc = doc(db, "Terrenos", id, "Marcos", marker.id);
        await updateDoc(markerDoc, {
          descricao: marker.descricao,
          tipo: tempShowVirtual[marker.id] ? "Fisico" : "Virtual", // Use tempShowVirtual to determine marker type
        });
      }
  
      // Copy the temporary changes to the main state
      setShowVirtual(tempShowVirtual);
  
      toast.success("Informações guardadas com sucesso");

      /*setTimeout(() => {
        window.location.reload();
      }, 2000);*/


    } catch (error) {
      console.error("Error saving descriptions:", error);
      toast.error("Erro ao guardar as descrições");
    }
  };

  const loadMarcoPhotos = async () => {
    try {
      // Obtenha uma referência para a coleção de Fotos
      const fotosDocumentRef = collection(db, "Terrenos", id, "Marcos", selectedMarcoId, "Fotos");
  
      // Obtenha todos os documentos na coleção
      const fotosQuerySnapshot = await getDocs(fotosDocumentRef);
  
      // Mapeie os documentos para os URLs das imagens
      const images = fotosQuerySnapshot.docs.map(doc => doc.data().Link);
  
      setImages(images);
      //console.log("IMAGENS LOAD", images);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  const deleteImageMarco = async (index) => {
    try {
      // Get the ID of the selected image
      const selectedImageId = images[index].id;

      // Remove the selected image from the images array
      const newImages = images.filter(image => image.id !== selectedImageId);
      
      setImages(newImages);
    
      // Get all the documents
      const fotosSnapshot = await getDocs(collection(db, "Terrenos", id, "Marcos", selectedMarcoId, "Fotos"));
  
      // Sort the documents in the same order as the images array
      const sortedDocs = fotosSnapshot.docs.sort((a, b) => a.id - b.id);
  
      // Get the document with the corresponding index
      const docToDelete = sortedDocs[index];
  
      // Delete the document
      await deleteDoc(doc(db, "Terrenos", id, "Marcos", selectedMarcoId, "Fotos", docToDelete.id));
      toast.success("Foto eliminada com sucesso"); // Show success toast only when a photo is deleted
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Erro ao eliminar a imagem. Por favor, tente novamente."); // Show error toast to user
    }
};

const handleClick = (index) => {
  setSelectedImageIndex(index);
};

  const openPopup = () => {
    setSelectedImage(images[index]);
    setIsPopupVisible(true);
  };
  
  const handleButtonClick = () => {
    fileInput.current.click();
  };
  
  async function checkIfPhotoExistsForMarkers(markerIds) {
    const photoExists = {};
  
    for (const markerId of markerIds) {
      const fotosCollection = collection(db, "Marcos", markerId, "Fotografias");
  
      try {
        const snapshot = await getDocs(fotosCollection);
        photoExists[markerId] = !snapshot.empty;
      } catch (error) {
        console.error(`Error checking if photo exists for marker ${markerId}:`, error);
      }
    }
  
    return photoExists;
  }

  return (
    <div>
      <br />
      <br />
      <h1 className="header-title">Informações dos Marcos</h1>
      <div className="content-wrapper">
        <div className="map-container">
        <h2 className="list-title">Mapa do terreno</h2>
          <TerrenoMap 
            id={id}
            width="100%"
            height="700px"
            selectedMarcoId={selectedMarcoId}
          />
        </div>
        <div className="markers-list">
          <h2 className="list-title">Lista de Marcos</h2>
          <br />
          {markers.length === 0 ? (
            <div className="no-markers-message">
              <p className="no-markers-text">
                Não há marcos disponíveis para este terreno. Complete o desenho do polígono.
              </p>

              <button
                className="no-markers-button"
                onClick={handleReturn}
              >
                Voltar
              </button>
            </div>
          ) : (
            
            <div className="markers-grid">
              {selectedMarco ? (
                <div key={selectedMarco.id} className="marker-item">
                  <h3 className="marker-name">Editar {selectedMarco.id}</h3>
                  <br />
                  {selectedMarco.coordinates.latitude && selectedMarco.coordinates.longitude && (
                    <div className="marker-details">
                      <div className="marker-coordinates">
                        <strong>Coordenadas:</strong>&nbsp;
                        {Number(selectedMarco.coordinates.latitude).toFixed(5)},
                        {Number(selectedMarco.coordinates.longitude).toFixed(5)}
                        <CopyToClipboard
                          text={`${selectedMarco.coordinates.latitude} , ${selectedMarco.coordinates.longitude}`}
                          onCopy={handleCopy}
                        >
                          <FiCopy style={{ cursor: "pointer", marginLeft: "10px" }} />
                        </CopyToClipboard>
                      </div>
                      <div className="switch-container">
                        <label className="marker-description-label">
                          {tempShowVirtual[selectedMarco.id] ? "Fisico" : "Virtual"}
                        </label>
                        <Switch
                          onChange={() => handleSwitchChange(selectedMarco.id)}
                          checked={tempShowVirtual[selectedMarco.id] || false}
                            offColor="#767577"
                            onColor="#81b0ff"
                            offHandleColor="#ffffff"
                            onHandleColor="#ffffff"
                            handleDiameter={30}
                            uncheckedIcon={false}
                            checkedIcon={false}
                            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                            activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                            height={20}
                            width={48}
                            className="react-switch"
                            id="material-switch"
                          />
                        </div>
                      </div>
                    )}
                    {isCopied && (
                      <div className="toast-container">
                        <ToastContainer
                          position="top-center"
                          autoClose={2000}
                          hideProgressBar
                          newestOnTop={false}
                          closeOnClick
                          rtl={false}
                          pauseOnFocusLoss
                          draggable
                          pauseOnHover
                        />
                      </div>
                    )}
                    <br />
                    <div className="marker-description">
                      <strong>Descrição:</strong>&nbsp;
                      <input
                        type="text"
                        defaultValue={selectedMarco.descricao}
                        onChange={(event) =>
                          handleDescriptionChange(selectedMarco.id, event)
                        }
                        className="marker-description-input"
                        style={{ width: "330px" }}
                      />
                    </div>
                    <br />
                    <div style={{ overflow: 'visible', height: 'auto' }}>
                   <input type="file" ref={fileInput} onChange={handlePhotoUpload} style={{ display: 'none' }} />
                   <br></br>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button className="save-button" onClick={handleButtonClick}>Add Fotos</button>
                      </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: previewImage ? '300px' : '0', maxHeight: '100vh', overflow: 'hidden' }}>
                      {previewImage && <img src={previewImage} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%' }} />}
                    </div>

                <div className="button-container">
                  <br /><br /><br />
                  <button className="save-button" onClick={handleSave}>
                    Guardar
                  </button>
                  <button className="return-button" onClick={handleReturnMenu}>
                    Voltar
                  </button>
                </div>
                <br/>
                
                
                <div>
                {selectedImage && (
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}
                    onClick={() => setSelectedImage(null)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <img src={selectedImage} alt="Selected" style={{ maxWidth: '90%', maxHeight: '90%' }} />
                      <button onClick={() => setSelectedImage(null)}></button>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <h2 className="list-title">Fotos do Marco</h2>
                  </div>
                  <br />
                  <div className="gallery foto-grid">
                        {images.map((image, index) => (
                            <div
                              key={index}
                              className="image-wrapper"
                              onClick={() => handleClick(index)}
                              style={{ position: 'relative' }}
                            >
                            <img
                            src={image}
                            alt={`Imagem ${index + 1}`}
                            className="thumbnail-image"
                            style={{ border: '1px solid black' }} // Adiciona uma borda preta
                          />
                          {selectedImageIndex === index && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); openPopup(index); }} style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                fontSize: '2em', 
                                backgroundColor: 'transparent', 
                                border: 'none', 
                                color: 'white' 
                              }}>👁️</button>
                              <button onClick={(e) => { e.stopPropagation(); deleteImageMarco(index); }} style={{ 
                                position: 'absolute', 
                                top: 0, 
                                right: 0, 
                                fontSize: '2em', 
                                backgroundColor: 'transparent', 
                                border: 'none', 
                                color: 'white' 
                              }}>❌</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                </div>
              </div>
                
                  
                  </div>
              
                </div>
              
                ) : (
                // Renderize a lista de marcos
                <>
               {markers.map((marco, index) => (
                  <div
                    key={marco.id}
                    className={`marker-item ${
                      marco.id === selectedMarcoId ? "selected" : ""
                    }`}
                    onClick={() => handleMarkerClick(marco)}
                  >
                      <h3 className="marker-name">{marco.id}</h3>
                      {marco.coordinates.latitude && marco.coordinates.longitude && (
                        <div className="marker-details">
                          <div className="marker-coordinates">
                            <strong>Coordenadas:</strong>&nbsp;
                            {Number(marco.coordinates.latitude).toFixed(5)},
                            {Number(marco.coordinates.longitude).toFixed(5)}
                            <CopyToClipboard
                              text={`${marco.coordinates.latitude} , ${marco.coordinates.longitude}`}
                              onCopy={handleCopy}
                            >
                              <FiCopy style={{ cursor: "pointer", marginLeft: "10px" }} />
                            </CopyToClipboard>
                          </div>
                          <div className="switch-container">
                            <label className="marker-description-label">
                              {tempShowVirtual[marco.id] ? "Fisico" : "Virtual"}
                            </label>
                            <Switch
                              onChange={() => handleSwitchChange(marco.id)}
                              checked={tempShowVirtual[marco.id] || false}
                              offColor="#767577"
                              onColor="#81b0ff"
                              offHandleColor="#ffffff"
                              onHandleColor="#ffffff"
                              handleDiameter={30}
                              uncheckedIcon={false}
                              checkedIcon={false}
                              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                              height={20}
                              width={48}
                              className="react-switch"
                              id="material-switch"
                            />
                            
                          </div>
                        </div>
                      
                    )}
                      
                      {isCopied && (
                        <div className="toast-container">
                          <ToastContainer
                            position="top-center"
                            autoClose={2000}
                            hideProgressBar
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                          />
                        </div>
                      )}
                      <br />
                      <div className="marker-description">
                        <strong>Descrição:</strong>&nbsp;
                        <input
                          type="text"
                          defaultValue={marco.descricao}
                          onChange={(event) =>
                            handleDescriptionChange(marco.id, event)
                          }
                          className="marker-description-input"
                          style={{ width: "330px" }}
                        />
                      </div>
                    </div>
                  ))}
                </>
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
  
  export default Marcos;