const result = require('dotenv').config();
if (result.error) {
    console.error('❌ Dotenv Error:', result.error);
} else {
    console.log('✅ Dotenv config loaded:', result.parsed ? Object.keys(result.parsed) : 'No variables found');
}
const app = require('./app');

console.log('\n*****************************************');
console.log('🚀 CRM BACKEND STARTING - DEC 31 17:23');
console.log('*****************************************\n');

// Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
