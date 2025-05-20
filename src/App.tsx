import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import RecommendedBooks from './components/RecommendedBooks';
import Auth from './components/Auth';
import './components/style.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

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
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </div>
      </header>
      <SearchBar onResults={(results) => setSearchResults(results)} />
      <RecommendedBooks overrideBooks={searchResults ?? undefined} />
    </div>
  );
};

export default App;