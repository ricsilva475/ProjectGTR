import React, { useState, useEffect } from "react";
import { db } from "../../../firebase/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";

const AllTerrenos = ({ initialCenter, id }) => {
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const [markers, setMarkers] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [selectedMarcoId, setSelectedMarcoId] = useState(null);
  const [selectedConfrontacao, setSelectedConfrontacao] = useState(null);
  const [terrenos, setTerrenos] = useState([]); // New state for storing all terrenos

  useEffect(() => {
    const fetchTerrenos = async () => {
      try {
        const terrenosCollectionRef = collection(db, "Terrenos");
        const terrenosSnapshot = await getDocs(terrenosCollectionRef);

        const terrenosData = [];
        terrenosSnapshot.forEach((doc) => {
          const terrenoData = doc.data();
          if (
            terrenoData &&
            terrenoData.center &&
            terrenoData.center.latitude &&
            terrenoData.center.longitude
          ) {
            const { latitude, longitude } = terrenoData.center;
            terrenosData.push({ lat: latitude, lng: longitude });
          } else {
            console.error("Invalid center data:", terrenoData.center);
          }
        });

        setTerrenos(terrenosData); // Store all terrenos data in the state
      } catch (error) {
        console.error("Error fetching terrenos:", error);
        toast.error("Erro ao carregar os terrenos");
      }
    };
    
  const fetchMarkers = async () => {
    try {
      const markersCollectionRef = collection(db, "Terrenos", id, "Marcos");
      const querySnapshot = await getDocs(markersCollectionRef);

      if (querySnapshot.empty) {
        console.log("No Marcos associated with this Terreno.");
        setMarkers([]);
        
        return;
      }

      const markersData = [];
      querySnapshot.forEach((doc) => {
        const markerData = {
          id: doc.id,
          nome: doc.data().nome,
          descricao: doc.data().descricao,
          coordinates: {
            lat: doc.data().point.latitude,
            lng: doc.data().point.longitude,
          },
        };
        markersData.push(markerData);
      });

      setMarkers(markersData);
    } catch (error) {
      console.error("Error fetching markers:", error);
      toast.error("Erro ao carregar os marcos");
    }
  };

  const loadGoogleMapScript = () => {
    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,geometry&v=weekly`;
    googleMapScript.async = true;
    window.document.body.appendChild(googleMapScript);

    googleMapScript.addEventListener("load", () => {
      setScriptLoaded(true);
    });
  };

  fetchTerrenos();
  fetchMarkers();
  loadGoogleMapScript();
}, [apiKey, id, initialCenter]);

  useEffect(() => {
    if (scriptLoaded) {
      const mapInstance = new window.google.maps.Map(
        document.getElementById("googleMap"),
        {
          center: initialCenter,
          zoom: 19,
          mapTypeId: window.google.maps.MapTypeId.HYBRID,
        }
      );
  
      // Draw markers
      markers.forEach((markerData, index) => {
        const { coordinates, id } = markerData;
  
        const marker = new window.google.maps.Marker({
          position: coordinates,
          map: mapInstance,
          title: id,
          label: {
            text: id,
            color: "#000000", // Label text color
            fontSize: "10px", // Label font size
            fontWeight: "bold", // Label font weight
          },
        });
  
        // Set marker color based on selectedMarcoId
        if (selectedMarcoId === id) {
          marker.setLabel(null);
          marker.setIcon(
            "http://maps.gstatic.com/mapfiles/ms2/micons/ltblu-pushpin.png"
          );
          mapInstance.panTo(marker.getPosition());
        }
  
        // Draw a line between this marker and the next one
        if (index < markers.length - 1) {
          const nextMarkerData = markers[index + 1];
          const confrontacaoId = `${id}-${nextMarkerData.id}`;
  
          // Set default line color to black
          let lineColor = "#000000";
  
          // If selectedConfrontacao exists and matches the confrontacaoId, set line color to red
          if (
            selectedConfrontacao &&
            selectedConfrontacao.id === confrontacaoId
          ) {
            lineColor = "#FF0000";
  
            // Center map on the selected confrontacao
            mapInstance.panTo(coordinates);
          }
  
          const line = new window.google.maps.Polyline({
            path: [coordinates, nextMarkerData.coordinates],
            strokeColor: lineColor,
            strokeOpacity: 0.8,
            strokeWeight: 6,
            map: mapInstance,
          });
        } else if (markers.length > 1) {
          // If there are markers and it's the last one, draw a line between the last and first marker
          const firstMarkerData = markers[0];
          const lastMarkerData = markers[markers.length - 1];
          const confrontacaoId = `${lastMarkerData.id}-${firstMarkerData.id}`; // Construct confrontacao ID based on last and first marker IDs
          const lineColor =
            selectedConfrontacao?.id === confrontacaoId ? "#FF0000" : "#000000"; // Set line color based on selectedConfrontacao
          const line = new window.google.maps.Polyline({
            path: [lastMarkerData.coordinates, firstMarkerData.coordinates],
            strokeColor: lineColor,
            strokeOpacity: 0.8,
            strokeWeight: 6,
            map: mapInstance,
          });
  
          // Center map on the selected confrontacao if it matches the last marker
          if (selectedConfrontacao?.id === confrontacaoId) {
            mapInstance.panTo(firstMarkerData.coordinates);
          }
        }
      });
  
      // Create a polygon with the same coordinates as the polylines
      const polygon = new window.google.maps.Polygon({
        paths: markers.map((marker) => marker.coordinates),
        strokeColor: "#000000",
        strokeOpacity: 0.8,
        strokeWeight: 0,
        fillColor: "#FFFF00", // Yellow fill color
        fillOpacity: 0.35, // Fill opacity
        map: mapInstance,
      });
    }
}, [scriptLoaded, initialCenter, markers]);
  
  

return (
    <div className="text-2xl font-bold pt-14">
      <div id="googleMap" style={{ width: "100%", height: "590px" }}></div>
    </div>
  );
};

export default AllTerrenos;
