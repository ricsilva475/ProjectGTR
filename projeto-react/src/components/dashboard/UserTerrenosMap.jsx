import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";


const UserTerrenosMap = ({ onTerrenoClick, center, zoom }) => {
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const [terrenos, setTerrenos] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          const userId = user.uid;
          const userDoc = doc(db, "Proprietario", userId);
          const userSnapshot = await getDoc(userDoc);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const contribuinte = userData.contribuinte;
            fetchTerrenos(contribuinte);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Erro ao carregar os dados do usuário");
      }
    };

    fetchUserData();
  }, [user]);

  const fetchTerrenos = async (contribuinte) => {
    try {
      const terrenosCollectionRef = collection(db, "Terrenos");
      const terrenosQuery = query(terrenosCollectionRef, where("contribuinte", "==", contribuinte));
      const querySnapshot = await getDocs(terrenosQuery);

      if (querySnapshot.empty) {
        console.log("No Terrenos found for the user.");
        setTerrenos([]);
        return;
      }

      const terrenosData = [];
      for (const terrenoDoc of querySnapshot.docs) {
        const terrenoData = terrenoDoc.data();
        const markersCollectionRef = collection(
          db,
          "Terrenos",
          terrenoDoc.id,
          "Marcos"
        );
        const markersSnapshot = await getDocs(markersCollectionRef);
        const markersData = markersSnapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          descricao: doc.data().descricao,
          coordinates: {
            lat: doc.data().point.latitude,
            lng: doc.data().point.longitude,
          },
        }));

        if (terrenoData.center) {
          terrenosData.push({
            id: terrenoDoc.id,
            center: terrenoData.center,
            markers: markersData,
            area: terrenoData.area, // assuming the area is stored in the terreno document
          });
        }
      }

      setTerrenos(terrenosData);
    } catch (error) {
      console.error("Error fetching terrenos:", error);
      toast.error("Erro ao carregar os terrenos");
    }
  };

  useEffect(() => {
    const loadGoogleMapScript = () => {
      const googleMapScript = document.createElement("script");
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,geometry&v=weekly`;
      googleMapScript.async = true;
      window.document.body.appendChild(googleMapScript);

      googleMapScript.addEventListener("load", () => {
        setScriptLoaded(true);
      });
    };

    loadGoogleMapScript();
  }, [apiKey]);

  useEffect(() => {
    if (scriptLoaded && terrenos.length > 0) {
      const mapInstance = new window.google.maps.Map(
        document.getElementById("googleMap"),
        {
          center: { lat: 39.3999, lng: -8.2245 }, // Centered on Portugal
          zoom: 6.5,
          mapTypeId: window.google.maps.MapTypeId.HYBRID,
        }
      );

      const bounds = new window.google.maps.LatLngBounds();

      terrenos.forEach((terreno) => {
        // Draw marker at the center
        const marker = new window.google.maps.Marker({
          position: {
            lat: terreno.center.latitude,
            lng: terreno.center.longitude,
          },
          map: mapInstance,
          title: `Terreno ${terreno.id}`,
        });

        // Extend the bounds to include the marker
        bounds.extend(marker.getPosition());

        // Add click listener to zoom in when marker is clicked
        marker.addListener("click", () => {
          const zoomLevel = getZoomLevelForArea(terreno.area);
          mapInstance.setZoom(zoomLevel);
          mapInstance.setCenter(marker.getPosition());

          // Pass terreno ID to parent component
          onTerrenoClick(terreno.id);
        });

        // Draw polygon
        new window.google.maps.Polygon({
          paths: terreno.markers.map((marker) => marker.coordinates),
          strokeColor: "#000000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FFFF00", // Yellow fill color
          fillOpacity: 0.35, // Fill opacity
          map: mapInstance,
        });
      });

      // Adjust the map to fit all markers
      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds);
      }
    }
  }, [scriptLoaded, terrenos, onTerrenoClick]);

  const getZoomLevelForArea = (area) => {
    if (area < 1000) {
      return 18; 
    } else if (area < 5000 || area < 10000) {
      return 17; 
    } else if (area < 20000) {
      return 16; 
    } else if (area < 50000) {
      return 15; 
    } else {
      return 14; 
    }
  };

  return (
    <div className="text-2xl font-bold pt-14">
      <div id="googleMap" style={{ width: "100%", height: "700px" }}></div>
    </div>
  );
};

export default UserTerrenosMap;
