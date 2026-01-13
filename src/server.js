const path = require('path');
const result = require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (result.error) {
    console.error('❌ Dotenv Error:', result.error);
} else {
    console.log('✅ Dotenv config loaded:', result.parsed ? Object.keys(result.parsed) : 'No variables found');
}
const app = require('./app');


// Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
