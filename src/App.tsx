import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import SearchBar from "./components/SearchBar";
import RecommendedBooks from "./components/RecommendedBooks";
import Auth from "./components/Auth";
import BookInteraction from "./components/BookInteraction";
import Profile from "./components/Profile";
import AIBookBot from "./components/AIBookBot";
import "./components/style.css";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const AppContent: React.FC<{
  user: User | null;
  handleLogin: (user: User, token: string) => void;
  handleLogout: () => void;
  searchResults: any[] | null;
  setSearchResults: (results: any[] | null) => void;
}> = ({ user, handleLogin, handleLogout, searchResults, setSearchResults }) => {
  const location = useLocation();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Your existing header and routes */}
      <header className="header">
        <div className="row1">
          <h1>Welcome to Library Lookup</h1>
        </div>
        <div className="row2">
          {user ? (
            <>
              <p>
                Welcome, <Link to="/profile">{user.username}</Link>!
              </p>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : location.pathname === "/" ? (
            <Auth onLogin={handleLogin} />
          ) : (
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              Login to continue
            </Link>
          )}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <>
              <SearchBar onResults={(results) => setSearchResults(results)} />

              {searchResults && (
                <div style={{ textAlign: "center", margin: "1rem 0" }}>
                  <button
                    onClick={() => setSearchResults(null)}
                    style={{
                      padding: "0.5rem 1.2rem",
                      backgroundColor: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    Clear Search / Home
                  </button>
                </div>
              )}

              <div className="main-content">
                <RecommendedBooks overrideBooks={searchResults ?? undefined} />
              </div>
            </>
          }
        />
        <Route path="/books/:id" element={<BookInteraction user={user} />} />
        <Route path="/profile" element={<Profile user={user} />} />
      </Routes>

      {/* AI Chatbot - placed at the end */}
      <AIBookBot />
    </div>
  );
};

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <Router>
      <AppContent
        user={user}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
      />
    </Router>
  );
};

export default App;