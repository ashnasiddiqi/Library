import React, { useEffect, useState } from "react";

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    imageLinks?: { thumbnail: string };
  };
}

const recommendedTitles = [
  "The Great Gatsby",
  "Diary of a Wimpy Kid",
  "The Scarlet Alchemist",
  "The Blood Orchid",
  "The Rainbow Fish",
  "Matilda",
  "A Bad Case of Stripes",
  "1984",
  "Harry Potter and the Deathly Hallows",
  "Harry Potter and the Sorcerer's Stone",
  "Pride and Prejudice",
  "To Kill a Mockingbird",
];

interface RecommendedBooksProps {
  overrideBooks?: Book[];
}

const RecommendedBooks: React.FC<RecommendedBooksProps> = ({
  overrideBooks,
}) => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (overrideBooks) return; 
    Promise.all(
      recommendedTitles.map((title) =>
        fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
            title
          )}`
        )
          .then((res) => res.json())
          .then((data) => data.items?.[0])
      )
    )
      .then((results) => setBooks(results.filter(Boolean)))
      .catch((err) => console.error("Failed to load books", err));
  }, [overrideBooks]);

  const toShow = overrideBooks ?? books;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
      {toShow.map((book) => (
        <a
          key={book.id}
          href={`book.html?bookId=${book.id}`}
          style={{ textDecoration: "none", color: "inherit", width: 150 }}
        >
          <img
            src={book.volumeInfo.imageLinks?.thumbnail}
            alt={book.volumeInfo.title}
            style={{ width: "100%" }}
          />
          <p style={{ margin: 0 }}>{book.volumeInfo.title}</p>
        </a>
      ))}
    </div>
  );
};

export default RecommendedBooks;
