-- IMPORTANT: Run this script with UTF-8 input encoding:
--   sqlcmd -S localhost -f 65001 -i mssql_init.sql
-- Otherwise Cyrillic characters in N-prefixed strings will be corrupted.

-- Create database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'KarateClub')
BEGIN
    CREATE DATABASE KarateClub;
END
GO

USE KarateClub;
GO

-- ============================================================
-- TABLES
-- ============================================================

-- Admins / Users
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[admins]') AND type in (N'U'))
BEGIN
    CREATE TABLE admins (
        id INT IDENTITY(1,1) PRIMARY KEY,
        login NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        superAdmin BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Articles
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[articles]') AND type in (N'U'))
BEGIN
    CREATE TABLE articles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX),
        filePath NVARCHAR(500),
        views INT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Add views column if missing (for existing databases)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[articles]') AND name = 'views')
BEGIN
    ALTER TABLE articles ADD views INT DEFAULT 0;
END
GO

-- Article comments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[article_comments]') AND type in (N'U'))
BEGIN
    CREATE TABLE article_comments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        articleId INT NOT NULL,
        author NVARCHAR(200) NOT NULL,
        text NVARCHAR(MAX) NOT NULL,
        parentId INT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_comments_articles FOREIGN KEY (articleId)
            REFERENCES articles(id) ON DELETE CASCADE,
        CONSTRAINT FK_comments_parent FOREIGN KEY (parentId)
            REFERENCES article_comments(id)
    );
END
GO

-- Add parentId to comments if missing (migration for existing databases)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[article_comments]') AND name = 'parentId')
BEGIN
    ALTER TABLE article_comments ADD parentId INT NULL;
END
GO

