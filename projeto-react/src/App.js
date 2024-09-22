import React from 'react';
import { createTheme} from '@mui/material/styles';
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Header from "./components/header";
import Home from "./components/home";
import Maps from "./components/maps";
import Profile from "./components/profile";
import EditProfile from "./components/profile/edit";
import Password from "./components/profile/password";
import AddTerreno from "./components/terrenos/new_terreno";
import TerrenosView from "./components/terrenos/terrenos_form";
import Fotos from "./components/fotos";
import Vizinhos from './components/vizinhos';
import Terrenos from './components/terrenos/all_terrenos';
import Marcos from './components/terrenos/marcos';
import Desenho_terreno from './components/terrenos/terreno_view';
import Confrontacoes from './components/terrenos/confrontacoes';
import Poligono from './components/terrenos/poligono';
import { AuthProvider } from "./contexts/authContext";
import { useRoutes, BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardPage from "./components/dashboard/DashboardPage";
import TerrenosPage from "./components/dashboard/TerrenosPage";
import TerrenoDetailsPage from "./components/dashboard/TerrenoDetailsPage";
import RouteGuard from './components/auth/RouteGuard';
import 'react-toastify/dist/ReactToastify.css';

const theme = createTheme();

function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/allTerrenos",
      element: <Maps />,
    },
    {
      path: "/perfil",
      element: <Profile />,
    },
    {
      path: "/perfil/edit",
      element: <EditProfile />,
    },
    {
      path: "/terrenos/:id/fotos",
      element: <Fotos />,
    },
    {
      path: "/perfil/edit/password",
      element: <Password />,
    },
    {
      path: "/terrenos",
      element: <AddTerreno />,
    },
    {
      path: "/terrenos/:id",
      element: <TerrenosView />,
    },
    {
      path: "/terrenos/:id/desenho",
      element: <Desenho_terreno />,
    },
    {
      path: "/terrenos/:id/desenho/marcos",
      element: <Marcos />,
    },
    {
      path: "/terrenos/:id/desenho/poligono",
      element: <Poligono />,
    },
    {
      path: "/terrenos/:id/desenho/confrontações",
      element: <Confrontacoes />,
    },
    {
      path: "/all_terrenos",
      element: <Terrenos />,
    },
    {
      path: "/vizinhos",
      element: <Vizinhos />,
    },
    {
      path: "/dashboard",
      element: <DashboardLayout />,
      children: [
        {
          index: true,
          element: <DashboardPage />,
        },
        {
          path: "terrenos",
          element: <TerrenosPage />,
        },
        {
          path: "terrenos/:terrenoId",
          element: <TerrenoDetailsPage />,
        },
      ],
    },
  ];

  let routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
        <RouteGuard>
          <Header />
          <div className="w-full h-screen flex flex-col">{routesElement}</div>
          <ToastContainer />
        </RouteGuard>
    </AuthProvider>
  );
}

export default App;
