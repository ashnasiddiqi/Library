import React, { useState } from "react";
import SearchBar from "./components/SearchBar";
import RecommendedBooks from "./components/RecommendedBooks";
import "./components/style.css";

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  return (
    <div className="App">
      <h1>Welcome to Library Lookup</h1>

      
      <SearchBar onResults={(results) => setSearchResults(results)} />

      
      <RecommendedBooks overrideBooks={searchResults ?? undefined} />
    </div>
  );
};

export default App;
