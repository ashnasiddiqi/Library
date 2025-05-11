import React, { useState } from "react";

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    imageLinks?: { thumbnail: string };
  };
}

interface SearchBarProps {
  onResults: (books: Book[]) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResults }) => {
  const [query, setQuery] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      onResults(data.items || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ marginBottom: "2rem" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for books…"
        style={{ padding: "0.5rem", width: "70%" }}
      />
      <button
        type="submit"
        style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
