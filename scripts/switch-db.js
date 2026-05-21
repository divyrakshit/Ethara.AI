const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const target = process.argv[2];

if (!target || (target !== 'sqlite' && target !== 'postgres')) {
  console.error('Usage: node scripts/switch-db.js [sqlite|postgres]');
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgres') {
  // Replace sqlite datasource block with postgresql
  schema = schema.replace(
    /datasource db \{[\s\S]*?provider\s*=\s*"sqlite"[\s\S]*?url\s*=\s*"file:\.\/dev\.db"[\s\S]*?\}/,
    `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  );
  console.log('Switched Prisma database provider to postgresql.');
} else {
  // Replace postgresql datasource block with sqlite
  schema = schema.replace(
    /datasource db \{[\s\S]*?provider\s*=\s*"postgresql"[\s\S]*?url\s*=\s*env\("DATABASE_URL"\)[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`
  );
  console.log('Switched Prisma database provider to sqlite.');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('schema.prisma updated successfully!');