-- News
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[news]') AND type in (N'U'))
BEGIN
    CREATE TABLE news (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX),
        filePath NVARCHAR(500),
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Instructors
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[instructors]') AND type in (N'U'))
BEGIN
    CREATE TABLE instructors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        title NVARCHAR(500),
        photo NVARCHAR(500),
        description NVARCHAR(MAX),
        sortOrder INT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Schedule
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[schedule]') AND type in (N'U'))
BEGIN
    CREATE TABLE schedule (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dayOfWeek NVARCHAR(50) NOT NULL,
        time NVARCHAR(50) NOT NULL,
        group_name NVARCHAR(200),
        description NVARCHAR(500),
        sortOrder INT DEFAULT 0,
        isSummer BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Instructors (from sanker.by)
IF NOT EXISTS (SELECT 1 FROM instructors)
BEGIN
    INSERT INTO instructors (name, title, photo, description, sortOrder) VALUES
    (N'Пятько Павел Станиславович', N'5 Дан JKS, 6 Дан WMAO, 4 Дан WKF | Главный тренер клуба',
     N'/img/piatsko.svg',
     N'Высшее образование: БГУФК (тренер по каратэ), БНТУ (инженер). 5 Дан JKS; 6 Дан WMAO; 4 Дан WKF; 3 Дан JKF; 2 Дан JKA, WSKF. Национальный судья. Председатель Ассоциации "Минская Федерация Каратэ".',
     1);

    INSERT INTO instructors (name, title, photo, description, sortOrder) VALUES
    (N'Кость Михаил Борисович', N'2 Дан JKS, 2 Дан WKF, WMAO',
     N'/img/kosts.svg',
     N'Высшее образование: БГУФК (тренер по каратэ). 2 Дан JKS; 2 Дан WKF, WMAO; 1 Дан JKF.',
     2);

    INSERT INTO instructors (name, title, photo, description, sortOrder) VALUES
    (N'Винцукевич Дарья Павловна', N'2 Дан JKS, 1 Дан ISKF | КМС РБ',
     N'/img/vintsukevich.svg',
     N'Высшее образование: БГУФК (тренер по каратэ), БГУ (химик-эколог). 2 Дан JKS (2018); 1 Дан ISKF (2012). Кандидат в мастера спорта РБ.',
     3);
END
GO

IF NOT EXISTS (SELECT 1 FROM schedule)
BEGIN
    -- Winter schedule (isSummer = 0)
    -- Группа 1: Пятько П.С. (Возраст 9-13 лет)
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Понедельник', N'16:00 - 17:30', N'Возраст 9-13 лет', N'Каратэ JKS - Пятько П.С. (Абстрактное мышление и координация, ОФП, Развиваемся играя, Здоровый малыш)', 1, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Вторник', N'16:00 - 17:30', N'Возраст 9-13 лет', N'Каратэ JKS - Пятько П.С. (Абстрактное мышление и координация, ОФП, Развиваемся играя, Здоровый малыш)', 2, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Четверг', N'16:00 - 17:30', N'Возраст 9-13 лет', N'Каратэ JKS - Пятько П.С. (Абстрактное мышление и координация, ОФП, Развиваемся играя, Здоровый малыш)', 3, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Пятница', N'16:00 - 17:30', N'Возраст 9-13 лет', N'Каратэ JKS - Пятько П.С. (Абстрактное мышление и координация, ОФП, Развиваемся играя, Здоровый малыш)', 4, 0);

    -- Группа 2: Кость М.Б. (Возраст 7-10 лет)
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Понедельник', N'18:30 - 19:45', N'Возраст 7-10 лет', N'Каратэ JKS - Кость М.Б. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 5, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Вторник', N'18:30 - 19:45', N'Возраст 7-10 лет', N'Каратэ JKS - Кость М.Б. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 6, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Четверг', N'18:30 - 19:45', N'Возраст 7-10 лет', N'Каратэ JKS - Кость М.Б. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 7, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Пятница', N'18:30 - 19:45', N'Возраст 7-10 лет', N'Каратэ JKS - Кость М.Б. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 8, 0);

    -- Группа 3: Винцкевич Д.П., Пятько П.С. (Возраст 7-10 лет)
    -- ВАЖНО: Время 18:00 - 19:15 (а не 18:30)
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Понедельник', N'18:00 - 19:15', N'Возраст 7-10 лет', N'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 9, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Вторник', N'18:00 - 19:15', N'Возраст 7-10 лет', N'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 10, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Четверг', N'18:00 - 19:15', N'Возраст 7-10 лет', N'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 11, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Пятница', N'18:00 - 19:15', N'Возраст 7-10 лет', N'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала, Здоровый малыш, Абстрактное мышление и координация)', 12, 0);

    -- Группа 4: Пятько П.С. (Возраст Старше 13 лет)
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Понедельник', N'20:00 - 22:00', N'Возраст Старше 13 лет', N'Каратэ JKS - Пятько П.С. (ОФП, Личностный рост в избранном направлении тренинга - ката/кумитэ)', 13, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Вторник', N'20:00 - 22:00', N'Возраст Старше 13 лет', N'Каратэ JKS - Пятько П.С. (ОФП, Личностный рост в избранном направлении тренинга - ката/кумитэ)', 14, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Четверг', N'20:00 - 22:00', N'Возраст Старше 13 лет', N'Каратэ JKS - Пятько П.С. (ОФП, Личностный рост в избранном направлении тренинга - ката/кумитэ)', 15, 0);
    INSERT INTO schedule (dayOfWeek, time, group_name, description, sortOrder, isSummer) VALUES
    (N'Пятница', N'20:00 - 22:00', N'Возраст Старше 13 лет', N'Каратэ JKS - Пятько П.С. (ОФП, Личностный рост в избранном направлении тренинга - ката/кумитэ)', 16, 0);

END
GO

