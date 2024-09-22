import React from 'react';
import { Chart, registerables } from 'chart.js'; 
import { Bar } from 'react-chartjs-2';
Chart.register(...registerables);


const VizinhoFrequencyChart = ({ data }) => {
    // Extracting names and frequencies from data
    const names = data.map(item => item.name);
    const frequencies = data.map(item => item.frequency);
  
    // Define colors for each bar
    const colors = [
        'rgba(255, 99, 132, 0.6)', // Red
        'rgba(54, 162, 235, 0.6)', // Blue
        'rgba(255, 206, 86, 0.6)', // Yellow
        'rgba(75, 192, 192, 0.6)', // Green
        'rgba(153, 102, 255, 0.6)', // Purple
        'rgba(255, 159, 64, 0.6)', // Orange
        'rgba(255, 0, 255, 0.6)', // Magenta
        'rgba(0, 255, 255, 0.6)', // Cyan
    ];
  
    // Create dataset for the chart
    const chartData = {
      labels: names,
      datasets: [
        {
          label: 'Frequency',
          data: frequencies,
          backgroundColor: colors.slice(0, data.length), // Use a slice of colors array based on the number of bars
          borderWidth: 1,
        },
      ],
    };
  
    // Customize chart options if needed
    const chartOptions = {
        
    };
  
    return <Bar data={chartData} options={chartOptions} />;
  };
  

export default VizinhoFrequencyChart;
