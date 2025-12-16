const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const filePath = path.resolve(__dirname, '../src/pages/UserDashboard/UserDashboard.jsx');
const code = fs.readFileSync(filePath, 'utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('Parsed OK');
} catch (err) {
  console.error('Parse error:');
  console.error(err.message);
  console.error(err.loc);
  process.exit(1);
}
