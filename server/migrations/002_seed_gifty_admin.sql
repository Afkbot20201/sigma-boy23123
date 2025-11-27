INSERT INTO users (username,email,password_hash,elo_rating,rank_tier,role)
VALUES (
  'Gifty',
  'gifty@example.com',
  '$2b$10$gZyCz7hhNaUGX2HvdBfRmOvUuL0gMHqOozNZJYDUXlE/8cJcfo7oW',
  1600,
  'Gold',
  'admin'
)
ON CONFLICT (username) DO NOTHING;
