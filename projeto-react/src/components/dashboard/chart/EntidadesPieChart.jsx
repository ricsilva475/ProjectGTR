import React from "react";
import { Pie } from "react-chartjs-2";
import { Typography } from "@mui/material";

const EntidadesPieChart = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return <Typography variant="h6">Sem dados de vizinhos</Typography>;
      }

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#FF9F40",
          "#4BC0C0",
          "#9966FF",
          "#FF6384",
        ],
      },
    ],
  };

  const pieOptions = {
    responsive: true, 
    maintainAspectRatio: false, 
    aspectRatio: 1.9, 
  };

  return <Pie data={chartData} options={pieOptions}/>;
};

export default EntidadesPieChart;
