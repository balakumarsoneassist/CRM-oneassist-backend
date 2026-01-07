const express = require('express');
const cors = require('cors');

console.log('\n--- (0) App.js is being loaded ---');

// Routers
const authRouter = require('./routers/auth.router');
const userRouter = require('./routers/user.router');
const leadRouter = require('./routers/lead.router');
const masterRouter = require('./routers/master.router');
const contactRouter = require('./routers/contact.router');
const reportRouter = require('./routers/report.router');
const salesRouter = require('./routers/sales.router');
const connectorRouter = require('./routers/connector.router');
const qrcodeRouter = require('./routers/qrcode.router');
const customerRouter = require('./routers/customer.router');
const whatsappRouter = require('./routers/whatsapp.router');


const app = express();

app.use(express.json());
app.use(cors());

// Global Request Logger - VERY LOUD for Webhooks
app.use((req, res, next) => {
    const ts = new Date().toLocaleTimeString();
    console.log(`\n>>> [${ts}] REQUEST: ${req.method} ${req.originalUrl}`);
    if (req.originalUrl.includes('webhook')) {
        console.log('>>> WEBHOOK PATH HIT!');
    }
    next();
});



// Basic Routes
app.get('/', (req, res) => {
    res.send('API is running');
});

app.get('/test', (req, res) => {
    res.send('PVR Test API is running');
});

// Mount Routers
// Note: Some routers defined paths assuming root mount (e.g. /employees, /login).
app.use(authRouter);
app.use(userRouter);
app.use(leadRouter);
app.use(masterRouter);
app.use(contactRouter);
app.use(reportRouter);
app.use(salesRouter);
app.use(connectorRouter);
app.use(qrcodeRouter);
app.use(customerRouter);
app.use('/api/whatsapp', whatsappRouter);


module.exports = app;
