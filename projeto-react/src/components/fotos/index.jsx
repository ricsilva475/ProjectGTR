import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {toast} from 'react-toastify';
import {Toaster} from 'react-hot-toast';
import { Button } from '@material-tailwind/react';
import { collection, getDocs, getDoc, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from '../../firebase/firebase';
import './fotos.css';

const Fotos = () => {
  const cloud_name = process.env.REACT_APP_CLOUD_NAME;
  const { id } = useParams(); 
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [url, setUrl] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fotoData, setFotoData] = useState(null);
  const [fotoRef, setFotoRef] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const navigate = useNavigate();

  const [imageData, setImageData] = useState(null);
  
  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch(`http://localhost:3000/api/images/Terrenos/${id}.`);
        
        // Check if the response is OK and contains data
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
  
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
  
        setImages(data);
      } catch (error) {
        //toast.info('Não tem imagens guardadas para este terreno.');
      }
    }
  
    fetchImages();
    loadImages();
    deleteImage();
  }, [id]);
  

  const handleImageClick = (index, imageUrl) => {
    setSelectedImage(imageUrl);
    setSelectedImageIndex(index);
  };

  useEffect(() => {
    if (selectedImageIndex !== null) {
      const fetchImageData = async () => {
        const imageRef = doc(db, "Terrenos", id, "Fotografias", `foto${selectedImageIndex + 1}`);
        const imageSnap = await getDoc(imageRef);
  
        if (imageSnap.exists()) {
          setImageData(imageSnap.data());
        } else {
          console.log('No such document!');
        }
      };
  
      fetchImageData();
    }
  }, [selectedImageIndex]);

  const openPopup = () => {
    setIsPopupVisible(true);
  };
  
  const handleReturn = () => {
    navigate(`/terrenos/${id}/desenho`);
  };

  const saveImage = async () => {
    if (!image) {
      return toast.info("Insira primeiro uma foto ou vídeo");
    }
  
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "myCloud");
    data.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);
    data.append("folder", `Terrenos/${id}`);
    const imageNameWithoutExtension = image.name.split('.').slice(0, -1).join('.');
    data.append("context", `caption=${imageNameWithoutExtension}|alt=${description}`);
  
    try {
      if(image.type !== "image/jpeg" && image.type !== "image/png" && image.type !== "image/jpg" && image.type !== "video/mp4"){
        return toast.error("Please Upload image of type jpg, jpeg, png or video of type mp4")
      }
      if(image === null){
        return toast.error("Please Upload image or video")
      }
  
      const mediaType = image.type === "video/mp4" ? "video" : "image";
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/${mediaType}/upload`,{
        method : "POST",
        body : data
      })
  
      if (!res.ok) {
        console.error('Error uploading media:', res.statusText);
        return;
      }
  
      const cloudData = await res.json();
      setUrl(cloudData.url);
  
      await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: cloudData.url, 
          metadata: {
            title: image.name,
          }, 
          terrainId: id 
        }),
      });
  
      console.log("MEDIA URL", cloudData.url);
      toast.success("Foto/Video guardados com sucesso")

      setTimeout(() => {
               window.location.reload();
      }, 2000);
  
      // Get the number of existing photos
      const fotosCollection = collection(db, "Terrenos", id, "Fotografias");
      const fotoSnapshot = await getDocs(fotosCollection);
      const numFotos = fotoSnapshot.size;
  
      // Create the photo ID
      const fotoId = `foto${numFotos + 1}`;
  
      // Save the image URL to Firestore
      const fotoRef = doc(db, "Terrenos", id, "Fotografias", fotoId);
      await setDoc(fotoRef, {
        Link: cloudData.url,
        Nome: imageNameWithoutExtension,
        Descrição: description
      });
  
      console.log("LINK GUARDADO NA FIREBASE", cloudData.url);
  
    } catch (error) {
      console.error('Error uploading media:', error);
    }
  }

  const loadImages = async () => {
    try {
      // Obtenha uma referência para a coleção de Fotografias
      const fotografiasRef = collection(db, "Terrenos", id, "Fotografias");
  
      // Obtenha todos os documentos na coleção
      const fotografiasQuerySnapshot = await getDocs(fotografiasRef);
  
      // Mapeie os documentos para os URLs das imagens
      const images = fotografiasQuerySnapshot.docs.map(doc => doc.data().Link);
  
      setImages(images);
      //console.log("IMAGES LOAD", images);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  const deleteImage = async () => {
    try {
      // Remove the selected image from the images array
      const newImages = images.filter(image => image !== selectedImage);
      setImages(newImages);
  
      // Get a reference to the Fotografias collection
      const fotografiasDocumentRef = collection(db, "Terrenos", id, "Fotografias");
  
      // Get all the documents in the collection
      const fotografiasQuerySnapshot = await getDocs(fotografiasDocumentRef);
  
      // Iterate over each document in the collection
      for (const doc of fotografiasQuerySnapshot.docs) {
        const fotoData = doc.data();
        const { Link } = fotoData;
  
        // If the link matches the selected image, delete the document
        if (Link === selectedImage) {
          await deleteDoc(doc.ref);
          toast.success("Foto/Video foram eliminados com sucesso"); // Show success toast only when a photo is deleted
          break;
        }
      }
  
      setSelectedImage(null);
      setSelectedImageIndex(null);
      setImageData(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Erro ao eliminar a imagem. Por favor, tente novamente."); // Show error toast to user
    }
  };
  
  return (
    <div className='container flex flex-col justify-center items-center'>
      <br/>
      <br/>
  
      <h1 className="header-title">Fotos dos Terrenos</h1>
  
      <br/>
  
      <div className={image ? "bg-[#2C3A47] p-10 rounded-xl" : "bg-[rgb(238,238,238)] p-5 rounded-xl"}>
        <div className="input flex justify-center mb-5">
          <label
            htmlFor="file-upload"
            className="custom-file-upload"
          >
           {image
            ? <>
                {image.type === "video/mp4"
                  ? <video
                  className="w-3/4 lg:w-3/4 rounded-xl mx-auto"
                  src={URL.createObjectURL(image)}
                  controls
                  onClick={() => setSelectedImage(URL.createObjectURL(image))}
                />
                  : <img
                      className="w-40 lg:w-80 rounded-xl mx-auto"
                      src={URL.createObjectURL(image)}
                      alt="img"
                      onClick={() => setSelectedImage(URL.createObjectURL(image))}
                    />
                }
                <br/>
                <p className="text-white text-center">{image.name}</p>
                <br/>
                <textarea 
                  className="w-full h-20 p-3 mt-2 text-white bg-gray-800 rounded-lg focus:outline-none" 
                  placeholder="Insira uma descrição aqui"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                ></textarea>
              </>
              : <>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={e => {
                      setImage(e.target.files[0]);
                      setSelectedImage(URL.createObjectURL(e.target.files[0]));
                    }}
                  />
                </>
              }
          </label>
          <input
            id="file-upload"
            className=' text-white'
            type="file"
            onChange={(e) => setImage(e.target.files[0])} />
        </div>
        {image && (
         <div className="flex justify-center">
         <Button
           className=' w-72 lg:w-96  bg-[#FC427B]'
           onClick={() => {
             saveImage();
           }}
         >
           Enviar 
         </Button>
       <Toaster/>
       </div>
        )}
                </div>
            
                {!image && (
            <div className="gallery">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="image-wrapper"
          onClick={() => {
            setSelectedImage(image);
            handleImageClick(index, image);
          }}
          style={{ position: 'relative' }}
          >
          {image.endsWith(".mp4")
            ? <img
                className="thumbnail-image"
                src="/video.png"
                alt="Video thumbnail"
                onClick={() => setSelectedImage(image)}
              />
            : <img
                src={image}
                alt={`Imagem ${index + 1}`}
                className="thumbnail-image"
              />
          }
        {selectedImage === image && (
          <>
            <button onClick={openPopup} style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              fontSize: '2em', 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: 'white' 
            }}>👁️</button>
            <button onClick={(e) => { e.stopPropagation(); deleteImage(); }} style={{ 
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
          )}
            {selectedImage && imageData && isPopupVisible && (
            <div 
              style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                zIndex: 1000 
              }}
              onClick={() => { setSelectedImage(null); setIsPopupVisible(false); }}
            >
                <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {selectedImage.endsWith(".mp4")
                  ? <video
                  src={selectedImage}
                  style={{ maxWidth: '50%', maxHeight: '50%' }}
                  controls
                  onClick={() => { setSelectedImage(imageData.url); setIsPopupVisible(true); }}
                />
                  : <img src={selectedImage} alt={imageData.Nome} style={{ maxWidth: '50%', maxHeight: '50%' }} />
                }
                <div style={{ 
                    textAlign: 'center', 
                    color: 'white' 
                  }}>
                  <br/>
                  <br/>
                  <h2 style={{ fontSize: '1.5em', textAlign: 'left' }}>Nome : {imageData.Nome}</h2>
                  <h2 style={{ fontSize: '1.5em', textAlign: 'left' }}>Descrição : {imageData.Descrição}</h2>
                </div>
              </div>
            </div>
          )}
      <br />
      <div className="button-container">
        <button className="return-button" onClick={handleReturn}>
          Voltar
        </button>
      </div>
    </div>
  );
}

export default Fotos;