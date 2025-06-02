import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import SearchBar from "./components/SearchBar";
import RecommendedBooks from "./components/RecommendedBooks";
import Auth from "./components/Auth";
import BookInteraction from "./components/BookInteraction";
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
    <div className="App">
      <header className="header">
        <div className="row1">
          <h1>Welcome to Library Lookup</h1>
        </div>
        <div className="row2">
          {user ? (
            <>
              <p>Welcome, {user.username}!</p>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : location.pathname === "/" ? (
            <Auth onLogin={handleLogin} />
          ) : null}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <>
              <SearchBar onResults={(results) => setSearchResults(results)} />
              <RecommendedBooks overrideBooks={searchResults ?? undefined} />
            </>
          }
        />
        <Route path="/books/:id" element={<BookInteraction />} />
      </Routes>
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