-- Articles
IF NOT EXISTS (SELECT 1 FROM articles)
BEGIN
    INSERT INTO articles (title, content, createdAt) VALUES
    (N'История клуба «Сэнкё»',
     N'МОО «Спортивный клуб «СЭНКЁ» — история создания и развития.

1 сентября 1991 года Качерук Валерий и Пятько Павел организовали кружок каратэ на базе ДЮК Партизанского района г. Минска. 10 ноября 1994 года собрание инициативной группы одобрило японское слово «SENKO» — вспышка света, молния — в качестве названия Клуба. С этого момента клуб фактически начал существовать.

В 1995 году клуб организует летний лагерь на озере Птичь. В 1998 году клуб получает свидетельство о государственной регистрации. В 2001 году Алексей Павлюченков, первым из членов клуба, завоёвывает звание Мастера спорта РБ.

В 2005 году клуб организует и проводит Первый Открытый турнир SANKER CUP 2005. С тех пор турнир стал ежегодным и собирает участников более чем из 20 стран.

2012 год — Клуб выступил инициатором создания Ассоциации «Минская Федерация Каратэ». 2017 год — воспитанники Клуба вступают в организационную структуру JKS (Japan Karate Shoto Federation).

2019 год — Клуб проводит 15-й Международный турнир «Sanker Cup», который собирает более 1000 участников. Главный тренер Клуба Пятько П.С. принимает участие во всемирном конгрессе JKS в Токио.

2020 год — Клуб начинает развивать YouTube-канал JKS Belarus. К декабрю 2024 года на нём 3100 подписчиков, лучший материал набрал 67 тысяч просмотров.

2021 год — разрабатывается и внедряется новая Аттестационная программа JKS Belarus.

2023 год — World Martial Arts Organization присваивает Пятько П.С. 6 Дан.

2024 год — Клуб проходит государственную аккредитацию по направлению развитие физической культуры, а также регистрирует официальные геральдические символы: Эмблема № В-1947 и Флаг № В-1948.',
     '2024-12-10 10:00:00');

    INSERT INTO articles (title, content, createdAt) VALUES
    (N'Почему стоит заниматься активными тренировками в возрасте за 30',
     N'Воронина Любовь, кандидат медицинских наук, доцент.

Физическая активность играет исключительно важную роль в поддержании здоровья людей всех возрастов. С возрастом организм человека претерпевает множество изменений, и многие из этих изменений негативно сказываются на самочувствии, подвижности и общем уровне здоровья.

Во-первых, физическая активность положительно влияет на сердечно-сосудистую систему. С возрастом повышается риск развития гипертонии, инфарктов, инсультов. Регулярные упражнения на все группы мышц, сочетание аэробных и анаэробных нагрузок способствуют улучшению кровообращения и укреплению сосудов.

Во-вторых, физическая активность помогает поддерживать мышечную массу и силу. С возрастом мышцы теряют свою массу, что увеличивает риск падений и травм. Занятия каратэ стиля Shotokan укрепляют не только крупные мышцы тела, но и гладкую мускулатуру сосудов и сердца.

Третьим важным аспектом является профилактика остеопороза. Регулярные физические упражнения помогают укреплять костную ткань. Занятия каратэ способствуют сохранению структуры хрящевой ткани.

Кроме того, физическая активность оказывает положительное воздействие на когнитивные функции. Регулярные занятия спортом стимулируют кровоснабжение мозга и улучшают когнитивные способности.

В заключение: регулярные физические упражнения стиля Shotokan оказывают множество положительных эффектов на организм человека. Они способствуют улучшению работы сердца, укреплению мышц и костей, поддержанию когнитивных функций и улучшению психоэмоционального состояния.',
     '2024-11-10 11:00:00');

    INSERT INTO articles (title, content, createdAt) VALUES
    (N'Дан тест 2022 — экзамен на чёрные пояса',
     N'30 октября 2022 года в нашем Клубе после большого перерыва состоялся экзамен на чёрные пояса.

Для организаторов это своего рода конвейер по подготовке и выпуску очередной группы обладателей Данов, а для сдающих тест — серьёзнейший этап в их жизни, развитии и личностном росте.

В 2021 году все идеи были сведены в один документ «Аттестационная программа JKS Belarus — Ассоциация «МФК». Разработчики: Пятько П.С., 5 Дан JKS и Гаевский С.О., 5 Дан JKS.

К моменту сдачи экзамена на 1 Дан занимающимися было изучено и отработано 16 базовых ката, а также разделы кумитэ: КАЭСИ, ОКУРИ, ДЗИЮ-ИППОН, ШИАЙ.

Поздравляем успешно прошедших испытания на 1 Дан Ассоциации «МФК»: Зубрицкого Тимофея, Пшонко Артёма, Жук Веронику, Шлыка Алексея, Валетко Александра, а также успешно прошедших испытания на 3 Дан.',
     '2022-11-11 10:00:00');
