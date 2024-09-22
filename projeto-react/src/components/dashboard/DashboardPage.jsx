import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography, Box } from "@mui/material";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import VizinhoFrequencyChart from "./chart/VizinhoFrequencyChart";
import TerrenosFreguesiaPieChart from "./chart/TerrenosFreguesiaPieChart";
import EntidadesPieChart from "./chart/EntidadesPieChart";

const DashboardPage = () => {
  const [totalTerrenos, setTotalTerrenos] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [totalVizinhos, setTotalVizinhos] = useState(0);
  const [userData, setUserData] = useState(null);
  const [vizinhoFrequency, setVizinhoFrequency] = useState([]);
  const [terrenosByFreguesia, setTerrenosByFreguesia] = useState([]);
  const [selectedTerrenoId, setSelectedTerrenoId] = useState(null);
  const [selectedTerrenoName, setSelectedTerrenoName] = useState(null);
  const [selectedTerrenoFreguesia, setSelectedTerrenoFreguesia] =
    useState(null);
  const [selectedTerrenoArea, setSelectedTerrenoArea] = useState(null);
  const [terrenos, setTerrenos] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [entidadesData, setEntidadesData] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [initialBounds, setInitialBounds] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userId = user.uid;
        const userDoc = doc(db, "Proprietario", userId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const contribuinte = userData.contribuinte;
          fetchTerrenos(contribuinte);
          setUserData(userSnapshot.data());
          const vizinhosCollection = collection(
            db,
            "Proprietario",
            userId,
            "Vizinhos"
          );
          const vizinhosSnapshot = await getDocs(vizinhosCollection);
          setTotalVizinhos(vizinhosSnapshot.size);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const fetchTerrenos = async (contribuinte) => {
    try {
      const terrenosCollectionRef = collection(db, "Terrenos");
      const terrenosQuery = query(
        terrenosCollectionRef,
        where("contribuinte", "==", contribuinte)
      );
      const querySnapshot = await getDocs(terrenosQuery);

      if (querySnapshot.empty) {
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
            area: terrenoData.area, 
          });
        }
      }

      setTerrenos(terrenosData);
    } catch (error) {
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
          center: { lat: 0, lng: 0 },
          zoom: 10,
          mapTypeId: window.google.maps.MapTypeId.HYBRID,
        }
      );

      const bounds = new window.google.maps.LatLngBounds();
      const polygonsArray = [];

      terrenos.forEach((terreno) => {
        try {
          // Draw marker at the center
          const centerLatLng = new window.google.maps.LatLng(
            terreno.center.latitude,
            terreno.center.longitude
          );

          const marker = new window.google.maps.Marker({
            position: centerLatLng,
            map: mapInstance,
            title: `Terreno ${terreno.id}`,
          });

          bounds.extend(centerLatLng);

          const polygon = new window.google.maps.Polygon({
            paths: terreno.markers.map(
              (marker) =>
                new window.google.maps.LatLng(
                  marker.coordinates.lat,
                  marker.coordinates.lng
                )
            ),
            strokeColor: "#000000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FFFF00",
            fillOpacity: 0.35,
            map: mapInstance,
          });

          polygonsArray.push({ id: terreno.id, polygon });

          const handleClick = () => {
            const zoomLevel = getZoomLevelForArea(terreno.area);
            mapInstance.setZoom(zoomLevel);
            mapInstance.setCenter(centerLatLng);
            polygonsArray.forEach(({ id, polygon }) => {
              polygon.setOptions({
                fillColor: id === terreno.id ? "#0000FF" : "#FFFF00",
                fillOpacity: id === terreno.id ? 0.65 : 0.35,
              });
            });

            handleTerrenoClick(terreno.id);
          };

          marker.addListener("click", handleClick);
          polygon.addListener("click", handleClick);
        } catch (error) {
          //console.error("Error processing terreno:", error);
        }
      });

      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds);
        const listener = window.google.maps.event.addListenerOnce(
          mapInstance,
          "idle",
          () => {
            mapInstance.setZoom(mapInstance.getZoom());
            window.google.maps.event.removeListener(listener);
          }
        );
        setInitialBounds(bounds);
      }

      mapInstance.addListener("click", () => {
        setSelectedTerrenoId(null);
        setSelectedTerrenoName(null);
        setSelectedTerrenoFreguesia(null);
        setSelectedTerrenoArea(null);

       // Recalculate bounds to include all polygons
       const bounds = new window.google.maps.LatLngBounds();
       polygonsArray.forEach(({ polygon }) => {
         polygon.getPath().forEach((path) => {
           bounds.extend(path);
         });

    // Reset polygon fill color and opacity
    polygon.setOptions({
      fillColor: "#FFFF00",
      fillOpacity: 0.35,
    });
  });

      mapInstance.fitBounds(bounds);
    });

  }
}, [scriptLoaded, terrenos]);

  const getZoomLevelForArea = (area) => {
    if (area < 1000) {
      return 19;
    } else if (area < 5000) {
      return 18;
    } else if (area < 10000) {
      return 17;
    } else if (area < 20000) {
      return 17;
    } else if (area < 50000) {
      return 16;
    } else if (area < 100000) {
      return 16;
    } else {
      return 14;
    }
  };

  const handleTerrenoClick = async (terrenoId) => {
    setSelectedTerrenoId(terrenoId);

    try {
      const terrenoDoc = await getDoc(doc(db, "Terrenos", terrenoId));
      if (terrenoDoc.exists()) {
        const terrenoData = terrenoDoc.data();
        setSelectedTerrenoName(terrenoData.nome);
        setSelectedTerrenoFreguesia(terrenoData.freguesia);
        setSelectedTerrenoArea(terrenoData.area);
        await fetchEntidadesData(terrenoId);

        // Change polygon color
        polygons.forEach(({ id, polygon }) => {
          if (id === terrenoId) {
            polygon.setOptions({
              fillColor: "#FF0000",
              fillOpacity: 0.65,
            });
          } else {
            polygon.setOptions({
              fillColor: "#FFFF00", 
              fillOpacity: 0.35,
            });
          }
        });
      }
    } catch (error) {
      //console.error("Error fetching terreno details:", error);
    }
  };

  useEffect(() => {
    const fetchTerrenosData = async () => {
      if (userData && userData.contribuinte) {
        const terrenosQuery = query(
          collection(db, "Terrenos"),
          where("contribuinte", "==", userData.contribuinte)
        );
        const terrenosSnapshot = await getDocs(terrenosQuery);
        const terrenosData = terrenosSnapshot.docs.map((doc) => doc.data());

        setTotalTerrenos(terrenosSnapshot.size);
        const totalArea = terrenosData.reduce(
          (sum, terreno) => sum + (terreno.area || 0),
          0
        );
        setTotalArea(totalArea);

        const terrenosByFreguesiaData = {};
        terrenosData.forEach((terreno) => {
          if (terreno.freguesia) {
            const freguesia = terreno.freguesia;
            terrenosByFreguesiaData[freguesia] =
              (terrenosByFreguesiaData[freguesia] || 0) + (terreno.area || 0);
          }
        });
        setTerrenosByFreguesia(terrenosByFreguesiaData);

        const vizinhoCount = {};
        for (const terrenoDoc of terrenosSnapshot.docs) {
          const confrontacaoCollection = collection(
            db,
            "Terrenos",
            terrenoDoc.id,
            "Confrontacoes"
          );
          const confrontacaoSnapshot = await getDocs(confrontacaoCollection);

          confrontacaoSnapshot.forEach((confrontoDoc) => {
            const confrontoData = confrontoDoc.data();
            if (confrontoData.vizinho) {
              const vizinhoId = confrontoData.vizinho;
              vizinhoCount[vizinhoId] = (vizinhoCount[vizinhoId] || 0) + 1;
            }
          });
        }

        const vizinhoFrequencyData = [];
        for (const [vizinhoId, frequency] of Object.entries(vizinhoCount)) {
          const vizinhoDoc = await getDoc(
            doc(db, "Proprietario", user.uid, "Vizinhos", vizinhoId)
          );
          if (vizinhoDoc.exists()) {
            vizinhoFrequencyData.push({
              name: vizinhoDoc.data().nome,
              frequency,
            });
          }
        }

        vizinhoFrequencyData.sort((a, b) => b.frequency - a.frequency);
        setVizinhoFrequency(vizinhoFrequencyData);
      }
    };

    fetchTerrenosData();
  }, [userData]);

  const fetchEntidadesData = async (terrenoId) => {
    try {
      const confrontacoesCollectionRef = collection(db, "Terrenos", terrenoId, "Confrontacoes");
      const confrontacoesSnapshot = await getDocs(confrontacoesCollectionRef);

      const entidadesCount = {};
      for (const confrontoDoc of confrontacoesSnapshot.docs) {
        const confrontoData = confrontoDoc.data();
        if (confrontoData.entidade) {
          const entidade = confrontoData.entidade;
          entidadesCount[entidade] = (entidadesCount[entidade] || 0) + 1;
        }
      }

      setEntidadesData(entidadesCount);
    } catch (error) {
      toast.error("Erro ao carregar os dados das entidades");
    }
  };

  if (totalTerrenos === 0) {
    return (
      <Typography variant="h6" align="center" style={{ marginTop: "20px" }}>
        Não possui terrenos registados.
      </Typography>
    );
  }

  return (
    <div className="dashboard-container" >
      <Grid container spacing={3} style={{ height: "100%" }}>
        <Grid item xs={12} md={8} >
          <Card className="dashboard-card" style={{ flexGrow: 1 }}>
            <CardContent
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              <Box style={{ flex: 1 }}>
                <div className="text-2xl font-bold pt-14">
                  <div
                    id="googleMap"
                    style={{ width: "100%", height: "659px" }}
                  ></div>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          item
          xs={12}
          md={4}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card className="dashboard-card">
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {selectedTerrenoId
                      ? `Terreno selecionado`
                      : "Total Terrenos"}
                  </Typography>
                  <Typography variant="h4">
                    {selectedTerrenoId
                      ? `${selectedTerrenoName}`
                      : totalTerrenos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {selectedTerrenoId && (
              <>
                <Grid item xs={12}>
                  <Card className="dashboard-card">
                    <CardContent>
                      <Typography variant="h5" component="h2" gutterBottom>
                        Freguesia
                      </Typography>
                      <Typography variant="h4">
                        {selectedTerrenoFreguesia || "Not specified"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>

          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                {selectedTerrenoId ? `Área do Terreno` : "Total Area"}
              </Typography>
              <Typography variant="h4">
                {selectedTerrenoArea
                  ? `${selectedTerrenoArea.toFixed(2)} m²`
                  : `${totalArea.toFixed(2)} m²`}
              </Typography>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h5" className="card-title">
                {selectedTerrenoId
                  ? "Entidades nas Confrontações"
                  : "Área dos Terrenos por Freguesia"}
              </Typography>
              <div className="pie-chart-container">
                {selectedTerrenoId ? (
                  <EntidadesPieChart data={entidadesData} />
                ) : (
                  <TerrenosFreguesiaPieChart data={terrenosByFreguesia} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* 
          Card for VizinhoFrequencyChart or placeholder
          <Card className="dashboard-card">
            <CardContent>
              {vizinhoFrequency.length > 0 ? (
                <VizinhoFrequencyChart data={vizinhoFrequency} />
              ) : (
                <Typography variant="h6">Não tem dados de vizinhos</Typography>
              )}
            </CardContent>
          </Card>
          */}
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardPage;
