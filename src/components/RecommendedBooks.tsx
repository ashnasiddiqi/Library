import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    imageLinks?: { thumbnail: string };
    categories?: string[];
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
  "The Catcher in the Rye",
  "The Lord of the Rings",
  "Dune",
  "The Way of Kings",
  "Red Rising",
  "A Court of Thorns and Roses",
  "It Ends with Us",
  "Fourth Wing",
  "Eragon",
  "The Hunger Games",
  "Darkly Dreaming Dexter",
  "The Quantum Thief",
  "The Witcher",
  "Twilight",
  "The Lightning Thief",
  "World War Z",
  "The Da Vinci Code",
  "The Alchemist",
  "Percy Jackson and the Olympians",
  "The Maze Runner",
  "The Book Thief",
  "Ready Player One",
  "The Midnight Library",
  "The Seven Husbands of Evelyn Hugo",
  "Verity",
  "Ugly Love",
  "The Silent Patient",
  "A Man Called Ove",
  "The Night Circus",
  "Where the Crawdads Sing",
  "Beach Read",
  "The Love Hypothesis",
  "Project Hail Mary",
  "Atomic Habits",
  "Sapiens",
  "Educated",
  "The Subtle Art of Not Giving a F*ck",
  "Can’t Hurt Me",
  "Born a Crime",
  "Before We Were Strangers",
  "It Starts with Us",
  "Little Fires Everywhere",
  "Shatter Me",
  "Anxious People",
  "The Paris Library",
  "Reminders of Him",
  "The Paper Palace",
  "All the Light We Cannot See",
  "The Guest List",
  "Daisy Jones & The Six",
  "The House in the Cerulean Sea",
  "The Spanish Love Deception",
  "Circe",
  "The Atlas Six",
  "The Inheritance Games",
  "The Silent Corner"
];




interface RecommendedBooksProps {
  overrideBooks?: Book[];
}

const RecommendedBooks: React.FC<RecommendedBooksProps> = ({ overrideBooks }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [showGenreFilter, setShowGenreFilter] = useState(false);

  useEffect(() => {
  if (overrideBooks) return;


  const cached = localStorage.getItem("recommended_books");
  if (cached) {
    setBooks(JSON.parse(cached));
    return;
  }

    Promise.all(
      recommendedTitles.map((title) =>
        fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`
        )
          .then((res) => res.json())
          .then((data) => data.items?.[0])
      )
    )
      .then((results) => {
        const filtered = results.filter(Boolean);
        setBooks(filtered);
        localStorage.setItem("recommended_books", JSON.stringify(filtered));
      })
      .catch((err) => console.error("Failed to load books", err));
  }, [overrideBooks]);

  const toShow = overrideBooks ?? books;

  const allGenres = Array.from(
    new Set(toShow.flatMap((book) => book.volumeInfo.categories || []))
  ).sort();

  const filteredBooks = selectedGenre
    ? toShow.filter((book) =>
        book.volumeInfo.categories?.includes(selectedGenre)
      )
    : toShow;

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setShowGenreFilter(!showGenreFilter)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Filter by Genre
        </button>

        {showGenreFilter && (
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">All Genres</option>
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {filteredBooks.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              width: 150,
              transition: "transform 0.2s",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={book.volumeInfo.imageLinks?.thumbnail}
              alt={book.volumeInfo.title}
              style={{ width: "100%" }}
            />
            <p style={{ margin: 0 }}>{book.volumeInfo.title}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
              {book.volumeInfo.categories?.[0] || "No genre listed"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedBooks;
