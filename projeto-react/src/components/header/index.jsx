import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import { doSignOut } from "../../firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import "./header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLoggedIn } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  // Don't render the navbar on the login or register page
  if (location.pathname === "/" || location.pathname === "/register") {
    return null;
  }

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleToggleMobileDropdown = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  const handleLogout = () => {
    doSignOut().then(() => {
      navigate("/");
    });
  };

  return (
    <nav className="custom-navbar">
      <div className="custom-navbar-container">
        {/* Normal menu for larger screens */}
        <ul className="custom-navbar-menu">
          {userLoggedIn ? (
            <>
              <li>
                <Link to="/home">Home</Link>
              </li>
              <li>
                <Link to="/terrenos">Adicionar</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/vizinhos">Vizinhos</Link>
              </li>
              <li className="dropdown">
              <button onClick={handleToggleDropdown}>
                    Conta <FontAwesomeIcon icon={faCaretDown} style={{ marginLeft: '6px' }} />
                  </button>
                {isDropdownOpen && (
                  <ul className="menu-dropdown">
                    <li>
                      <Link to="/perfil">Perfil</Link>
                    </li>
                    <li>
                      <button onClick={handleLogout}>Logout</button>
                    </li>
                  </ul>
                )}
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/">Login</Link>
              </li>
              <li>
                <Link to="/register">Register New Account</Link>
              </li>
            </>
          )}
        </ul>

        {/* Hamburger menu for mobile */}
        <button
          className={`custom-navbar-toggler ${isMenuOpen ? "open" : ""}`}
          onClick={handleToggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile menu */}
        <ul className={`custom-navbar-menu-mobile ${isMenuOpen ? "open" : ""}`}>
          {userLoggedIn ? (
            <>
              <li>
                <Link to="/home" onClick={handleToggleMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/terrenos" onClick={handleToggleMenu}>
                  Adicionar
                </Link>
              </li>
              <li>
                <Link to="/dashboard" onClick={handleToggleMenu}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/vizinhos" onClick={handleToggleMenu}>
                  Vizinhos
                </Link>
              </li>
              <li>
        <Link to="/perfil" onClick={() => {handleToggleMenu();}}>Perfil</Link>
      </li>
      <li className="logout-button-container">
        <button
          onClick={() => {
            doSignOut().then(() => {
              navigate("/login");
              handleToggleMenu();
            });
          }}
        >
          Logout
        </button>
      </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" onClick={handleToggleMenu}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" onClick={handleToggleMenu}>
                  Register New Account
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Header;
