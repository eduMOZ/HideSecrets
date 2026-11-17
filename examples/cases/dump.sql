-- Database dump (invented data)
CREATE USER 'console'@'%' IDENTIFIED BY 'Fake-Sql-Pass-99';
ALTER ROLE reporting WITH PASSWORD 'Fake-Role-Pass-12';
INSERT INTO users (id, email, password_hash, api_token, name) VALUES
  (1, 'jane.doe@example.com', '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5CvgHeoSkU7rVXSx3K9Dg1wLDx7kYQi', 'fake-api-token-0001', 'Jane'),
  (2, 'john.smith@example.com', '$2b$12$aBcDeFgHiJkLmNoPqRsTuOwXyZ0123456789AbCdEfGhIjKlMnOpQ', 'fake-api-token-0002', 'John');
INSERT INTO settings (key, value) VALUES ('theme', 'dark');
