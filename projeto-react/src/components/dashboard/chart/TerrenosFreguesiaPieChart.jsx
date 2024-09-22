import React, { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs, where, query, doc, getDoc } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { Chart, registerables } from 'chart.js'; 
import { Pie } from "react-chartjs-2";
Chart.register(...registerables);

const TerrenosFreguesiaPieChart = () => {
  const [freguesiaData, setFreguesiaData] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userId = user.uid;
        const userDoc = doc(db, 'Proprietario', userId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          setUserData(userSnapshot.data());
          fetchTerrenosByFreguesia(userSnapshot.data().contribuinte);
        }
      }
    };
  
    fetchUserData();
  }, [user]);

  const fetchTerrenosByFreguesia = async (contribuinte) => {
    const terrenosCollection = collection(db, "Terrenos");
    const userTerrenosQuery = query(terrenosCollection, where("contribuinte", "==", contribuinte));
    
    const terrenosSnapshot = await getDocs(userTerrenosQuery);
    const terrenosList = terrenosSnapshot.docs.map(doc => doc.data());
    
    const terrenosAreaByFreguesia = {};
    terrenosList.forEach(terreno => {
      const { freguesia, area } = terreno;
      terrenosAreaByFreguesia[freguesia] = (terrenosAreaByFreguesia[freguesia] || 0) + area;
    });

    setFreguesiaData(terrenosAreaByFreguesia);
  };

  const pieChartData = {
    labels: Object.keys(freguesiaData).map(freguesia => `${freguesia} (m²)`),
    datasets: [
      {
        data: Object.values(freguesiaData),
        backgroundColor: [
            'rgba(255, 99, 132, 0.6)', 
            'rgba(54, 162, 235, 0.6)', 
            'rgba(255, 206, 86, 0.6)', 
            'rgba(75, 192, 192, 0.6)', 
            'rgba(153, 102, 255, 0.6)', 
            'rgba(255, 159, 64, 0.6)', 
            'rgba(255, 0, 255, 0.6)', 
            'rgba(0, 255, 255, 0.6)', 
        ],
      },
    ],
  };



  return (
    <div>
      <Pie data={pieChartData}/>
    </div>
  );
};

export default TerrenosFreguesiaPieChart;
