CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  goal        TEXT NOT NULL,
  experience  TEXT,
  gender      TEXT,
  age         INT,
  height      REAL,
  weight      REAL,
  activity    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weight_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value       REAL NOT NULL,
  logged_at   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_weight_logs_user_time ON weight_logs(user_id, logged_at DESC);

CREATE TABLE calorie_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value       INT NOT NULL,
  logged_at   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_calorie_logs_user_time ON calorie_logs(user_id, logged_at DESC);

CREATE TABLE workout_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_workout_logs_user_time ON workout_logs(user_id, logged_at DESC);

CREATE TABLE exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  weight      REAL NOT NULL,
  reps        INT NOT NULL,
  sets        INT NOT NULL DEFAULT 1
);

CREATE TABLE checkins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  value       TEXT NOT NULL,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_checkins_user_time ON checkins(user_id, logged_at DESC);

CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_key        TEXT NOT NULL,
  status          TEXT NOT NULL,
  status_label    TEXT,
  confidence      TEXT,
  calorie_action  TEXT NOT NULL,
  workout_action  TEXT NOT NULL,
  reason          TEXT,
  weight_trend    TEXT,
  strength_trend  TEXT,
  delta           REAL,
  avg_weight      REAL,
  avg_calories    REAL,
  result_json     JSONB,
  locked          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_key)
);
