// Token storage for session verification (in production, use Redis or a DB table)
const tokenStore = new Map();

module.exports = tokenStore;