END
GO

-- News
IF NOT EXISTS (SELECT 1 FROM news)
BEGIN
    INSERT INTO news (title, content, createdAt) VALUES
    (N'Новый зал на Некрасова, 7',
     N'10 ноября этого года исполнилось 20 лет нашему клубу. Клуб молод, растёт и развивается. Стараниями администрации, весь клуб получил замечательный подарок: новый большой зал площадью 190 квадратных метров с удобным доступом к транспорту.

Поэтапный переезд закончен, и тренировки продолжаются в точном соответствии с расписанием по новому адресу: ул. Некрасова, 7, зал на шестом этаже.

Больший зал означает большую свободу в тренировках, как по количеству групп, так и по проведению мероприятий. Следите за анонсами на нашем сайте!',
     '2024-11-10 12:00:00');

    INSERT INTO news (title, content, createdAt) VALUES
    (N'Клуб Сэнкё предлагает новые программы тренировок',
     N'Клуб Сэнкё предлагает 8 программ тренировок для всех возрастов:

1. «РАЗВИВАЕМСЯ ИГРАЯ» — для детей 5-6 лет (60 мин, игровая форма)
2. «ЗДОРОВЫЙ МАЛЫШ» — для детей 7-8 лет (60-75 мин)
3. «АБСТРАКТНОЕ МЫШЛЕНИЕ и КООРДИНАЦИЯ» — для детей 9-12 лет (75-90 мин)
4. «ОФП и СФП» — для подростков 13-17 лет (90 мин)
5. «ЛИЧНОСТНЫЙ РОСТ» — для взрослых 18-35 лет (90-120 мин)
6. «АКТИВНОЕ ДОЛГОЛЕТИЕ» — для взрослых старше 35 лет (90 мин)
7. Учебно-методические семинары — для всех возрастных групп
8. Аттестационные экзамены — для всех возрастных групп

Подробности у администрации клуба по телефону +375 29 611 7907.',
     '2024-05-30 10:00:00');

    INSERT INTO news (title, content, createdAt) VALUES
    (N'PRO — каратэ. Сборник статей',
     N'Вышел в свет сборник статей «PRO — каратэ» (Минск, 2024). В сборнике рассматриваются методика обучения каратэ, пять уровней подготовки, временные рамки освоения программы.

Особое внимание уделено методике обучения детей до 16 лет, трём кризисам в обучении, а также влиянию социокультурных правил на развитие и формирование будущего каратиста.

В сборнике представлена таблица соответствия стадий развития конфликта и уровней подготовки: от 9-8-7 кю (Кихон-Нихон-кумитэ) до 2 Дана и выше (Дзю-кумитэ).

Сборник рекомендован для тренеров и занимающихся каратэ.',
     '2024-03-04 10:00:00');

    INSERT INTO news (title, content, createdAt) VALUES
    (N'Клуб прошёл государственную аккредитацию',
     N'В 2024 году МОО «Спортивный Клуб «СЭНКЁ» прошёл государственную аккредитацию по направлению развитие физической культуры.

Также Клуб разработал и зарегистрировал официальные геральдические символы: Эмблема № В-1947 и Флаг № В-1948.

Это важный шаг в развитии организации, подтверждающий высокий статус и соответствие государственным стандартам.',
     '2024-02-15 10:00:00');
END
GO