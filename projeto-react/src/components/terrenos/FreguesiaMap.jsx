import React, { useEffect, useRef, useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GeoPoint } from "firebase/firestore";

const FreguesiaMap = () => {
  const { id } = useParams();
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const mapRef = useRef();
  const [markers, setMarkers] = useState([]);
  const polygonRef = useRef(null);
  const navigate = useNavigate();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [freguesia, setFreguesia] = useState('');
  const [distrito, setDistrito] = useState('');

  // Coordenadas Default (Lisbon, Portugal)
  const defaultCoordinates = { lat: 39.73382896026802, lng: -8.821380308359618 };

  useEffect(() => {
    const loadGoogleMapScript = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=console.debug&libraries=places,maps,geometry&v=beta`;
      script.defer = true;
      script.async = true;
      script.onload = () => initializeMap();
      document.body.appendChild(script);
    };

    const initializeMap = async () => {
      const terrenoDoc = await getDoc(doc(db, "Terrenos", id));
      const terreno = terrenoDoc.data();

      if (terrenoDoc.exists() && terrenoDoc.data().center) {
        const centerData = terrenoDoc.data().center;
        const pos = { lat: centerData.latitude, lng: centerData.longitude };
        loadMap(pos);
      } else {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(terreno.freguesia)}&key=${apiKey}`);
        if (response.data.results && response.data.results[0] && response.data.results[0].geometry) {
          const pos = response.data.results[0].geometry.location;
          const lat = pos.lat;
          const lng = pos.lng;
          const centerGeoPoint = new GeoPoint(lat, lng);

          await setDoc(
            doc(db, "Terrenos", id),
            { center: centerGeoPoint },
            { merge: true }
          );

          setFreguesia(terreno.freguesia); // Set initial freguesia
          loadMap(pos);
        } else {
          toast.error('Erro ao carregar o mapa na freguesia introduzida. A localização do terreno não foi encontrada.');
          loadMap(defaultCoordinates);
        }
      }
    };

    const loadMap = (pos) => {
      mapRef.current = new window.google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 20,
        mapTypeId: window.google.maps.MapTypeId.HYBRID,
      });

      mapRef.current.addListener("click", handleClick);

      const input = document.getElementById('pac-input');
      const searchBox = new window.google.maps.places.SearchBox(input);
      mapRef.current.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        setSelectedPlace(place);

        mapRef.current.setCenter(place.geometry.location);
        mapRef.current.setZoom(15);
      });
    };

    loadGoogleMapScript();
  }, [apiKey, id]);

  const handleClick = (e) => {
    const marker = new window.google.maps.Marker({
      position: { lat: e.latLng.lat(), lng: e.latLng.lng() },
      map: mapRef.current,
      draggable: true,
    });

    marker.addListener("dragend", () => {
      updatePolygon();
    });

    setMarkers((prevMarkers) => {
      const newMarkers = [...prevMarkers, marker];
      updatePolygonWithMarkers(newMarkers);
      return newMarkers;
    });

    // Retrieve freguesia and distrito based on the clicked location
    retrieveFreguesiaDistrito(e.latLng.lat(), e.latLng.lng());
  };

  const retrieveFreguesiaDistrito = async (latitude, longitude) => {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
    if (response.data.results && response.data.results.length > 0) {
      const addressComponents = response.data.results[0].address_components;
      let newFreguesia = '';
      let newDistrito = '';
      addressComponents.forEach(component => {
        if (component.types.includes("locality")) {
          newFreguesia = component.long_name;
        } else if (component.types.includes("administrative_area_level_1")) {
          newDistrito = component.long_name;
        }
      });

      if (newFreguesia && newDistrito) {
        setFreguesia(newFreguesia);
        setDistrito(newDistrito);
      }
    }
  };

  const updatePolygon = () => {
    setMarkers((prevMarkers) => {
      updatePolygonWithMarkers(prevMarkers);
      return prevMarkers;
    });
  };

  const updatePolygonWithMarkers = (markers) => {
    const paths = markers.map((marker) => marker.getPosition());

    if (polygonRef.current) {
      polygonRef.current.setPaths(paths);
    } else {
      polygonRef.current = new window.google.maps.Polygon({
        paths: paths,
        map: mapRef.current,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: "#FFFFF0",
        fillOpacity: 0.6,
      });
    }
  };

  const handleSave = async () => {
    if (markers.length === 0) {
      toast.info('Tem de inserir marcos');
      return;
    }

    const markersToSave = markers.map((marker) => ({
      point: new GeoPoint(
        marker.getPosition().lat(),
        marker.getPosition().lng()
      ),
      descricao: null,
      tipo: 'virtual'
    }));

    for (const [index, marker] of markersToSave.entries()) {
      const markerId = `M${String(index).padStart(2, "0")}`;
      await setDoc(doc(db, "Terrenos", id, "Marcos", markerId), marker);
    }

    const markerPairs = [];
    for (let i = 0; i < markersToSave.length - 1; i++) {
      markerPairs.push([markersToSave[i], markersToSave[i + 1]]);
    }

    markerPairs.push([markersToSave[markersToSave.length - 1], markersToSave[0]]);

    for (let i = 0; i < markersToSave.length - 1; i++) {
      const pairId = `M${String(i).padStart(2, "0")}-M${String(i + 1).padStart(2, "0")}`;
      await setDoc(doc(db, "Terrenos", id, "Confrontacoes", pairId), { descricao: "" });
    }

    const lastPairId = `M${String(markersToSave.length - 1).padStart(2, "0")}-M00`;
    await setDoc(doc(db, "Terrenos", id, "Confrontacoes", lastPairId), {
      descricao: "",
      entidade: "",
      nome: "",
      contacto: "",
      morada: "",
    });

    const polygon = new window.google.maps.Polygon({
      paths: markers.map((marker) => ({
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng(),
      })),
    });

    await calculateAreaAndPerimeter(polygon, id, db);
    const center = calculateCenter(markers.map((marker) => marker.getPosition()));
    const newCenter = new GeoPoint(center.lat, center.lng);

    await setDoc(
      doc(db, "Terrenos", id),
      { 
        center: newCenter,
        freguesia: `${freguesia}, ${distrito}`,
      },
      { merge: true }
    );

    toast.success("Desenho do poligono guardado!");
    setTimeout(() => navigate(`/terrenos/${id}/desenho`), 2000);
  };

  const resetMarkers = () => {
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
  };

  const calculateAreaAndPerimeter = async (polygon, id, db) => {
    const path = polygon.getPath();
    const pathArray = path.getArray().map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }));

    let area = window.google.maps.geometry.spherical.computeArea(pathArray);
    let perimeter = window.google.maps.geometry.spherical.computeLength(pathArray);

    area = Math.round(area * 100) / 100;
    perimeter = Math.round(perimeter * 100) / 100;

    const result = { area, perimeter };

    const terrenoRef = doc(db, "Terrenos", id);
    await setDoc(
      terrenoRef,
      { area: result.area, perimetro: result.perimeter },
      { merge: true }
    );
  };

  const calculateCenter = (positions) => {
    if (positions.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const bounds = new window.google.maps.LatLngBounds();
    positions.forEach((pos) => bounds.extend(pos));
    const center = bounds.getCenter();

    return { lat: center.lat(), lng: center.lng() };
  };

  return (
    <div className="text-2xl font-bold pt-14">
     <input
        id="pac-input"
        className="controls"
        type="text"
        placeholder="Search Box"
        style={{
          marginTop: '10px',
          marginBottom: '10px',
          width: '300px',
          height: '40px',
          fontSize: '16px',
          padding: '10px',
        }}
      />
      <div ref={mapRef} style={{ width: "100%", height: "600px" }}></div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <button onClick={resetMarkers} className="reset-button" style={{ marginLeft: "20px" }}>
          Limpar Marcos
        </button>
        <button onClick={handleSave} className="link-button">
          Guardar Marcos
        </button>
      </div>
    </div>
  );
};

export default FreguesiaMap;
