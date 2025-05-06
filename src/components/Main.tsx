import React, { useState, FormEvent } from "react";
import axios from "axios";
import BookCard from "./Card";

interface Book {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

const Main: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [bookData, setBookData] = useState<Book[]>([]);

  const searchBook = (e: FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `https://openlibrary.org/search.json?q=${searchTerm}`
      );
      setBookData(response.data.docs);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="main">
      <form onSubmit={searchBook}>
        <input
          type="text"
          placeholder="Search Books"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="book-list">
        {bookData.map((book) => (
          <BookCard key={book.key} book={book} />
        ))}
      </div>
    </div>
  );
};

export default Main;
