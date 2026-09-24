const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const defaultAdmin = {
  login: process.env.DEFAULT_ADMIN_LOGIN || 'admin',
  password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
};

const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_NAME || 'karate_club',
  user: process.env.DB_USER || 'mrkark',
  password: process.env.DB_PASSWORD || 'mrkark9000',
  ssl: process.env.DB_SSL === 'true' ? true : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function getDb() {
  if (pool) return pool;
  pool = mysql.createPool(mysqlConfig);
  
  // Initialize schema
  await initializeSchema();
  
  return pool;
}

async function initializeSchema() {
  const p = await getDb();
  
  // Create tables
  await p.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      login VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      superAdmin BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await p.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      filePath VARCHAR(500),
      views INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await p.execute(`
    CREATE TABLE IF NOT EXISTS article_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      articleId INT NOT NULL,
      author VARCHAR(255) NOT NULL,
      text TEXT NOT NULL,
      parentId INT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (parentId) REFERENCES article_comments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await p.execute(`
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      filePath VARCHAR(500),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await p.execute(`
    CREATE TABLE IF NOT EXISTS instructors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(500),
      photo VARCHAR(500),
      description TEXT,
      sortOrder INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await p.execute(`
    CREATE TABLE IF NOT EXISTS schedule (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dayOfWeek VARCHAR(50) NOT NULL,
      time VARCHAR(100) NOT NULL,
      group_name VARCHAR(500),
      description TEXT,
      isSummer BOOLEAN DEFAULT FALSE,
      sortOrder INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await p.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      author VARCHAR(255) NOT NULL,
      text TEXT NOT NULL,
      photo VARCHAR(500),
      sortOrder INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  // Check and create default admin
  const [adminRows] = await p.execute('SELECT COUNT(*) as count FROM admins');
  if (adminRows[0].count === 0) {
    const hashedPassword = bcrypt.hashSync(defaultAdmin.password, 10);
    await p.execute('INSERT INTO admins (login, password, superAdmin) VALUES (?, ?, ?)', [defaultAdmin.login, hashedPassword, true]);
    console.log('Default admin created: login=' + defaultAdmin.login + ', password=' + defaultAdmin.password);
  }
  
  // Seed instructors if empty
  const [instrRows] = await p.execute('SELECT COUNT(*) as count FROM instructors');
  if (instrRows[0].count === 0) {
    await p.execute('INSERT INTO instructors (name, title, description, sortOrder) VALUES (?, ?, ?, ?)', 
      ['Пятько Павел Станиславович', '5 Дан JKS, 6 Дан WMAO, 4 Дан WKF | Главный тренер клуба', 'Высшее образование: БГУФК (тренер по каратэ), БНТУ (инженер). 5 Дан JKS; 6 Дан WMAO; 4 Дан WKF; 3 Дан JKF; 2 Дан JKA, WSKF. Национальный судья. Председатель Ассоциации "Минская Федерация Каратэ".', 1]);
    await p.execute('INSERT INTO instructors (name, title, description, sortOrder) VALUES (?, ?, ?, ?)', 
      ['Кость Михаил Борисович', '2 Дан JKS, 2 Дан WKF, WMAO', 'Высшее образование: БГУФК (тренер по каратэ). 2 Дан JKS; 2 Дан WKF, WMAO; 1 Дан JKF.', 2]);
    await p.execute('INSERT INTO instructors (name, title, description, sortOrder) VALUES (?, ?, ?, ?)', 
      ['Винцукевич Дарья Павловна', '2 Дан JKS, 1 Дан ISKF | КМС РБ', 'Высшее образование: БГУФК (тренер по каратэ), БГУ (химик-эколог). 2 Дан JKS (2018); 1 Дан ISKF (2012). Кандидат в мастера спорта РБ.', 3]);
    console.log('Default instructors seeded');
  }
  
  // Seed schedule if empty
  const [schedRows] = await p.execute('SELECT COUNT(*) as count FROM schedule');
  if (schedRows[0].count === 0) {
    const s = [
      ['Понедельник', '16:00 - 17:30', 'Возраст 9-13 лет', 'Каратэ JKS - Пятько П.С.', false, 1],
      ['Вторник', '16:00 - 17:30', 'Возраст 9-13 лет', 'Каратэ JKS - Пятько П.С.', false, 2],
      ['Четверг', '16:00 - 17:30', 'Возраст 9-13 лет', 'Каратэ JKS - Пятько П.С.', false, 3],
      ['Пятница', '16:00 - 17:30', 'Возраст 9-13 лет', 'Каратэ JKS - Пятько П.С.', false, 4],
      ['Понедельник', '18:30 - 19:45', 'Возраст 7-10 лет', 'Каратэ JKS - Кость М.Б. (½ зала)', false, 5],
      ['Вторник', '18:30 - 19:45', 'Возраст 7-10 лет', 'Каратэ JKS - Кость М.Б. (½ зала)', false, 6],
      ['Четверг', '18:30 - 19:45', 'Возраст 7-10 лет', 'Каратэ JKS - Кость М.Б. (½ зала)', false, 7],
      ['Пятница', '18:30 - 19:45', 'Возраст 7-10 лет', 'Каратэ JKS - Кость М.Б. (½ зала)', false, 8],
      ['Понедельник', '18:00 - 19:15', 'Возраст 7-10 лет', 'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала)', false, 9],
      ['Вторник', '18:00 - 19:15', 'Возраст 7-10 лет', 'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала)', false, 10],
      ['Четверг', '18:00 - 19:15', 'Возраст 7-10 лет', 'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала)', false, 11],
      ['Пятница', '18:00 - 19:15', 'Возраст 7-10 лет', 'Каратэ JKS - Винцкевич Д.П., Пятько П.С. (½ зала)', false, 12],
      ['Понедельник', '20:00 - 22:00', 'Возраст Старше 13 лет', 'Каратэ JKS - Пятько П.С.', false, 13],
      ['Вторник', '20:00 - 22:00', 'Возраст Старше 13 лет', 'Каратэ JKS - Пятько П.С.', false, 14],
      ['Четверг', '20:00 - 22:00', 'Возраст Старше 13 лет', 'Каратэ JKS - Пятько П.С.', false, 15],
      ['Пятница', '20:00 - 22:00', 'Возраст Старше 13 лет', 'Каратэ JKS - Пятько П.С.', false, 16]
    ];
    for (const r of s) {
      await p.execute('INSERT INTO schedule (dayOfWeek, time, group_name, description, isSummer, sortOrder) VALUES (?, ?, ?, ?, ?, ?)', r);
    }
    console.log('Default schedule seeded (' + s.length + ' entries)');
  }
  
  // Seed articles if empty
  const [artRows] = await p.execute('SELECT COUNT(*) as count FROM articles');
  if (artRows[0].count === 0) {
    const articles = [
      ['История клуба «Сэнкё»', 'МОО «Спортивный клуб «СЭНКЁ» — история создания и развития.\n\n1 сентября 1991 года Качерук Валерий и Пятько Павел организовали кружок каратэ на базе ДЮК Партизанского района г. Минска. 10 ноября 1994 года собрание инициативной группы одобрило японское слово «SENKO» — вспышка света, молния — в качестве названия Клуба. С этого момента клуб фактически начал существовать.\n\nВ 1995 году клуб организует летний лагерь на озере Птичь. В 1998 году клуб получает свидетельство о государственной регистрации. В 2001 году Алексей Павлюченков, первым из членов клуба, завоёвывает звание Мастера спорта РБ.\n\nВ 2005 году клуб организует и проводит Первый Открытый турнир SANKER CUP 2005. С тех пор турнир стал ежегодным и собирает участников более чем из 20 стран.\n\n2012 год — Клуб выступил инициатором создания Ассоциации «Минская Федерация Каратэ». 2017 год — воспитанники Клуба вступают в организационную структуру JKS (Japan Karate Shoto Federation).\n\n2019 год — Клуб проводит 15-й Международный турнир «Sanker Cup», который собирает более 1000 участников. Главный тренер Клуба Пятько П.С. принимает участие во всемирном конгрессе JKS в Токио.\n\n2020 год — Клуб начинает развивать YouTube-канал JKS Belarus. К декабрю 2024 года на нём 3100 подписчиков, лучший материал набрал 67 тысяч просмотров.\n\n2021 год — разрабатывается и внедряется новая Аттестационная программа JKS Belarus.\n\n2023 год — World Martial Arts Organization присваивает Пятько П.С. 6 Дан.\n\n2024 год — Клуб проходит государственную аккредитацию по направлению развитие физической культуры, а также регистрирует официальные геральдические символы: Эмблема № В-1947 и Флаг № В-1948.', '2024-12-10 10:00:00'],
      ['Почему стоит заниматься активными тренировками в возрасте за 30', 'Воронина Любовь, кандидат медицинских наук, доцент.\n\nФизическая активность играет исключительно важную роль в поддержании здоровья людей всех возрастов. С возрастом организм человека претерпевает множество изменений, и многие из этих изменений негативно сказываются на самочувствии, подвижности и общем уровне здоровья.\n\nВо-первых, физическая активность положительно влияет на сердечно-сосудистую систему. С возрастом повышается риск развития гипертонии, инфарктов, инсультов. Регулярные упражнения на все группы мышц, сочетание аэробных и анаэробных нагрузок способствуют улучшению кровообращения и укреплению сосудов.\n\nВо-вторых, физическая активность помогает поддерживать мышечную массу и силу. С возрастом мышцы теряют свою массу, что увеличивает риск падений и травм. Занятия каратэ стиля Shotokan укрепляют не только крупные мышцы тела, но и гладкую мускулатуру сосудов и сердца.\n\nТретьим важным аспектом является профилактика остеопороза. Регулярные физические упражнения помогают укреплять костную ткань. Занятия каратэ способствуют сохранению структуры хрящевой ткани.\n\nКроме того, физическая активность оказывает положительное воздействие на когнитивные функции. Регулярные занятия спортом стимулируют кровоснабжение мозга и улучшают когнитивные способности.\n\nВ заключение: регулярные физические упражнения стиля Shotokan оказывают множество положительных эффектов на организм человека. Они способствуют улучшению работы сердца, укреплению мышц и костей, поддержанию когнитивных функций и улучшению психоэмоционального состояния.', '2024-11-10 11:00:00'],
      ['Дан тест 2022 — экзамен на чёрные пояса', '30 октября 2022 года в нашем Клубе после большого перерыва состоялся экзамен на чёрные пояса.\n\nДля организаторов это своего рода конвейер по подготовке и выпуску очередной группы обладателей Данов, а для сдающих тест — серьёзнейший этап в их жизни, развитии и личностном росте.\n\nВ 2021 году все идеи были сведены в один документ «Аттестационная программа JKS Belarus — Ассоциация «МФК». Разработчики: Пятько П.С., 5 Дан JKS и Гаевский С.О., 5 Дан JKS.\n\nК моменту сдачи экзамена на 1 Дан занимающимися было изучено и отработано 16 базовых ката, а также разделы кумитэ: КАЭСИ, ОКУРИ, ДЗИЮ-ИППОН, ШИАЙ.\n\nПоздравляем успешно прошедших испытания на 1 Дан Ассоциации «МФК»: Зубрицкого Тимофея, Пшонко Артёма, Жук Веронику, Шлыка Алексея, Валетко Александра, а также успешно прошедших испытаний на 3 Дан.', '2022-11-11 10:00:00']
    ];
    for (const a of articles) {
      await p.execute('INSERT INTO articles (title, content, createdAt) VALUES (?, ?, ?)', a);
    }
    console.log('Default articles seeded (' + articles.length + ' entries)');
  }
  
  // Seed news if empty
  const [newsRows] = await p.execute('SELECT COUNT(*) as count FROM news');
  if (newsRows[0].count === 0) {
    const newsItems = [
      ['Новый зал на Некрасова, 7', '10 ноября этого года исполнилось 20 лет нашему клубу. Клуб молод, растёт и развивается. Стараниями администрации, весь клуб получил замечательный подарок: новый большой зал площадью 190 квадратных метров с удобным доступом к транспорту.\n\nПоэтапный переезд закончен, и тренировки продолжаются в точном соответствии с расписанием по новому адресу: ул. Некрасова, 7, зал на шестом этаже.\n\nБольший зал означает большую свободу в тренировках, как по количеству групп, так и по проведению мероприятий. Следите за анонсами на нашем сайте!', '2024-11-10 12:00:00'],
      ['Клуб Сэнкё предлагает новые программы тренировок', 'Клуб Сэнкё предлагает 8 программ тренировок для всех возрастов:\n\n1. «РАЗВИВАЕМСЯ ИГРАЯ» — для детей 5-6 лет (60 мин, игровая форма)\n2. «ЗДОРОВЫЙ МАЛЫШ» — для детей 7-8 лет (60-75 мин)\n3. «АБСТРАКТНОЕ МЫШЛЕНИЕ и КООРДИНАЦИЯ» — для детей 9-12 лет (75-90 мин)\n4. «ОФП и СФП» — для подростков 13-17 лет (90 мин)\n5. «ЛИЧНОСТНЫЙ РОСТ» — для взрослых 18-35 лет (90-120 мин)\n6. «АКТИВНОЕ ДОЛГОЛЕТИЕ» — для взрослых старше 35 лет (90 мин)\n7. Учебно-методические семинары — для всех возрастных групп\n8. Аттестационные экзамены — для всех возрастных групп\n\nПодробности у администрации клуба по телефону +375 29 611 7907.', '2024-05-30 10:00:00'],
      ['PRO — каратэ. Сборник статей', 'Вышел в свет сборник статей «PRO — каратэ» (Минск, 2024). В сборнике рассматриваются методика обучения каратэ, пять уровней подготовки, временные рамки освоения программы.\n\nОсобое внимание уделено методике обучения детей до 16 лет, трём кризисам в обучении, а также влиянию социокультурных правил на развитие и формирование будущего каратиста.\n\nВ сборнике представлена таблица соответствия стадий развития конфликта и уровней подготовки: от 9-8-7 кю (Кихон-Нихон-кумитэ) до 2 Дана и выше (Дзю-кумитэ).\n\nСборник рекомендован для тренеров и занимающихся каратэ.', '2024-03-04 10:00:00'],
      ['Клуб прошёл государственную аккредитацию', 'В 2024 году МОО «Спортивный Клуб «СЭНКЁ» прошёл государственную аккредитацию по направлению развитие физической культуры.\n\nТакже Клуб разработал и зарегистрировал официальные геральдические символы: Эмблема № В-1947 и Флаг № В-1948.\n\nЭто важный шаг в развитии организации, подтверждающий высокий статус и соответствие государственным стандартам.', '2024-02-15 10:00:00']
    ];
    for (const n of newsItems) {
      await p.execute('INSERT INTO news (title, content, createdAt) VALUES (?, ?, ?)', n);
    }
    console.log('Default news seeded (' + newsItems.length + ' entries)');
  }
}

function replaceParams(sqlQuery, params) {
  let i = 0;
  return sqlQuery.replace(/\?/g, () => `?`);
}

async function queryAll(sqlQuery, params = []) {
  const p = await getDb();
  const [rows] = await p.execute(sqlQuery, params);
  return rows;
}

async function queryOne(sqlQuery, params = []) {
  const rows = await queryAll(sqlQuery, params);
  return rows[0] || null;
}

async function runSql(sqlQuery, params = []) {
  const p = await getDb();
  const isInsert = sqlQuery.trim().toUpperCase().startsWith('INSERT');
  const [result] = await p.execute(sqlQuery, params);

  const changes = result.affectedRows || 0;
  let lastInsertRowid = 0;
  if (isInsert && result.insertId) {
    lastInsertRowid = parseInt(result.insertId, 10) || 0;
  }

  return { changes, lastInsertRowid };
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getDb, queryAll, queryOne, runSql, closePool };