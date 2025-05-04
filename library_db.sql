INSERT INTO users (username, email) 
VALUES ('booklover', 'reader@example.com')
RETURNING user_id;  -- This shows the new user's ID

-- Insert a test user
INSERT INTO users (username, email) 
VALUES ('bookreader', 'reaer@example.com');

-- Insert a test book
INSERT INTO books (isbn, title, author, published_year)
VALUES ('9781234567890', 'The Little Book', 'Ally Lot', 2023);

-- Insert a review
INSERT INTO reviews (user_id, isbn, rating, review_text)
VALUES (1, '9781234567890', 5, 'Great!');