const searchService = require("../services/search.service");

class SearchController {
    async searchAll(req, res) {
        try {
            const data = await searchService.searchAll(req.query);
            res.json({ success: true, count: data.length, data });
        } catch (err) {
            console.error("Error in searchAll:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }
}

module.exports = new SearchController();
