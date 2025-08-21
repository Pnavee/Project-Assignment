-- Optional SQL schema (PostgreSQL) for the Securin Recipe Assignment

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  cuisine VARCHAR(100),
  title VARCHAR(255),
  rating FLOAT,
  prep_time INTEGER,
  cook_time INTEGER,
  total_time INTEGER,
  description TEXT,
  nutrients JSONB,
  serves VARCHAR(50)
);

-- Recommended indexes
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes (rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes (cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm ON recipes USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes (total_time);


