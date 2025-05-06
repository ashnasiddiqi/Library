import React from "react";

interface Book {
  title: string;
  author_name?: string[];
  cover_i?: number;
}

interface Props {
  book: Book;
}

const BookCard: React.FC<Props> = ({ book }) => {
  return (
    <div className="book-card">
      <h3>{book.title}</h3>
      <p>{book.author_name?.join(", ")}</p>
      {book.cover_i && (
        <img
          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
          alt={book.title}
        />
      )}
    </div>
  );
};

export default BookCard;
