-- ============================================================
-- MSSQL Stored Procedures for Karate Club API
-- ============================================================
USE KarateClub;
GO

-- ============================================================
-- ADMINS
-- ============================================================
CREATE OR ALTER PROCEDURE sp_admin_login
    @login NVARCHAR(100),
    @password NVARCHAR(255)
AS
BEGIN
    SELECT id, login, password, superAdmin FROM admins WHERE login = @login;
END
GO

CREATE OR ALTER PROCEDURE sp_admins_get_all
AS
BEGIN
    SELECT id, login, superAdmin, createdAt FROM admins ORDER BY id;
END
GO

CREATE OR ALTER PROCEDURE sp_admin_create
    @login NVARCHAR(100),
    @password NVARCHAR(255),
    @superAdmin BIT = 0
AS
BEGIN
    INSERT INTO admins (login, password, superAdmin)
    VALUES (@login, @password, @superAdmin);
    SELECT SCOPE_IDENTITY() AS id;
END
GO

CREATE OR ALTER PROCEDURE sp_admin_delete
    @id INT
AS
BEGIN
    DELETE FROM admins WHERE id = @id;
END
GO

-- ============================================================
-- ARTICLES
-- ============================================================
CREATE OR ALTER PROCEDURE sp_articles_get_all
AS
BEGIN
    SELECT id, title, content, filePath, createdAt, updatedAt
    FROM articles ORDER BY createdAt DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_articles_get_by_id
    @id INT
AS
BEGIN
    SELECT id, title, content, filePath, createdAt, updatedAt
    FROM articles WHERE id = @id;
END
GO

CREATE OR ALTER PROCEDURE sp_article_create
    @title NVARCHAR(500),
    @content NVARCHAR(MAX) = NULL,
    @filePath NVARCHAR(500) = NULL
AS
BEGIN
    INSERT INTO articles (title, content, filePath)
    VALUES (@title, @content, @filePath);
    SELECT SCOPE_IDENTITY() AS id;
END
GO

CREATE OR ALTER PROCEDURE sp_article_update
    @id INT,
    @title NVARCHAR(500),
    @content NVARCHAR(MAX) = NULL,
    @filePath NVARCHAR(500) = NULL
AS
BEGIN
    UPDATE articles
    SET title = @title, content = @content, filePath = @filePath, updatedAt = GETDATE()
    WHERE id = @id;
END
GO

CREATE OR ALTER PROCEDURE sp_article_delete
    @id INT
AS
BEGIN
    DELETE FROM articles WHERE id = @id;
END
GO

-- ============================================================
-- ARTICLE COMMENTS
-- ============================================================
CREATE OR ALTER PROCEDURE sp_comments_get_by_article
    @articleId INT
AS
BEGIN
    SELECT id, articleId, author, text, createdAt
    FROM article_comments WHERE articleId = @articleId
    ORDER BY createdAt ASC;
END
GO

CREATE OR ALTER PROCEDURE sp_comment_create
    @articleId INT,
    @author NVARCHAR(200),
    @text NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO article_comments (articleId, author, text)
    VALUES (@articleId, @author, @text);
    SELECT SCOPE_IDENTITY() AS id;
END
GO

-- ============================================================
-- NEWS
-- ============================================================
CREATE OR ALTER PROCEDURE sp_news_get_all
AS
BEGIN
    SELECT id, title, content, filePath, createdAt
    FROM news ORDER BY createdAt DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_news_create
    @title NVARCHAR(500),
    @content NVARCHAR(MAX) = NULL,
    @filePath NVARCHAR(500) = NULL
AS
BEGIN
    INSERT INTO news (title, content, filePath)
    VALUES (@title, @content, @filePath);
    SELECT SCOPE_IDENTITY() AS id;
END
GO

CREATE OR ALTER PROCEDURE sp_news_update
    @id INT,
    @title NVARCHAR(500),
    @content NVARCHAR(MAX) = NULL,
    @filePath NVARCHAR(500) = NULL
AS
BEGIN
    UPDATE news SET title = @title, content = @content, filePath = @filePath
    WHERE id = @id;
END
GO

CREATE OR ALTER PROCEDURE sp_news_delete
    @id INT
AS
BEGIN
    DELETE FROM news WHERE id = @id;
END
GO

-- ============================================================
-- INSTRUCTORS
-- ============================================================
CREATE OR ALTER PROCEDURE sp_instructors_get_all
AS
BEGIN
    SELECT id, name, title, photo, description, sortOrder, createdAt
    FROM instructors ORDER BY sortOrder ASC, id ASC;
END
GO

CREATE OR ALTER PROCEDURE sp_instructor_create
    @name NVARCHAR(200),
    @title NVARCHAR(500) = NULL,
    @photo NVARCHAR(500) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @sortOrder INT = 0
AS
BEGIN
    INSERT INTO instructors (name, title, photo, description, sortOrder)
    VALUES (@name, @title, @photo, @description, @sortOrder);
    SELECT SCOPE_IDENTITY() AS id;
END
GO

CREATE OR ALTER PROCEDURE sp_instructor_update
    @id INT,
    @name NVARCHAR(200),
    @title NVARCHAR(500) = NULL,
    @photo NVARCHAR(500) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @sortOrder INT = 0
AS
BEGIN
    UPDATE instructors
    SET name = @name, title = @title, photo = @photo,
        description = @description, sortOrder = @sortOrder
    WHERE id = @id;
END
GO

CREATE OR ALTER PROCEDURE sp_instructor_delete
    @id INT
AS
BEGIN
    DELETE FROM instructors WHERE id = @id;
END
GO

-- ============================================================
-- SCHEDULE
-- ============================================================
CREATE OR ALTER PROCEDURE sp_schedule_get_all
AS
BEGIN
    SELECT id, dayOfWeek, time, group_name, description, sortOrder, createdAt
    FROM schedule ORDER BY sortOrder ASC, id ASC;
END
GO

CREATE OR ALTER PROCEDURE sp_schedule_create
    @dayOfWeek NVARCHAR(50),
    @time NVARCHAR(50),
    @group_name NVARCHAR(200) = NULL,
    @description NVARCHAR(500) = NULL,
    @sortOrder INT = 0
AS
BEGIN
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder)
    VALUES (@dayOfWeek, @time, @group_name, @description, @sortOrder);
    SELECT SCOPE_IDENTITY() AS id;
END
GO

CREATE OR ALTER PROCEDURE sp_schedule_update
    @id INT,
    @dayOfWeek NVARCHAR(50),
    @time NVARCHAR(50),
    @group_name NVARCHAR(200) = NULL,
    @description NVARCHAR(500) = NULL,
    @sortOrder INT = 0
AS
BEGIN
    UPDATE schedule
    SET dayOfWeek = @dayOfWeek, time = @time, group_name = @group_name,
        description = @description, sortOrder = @sortOrder
    WHERE id = @id;
END
GO

CREATE OR ALTER PROCEDURE sp_schedule_delete
    @id INT
AS
BEGIN
    DELETE FROM schedule WHERE id = @id;
END
GO

PRINT 'All stored procedures created successfully.';
GO
