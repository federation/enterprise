\connect federation

INSERT INTO enterprise.account (name, email, password) VALUES
  -- Password: hunter2
  ('admin', 'admin@localhost', '$argon2i$v=19$m=4096,t=3,p=1$/3hWdNA0hknr8cBBCTfyyg$9G8nvXOv/pczXoZy2PUMqO0dE5Vuz22Xe0z000e4NcU');

INSERT INTO enterprise.employer (name, location, url) VALUES
  ('Company', 'San Francisco, CA', 'http://www.somesite.com');
