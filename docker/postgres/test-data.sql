\connect federation

INSERT INTO enterprise.account (name, email, password, refresh_token) VALUES
  ('admin', 'admin@localhost', 'hunter2', 'refr3sh');

INSERT INTO enterprise.employer (name, location, url) VALUES
  ('Company', 'San Francisco, CA', 'http://www.somesite.com');
