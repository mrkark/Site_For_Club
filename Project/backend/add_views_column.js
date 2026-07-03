const { runSql, queryAll } = require('./mssql-adapter');
async function main() {
  try {
    const cols = await queryAll("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('articles') AND name = 'views'");
    if (cols.length === 0) {
      await runSql("ALTER TABLE articles ADD views INT DEFAULT 0");
      console.log('Added views column');
    } else {
      console.log('Views column already exists');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
}
main();
