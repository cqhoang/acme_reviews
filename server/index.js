const {
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
} = require("./db");
const express = require("express");
const app = express();
app.use(express.json());

const isLoggedIn = async (req, res, next) => {
  try {
    req.user = await findUserByToken(req.headers.authorization);
    next();
  } catch (ex) {
    next(ex);
  }
};

// GET /api/items
app.get("/api/items", async (req, res, next) => {
  try {
    res.send(await fetchItems());
  } catch (ex) {
    next(ex);
  }
});

// GET /api/items/:id
app.get("/api/items/:id", async (req, res, next) => {
  try {
    const items = await fetchItems();
    const item = items.find((item) => item.id === req.params.id);
    if (!item) {
      res.status(404).send({ error: "Item not found" });
    } else {
      res.send(item);
    }
  } catch (ex) {
    next(ex);
  }
});

// POST /api/auth/register
app.post("/api/auth/register", async (req, res, next) => {
  try {
    res.send(await createUserAndGenerateToken(req.body));
  } catch (ex) {
    next(ex);
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res, next) => {
  try {
    res.send(await authenticate(req.body));
  } catch (ex) {
    next(ex);
  }
});

// GET /api/auth/me
app.get("/api/auth/me", isLoggedIn, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

// GET /api/items/:itemId/reviews
app.get("/api/items/:itemId/reviews", async (req, res, next) => {
  try {
    res.send(await fetchReviews(req.params.itemId));
  } catch (ex) {
    next(ex);
  }
});

// GET /api/items/:itemId/reviews/:id
app.get("/api/items/:itemId/reviews/:id", async (req, res, next) => {
  try {
    const reviews = await fetchReviews(req.params.itemId);
    const review = reviews.find((review) => review.id === req.params.id);
    if (!review) {
      res.status(404).send({ error: "Review not found" });
    } else {
      res.send(review);
    }
  } catch (ex) {}
});

// POST /api/items/:itemId/reviews (isLoggedIn)
app.post("/api/items/:itemId/reviews", isLoggedIn, async (req, res, next) => {
  try {
    const review = await createReview({
      user_id: req.user.id,
      item_id: req.params.id,
      ...req.body,
    });
    res.status(201).send(review);
  } catch (ex) {
    next(ex);
  }
});

// GET /api/reviews/me
app.get("/api/reviews/me", async (req, res, next) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      res.status(400).send({ error: "User ID required" });
      return;
    }
    const reviews = await fetchReviews();
    const userReviews = reviews.filter((review) => review.user_id === userId);
    res.send(userReviews);
  } catch (ex) {
    next(ex);
  }
});

// PUT /api/users/:userId/reviews/:id (isLoggedIn)
app.put(
  "/api/users/:userId/reviews/:id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const { rating, review } = req.body;
      const SQL = `--sql
      UPDATE reviews
      SET rating = $1, review = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
      const response = await client.query(SQL, [
        rating,
        review,
        req.params.id,
        req.params.userId,
      ]);
      if (!response.rows.length) {
        res.status(404).send({ error: "Review not found/not authorized" });
      } else {
        res.send(response.rows[0]);
      }
    } catch (ex) {
      next(ex);
    }
  }
);

// DELETE /api/users/:userId/reviews/:id (isLoggedIn)
app.delete(
  "/api/users/:userId/reviews/:id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      if (req.user.id !== req.params.user_id) {
        const error = Error("not authorized");
        error.status = 401;
        throw error;
      }
      await destroyReview({ user_id: req.params.user_id, id: req.params.id });
    } catch (ex) {
      next(ex);
    }
  }
);
// POST /api/items/:itemId/reviews/:id/comments (isLoggedIn)
app.post(
  "/api/items/:itemId/reviews/:reviewId/comments",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const comment = await createComment({
        review_id: req.params.reviewId,
        user_id: req.user.id,
        ...req.body,
      });
      res.status(201).send(comment);
    } catch (ex) {
      next(ex);
    }
  }
);

// GET /api/comments/me
app.get("/api/comments/me", async (req, res, next) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      res.status(400).send({ error: "User Id required" });
      return;
    }
    const comments = await fetchComments();
    const userComments = comments.filter(
      (comment) => comment.user_id === userId
    );
    res.send(userComments);
  } catch (ex) {
    next(ex);
  }
});

// PUT /api/users/:userId/comments/:id (isLoggedIn)
app.put(
  "/api/users/:userId/comments/:id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const { comment } = req.body;
      const SQL = `--sql
      UPDATE comments
      SET comments = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
      const response = await client.query(SQL, [
        comment,
        req.params.id,
        req.params.userId,
      ]);
      if (!response.rows.length) {
        res.status(404).send({ error: "Comment not found/not authorized" });
      } else {
        res.send(response.rows[0]);
      }
    } catch (ex) {
      next(ex);
    }
  }
);

// DELETE /api/users/:userId/comments/:id (isLoggedIn)
app.delete(
  "/api/users/:userId/comments/:id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      await destroyComment(req.params.id);
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

const init = async () => {
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("tables created");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
