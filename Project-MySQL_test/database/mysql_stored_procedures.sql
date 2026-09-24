-- ============================================================
-- MySQL Stored Procedures for Karate Club API
-- ============================================================

USE karate_club;

SET NAMES utf8mb4;

-- ============================================================
-- ADMINS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_admin_login;
DELIMITER //
CREATE PROCEDURE sp_admin_login(
    IN p_login VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    SELECT id, login, password, superAdmin
    FROM admins
    WHERE login = p_login;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_admins_get_all;
DELIMITER //
CREATE PROCEDURE sp_admins_get_all()
BEGIN
    SELECT id, login, superAdmin, createdAt
    FROM admins
    ORDER BY id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_admin_create;
DELIMITER //
CREATE PROCEDURE sp_admin_create(
    IN p_login VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_superAdmin BOOLEAN
)
BEGIN
    INSERT INTO admins (login, password, superAdmin)
    VALUES (p_login, p_password, IFNULL(p_superAdmin, FALSE));

    SELECT LAST_INSERT_ID() AS id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_admin_delete;
DELIMITER //
CREATE PROCEDURE sp_admin_delete(IN p_id INT)
BEGIN
    DELETE FROM admins WHERE id = p_id;
END//
DELIMITER ;

-- ============================================================
-- ARTICLES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_articles_get_all;
DELIMITER //
CREATE PROCEDURE sp_articles_get_all()
BEGIN
    SELECT id, title, content, filePath, createdAt, updatedAt
    FROM articles
    ORDER BY createdAt DESC;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_articles_get_by_id;
DELIMITER //
CREATE PROCEDURE sp_articles_get_by_id(IN p_id INT)
BEGIN
    SELECT id, title, content, filePath, createdAt, updatedAt
    FROM articles
    WHERE id = p_id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_article_create;
DELIMITER //
CREATE PROCEDURE sp_article_create(
    IN p_title VARCHAR(500),
    IN p_content LONGTEXT,
    IN p_filePath VARCHAR(500)
)
BEGIN
    INSERT INTO articles (title, content, filePath)
    VALUES (p_title, p_content, p_filePath);

    SELECT LAST_INSERT_ID() AS id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_article_update;
DELIMITER //
CREATE PROCEDURE sp_article_update(
    IN p_id INT,
    IN p_title VARCHAR(500),
    IN p_content LONGTEXT,
    IN p_filePath VARCHAR(500)
)
BEGIN
    UPDATE articles
    SET title = p_title,
        content = p_content,
        filePath = p_filePath,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = p_id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_article_delete;
DELIMITER //
CREATE PROCEDURE sp_article_delete(IN p_id INT)
BEGIN
    DELETE FROM articles WHERE id = p_id;
END//
DELIMITER ;

-- ============================================================
-- ARTICLE COMMENTS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_comments_get_by_article;
DELIMITER //
CREATE PROCEDURE sp_comments_get_by_article(IN p_articleId INT)
BEGIN
    SELECT id, articleId, author, text, parentId, createdAt
    FROM article_comments
    WHERE articleId = p_articleId
    ORDER BY createdAt ASC;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_comment_create;
DELIMITER //
CREATE PROCEDURE sp_comment_create(
    IN p_articleId INT,
    IN p_author VARCHAR(200),
    IN p_text LONGTEXT
)
BEGIN
    INSERT INTO article_comments (articleId, author, text)
    VALUES (p_articleId, p_author, p_text);

    SELECT LAST_INSERT_ID() AS id;
END//
DELIMITER ;

-- ============================================================
-- NEWS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_news_get_all;
DELIMITER //
CREATE PROCEDURE sp_news_get_all()
BEGIN
    SELECT id, title, content, filePath, createdAt
    FROM news
    ORDER BY createdAt DESC;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_news_create;
DELIMITER //
CREATE PROCEDURE sp_news_create(
    IN p_title VARCHAR(500),
    IN p_content LONGTEXT,
    IN p_filePath VARCHAR(500)
)
BEGIN
    INSERT INTO news (title, content, filePath)
    VALUES (p_title, p_content, p_filePath);

    SELECT LAST_INSERT_ID() AS id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_news_update;
DELIMITER //
CREATE PROCEDURE sp_news_update(
    IN p_id INT,
    IN p_title VARCHAR(500),
    IN p_content LONGTEXT,
    IN p_filePath VARCHAR(500)
)
BEGIN
    UPDATE news
    SET title = p_title,
        content = p_content,
        filePath = p_filePath
    WHERE id = p_id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_news_delete;
DELIMITER //
CREATE PROCEDURE sp_news_delete(IN p_id INT)
BEGIN
    DELETE FROM news WHERE id = p_id;
END//
DELIMITER ;

-- ============================================================
-- INSTRUCTORS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_instructors_get_all;
DELIMITER //
CREATE PROCEDURE sp_instructors_get_all()
BEGIN
    SELECT id, name, title, photo, description, sortOrder, createdAt
    FROM instructors
    ORDER BY sortOrder ASC, id ASC;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_instructor_create;
DELIMITER //
CREATE PROCEDURE sp_instructor_create(
    IN p_name VARCHAR(200),
    IN p_title VARCHAR(500),
    IN p_photo VARCHAR(500),
    IN p_description LONGTEXT,
    IN p_sortOrder INT
)
BEGIN
    INSERT INTO instructors (name, title, photo, description, sortOrder)
    VALUES (p_name, p_title, p_photo, p_description, IFNULL(p_sortOrder, 0));

    SELECT LAST_INSERT_ID() AS id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_instructor_update;
DELIMITER //
CREATE PROCEDURE sp_instructor_update(
    IN p_id INT,
    IN p_name VARCHAR(200),
    IN p_title VARCHAR(500),
    IN p_photo VARCHAR(500),
    IN p_description LONGTEXT,
    IN p_sortOrder INT
)
BEGIN
    UPDATE instructors
    SET name = p_name,
        title = p_title,
        photo = p_photo,
        description = p_description,
        sortOrder = IFNULL(p_sortOrder, 0)
    WHERE id = p_id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_instructor_delete;
DELIMITER //
CREATE PROCEDURE sp_instructor_delete(IN p_id INT)
BEGIN
    DELETE FROM instructors WHERE id = p_id;
END//
DELIMITER ;

-- ============================================================
-- SCHEDULE
-- ============================================================

DROP PROCEDURE IF EXISTS sp_schedule_get_all;
DELIMITER //
CREATE PROCEDURE sp_schedule_get_all()
BEGIN
    SELECT id, dayOfWeek, time, group_name, description, sortOrder, isSummer, createdAt
    FROM schedule
    ORDER BY sortOrder ASC, id ASC;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_schedule_create;
DELIMITER //
CREATE PROCEDURE sp_schedule_create(
    IN p_dayOfWeek VARCHAR(50),
    IN p_time VARCHAR(50),
    IN p_group_name VARCHAR(200),
    IN p_description VARCHAR(500),
    IN p_sortOrder INT,
    IN p_isSummer BOOLEAN
)
BEGIN
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer)
    VALUES (
        p_dayOfWeek,
        p_time,
        p_group_name,
        p_description,
        IFNULL(p_sortOrder, 0),
        IFNULL(p_isSummer, FALSE)
    );

    SELECT LAST_INSERT_ID() AS id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_schedule_update;
DELIMITER //
CREATE PROCEDURE sp_schedule_update(
    IN p_id INT,
    IN p_dayOfWeek VARCHAR(50),
    IN p_time VARCHAR(50),
    IN p_group_name VARCHAR(200),
    IN p_description VARCHAR(500),
    IN p_sortOrder INT,
    IN p_isSummer BOOLEAN
)
BEGIN
    UPDATE schedule
    SET dayOfWeek = p_dayOfWeek,
        time = p_time,
        group_name = p_group_name,
        description = p_description,
        sortOrder = IFNULL(p_sortOrder, 0),
        isSummer = IFNULL(p_isSummer, FALSE)
    WHERE id = p_id;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_schedule_delete;
DELIMITER //
CREATE PROCEDURE sp_schedule_delete(IN p_id INT)
BEGIN
    DELETE FROM schedule WHERE id = p_id;
END//
DELIMITER ;

SELECT 'All MySQL stored procedures created successfully.' AS message;
