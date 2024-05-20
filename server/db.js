require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_reviews"
);
const UUID = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT;

const createTables = async () => {
  const SQL = `--sql
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id UUID PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL
    );

    CREATE TABLE items (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT
    );

    CREATE TABLE reviews (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      item_id UUID REFERENCES items(id) NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      review TEXT
    );

    CREATE TABLE comments (
      id UUID PRIMARY KEY,
      review_id UUID REFERENCES reviews(id) NOT NULL,
      user_id UUID REFERENCES users(id) NOT NULL,
      comment TEXT NOT NULL
    );
  `;
  await client.query(SQL);
};

const createUser = async ({ username, password }) => {
  const SQL = `--sql
    INSERT INTO users(id, username, password) 
    VALUES($1, $2, $3) 
    RETURNING *
    `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    await bcrypt.hash(password, 5),
  ]);
  return response.rows[0];
};

const createItem = async ({ name, description }) => {
  const SQL = `--sql
    INSERT INTO items(id, name, description)
    VALUES($1, $2, $3)
    RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name, description]);
  return response.rows[0];
};

const createReview = async ({ user_id, item_id, rating, review }) => {
  const SQL = `--sql
    INSERT INTO reviews(id, user_id, item_id, rating, review)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    user_id,
    item_id,
    rating,
    review,
  ]);
  return response.rows[0];
};

const createComment = async ({ review_id, user_id, comment }) => {
  const SQL = `--sql
    INSERT INTO comments(id, review_id, user_id, comment)
    VALUES($1, $2, $3, $3)
    RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    review_id,
    user_id,
    comment,
  ]);
  return response.rows[0];
};

const authenticate = async ({ username, password }) => {
  const SQL = `--sql
    SELECT id, password
    FROM users
    WHERE username = $1
    `;
  const response = await client.query(SQL, [username]);

  if (
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) === false
  ) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, JWT);
  console.log(token);

  return { token };
};

const findUserByToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    console.log("payload", payload);
    id = payload.id;
  } catch (ex) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }

  const SQL = `--sql
    SELECT id, username
    FROM users
    WHERE id = $1
    `;

  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `--sql
    SELECT id, username
    FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchItems = async () => {
  const SQL = `--sql
    SELECT id, name, description
    FROM items
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchReviews = async (item_id) => {
  const SQL = `--sql
    SELECT id, user_id, item_id, rating, review 
    FROM reviews
    WHERE item_id = $1
  `;
  const response = await client.query(SQL, [itemId]);
  return response.rows;
};

const fetchComments = async (reviewId) => {
  const SQL = `--sql
    SELECT id, review_id, user_id, comment
    FROM comments
    WHERE review_id = $1
  `;
  const response = await client.query(SQL, [reviewId]);
  return response.rows;
};

const deleteReview = async (reviewId) => {
  const SQL = `--sql
    DELETE FROM reviews
    WHERE id = $1
  `;
  await client.query(SQL, [reviewId]);
};

const deleteComment = async (commentId) => {
  const SQL = `--sql
    DELETE FROM comments 
    WHERE id = $1
  `;
  await client.query(SQL, [commentId]);
};

module.exports = {
  client,
  createTables,
  createUser,
  createItem,
  createReview,
  createComment,
  fetchUsers,
  fetchItems,
  fetchReviews,
  fetchComments,
  deleteReview,
  deleteComment,
  authenticate,
  findUserByToken,
};
