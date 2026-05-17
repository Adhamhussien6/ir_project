const express      = require('express');
const path         = require('path');
const SearchEngine = require('./src/search_engine');

const app        = express();
const DOCS_FOLDER = path.join(__dirname, 'documents');
const engine     = new SearchEngine(DOCS_FOLDER);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/search', (req, res) => {
    const query = (req.query.q || '').trim();
    const topK  = parseInt(req.query.k) || 5;

    if (!query) return res.json({ results: [] });

    const raw = engine.search(query, topK);
    const results = raw.map(({ doc, score }) => ({
        doc,
        name:    doc.replace(/_/g, ' ').replace('.txt', ''),
        score:   parseFloat(score.toFixed(4)),
        snippet: engine.getSnippet(doc, query),
    }));

    res.json({ results });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Search engine running at http://localhost:${PORT}`);
});
