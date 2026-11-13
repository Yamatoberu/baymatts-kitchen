CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY,
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
