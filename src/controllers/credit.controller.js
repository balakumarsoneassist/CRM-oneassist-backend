const { evaluateApplication } = require('../utils/decisionEngine');

exports.evaluate = (req, res) => {
    try {
        const result = evaluateApplication(req.body);
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('Credit Evaluation Error:', err.message);
        res.status(400).json({
            success: false,
            error: err.message || 'Invalid calculation request'
        });
    }
};
