const fs = require('fs');
const path = require('path');

const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'it', 'its', 'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he',
    'she', 'they', 'me', 'us', 'him', 'her', 'them', 'my', 'our', 'your',
    'his', 'their', 'what', 'which', 'who', 'when', 'where', 'how', 'all',
    'also', 'more', 'into', 'than', 'then', 'so', 'such', 'about', 'up',
    'out', 'if', 'not', 'no', 'only', 'new', 'other', 'while', 'both',
    'each', 'over', 'after', 'before', 'between', 'through', 'during',
    'without', 'like', 'used', 'use', 'using', 'now', 'well', 'very',
    'most', 'many', 'much', 'some', 'any', 'one', 'two', 'three', 'first',
    'second', 'however', 'including', 'make', 'made', 'still', 'known',
    'often', 'even', 'since', 'continue', 'continued',
]);

function preprocess(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function computeTF(tokens) {
    const tf = {};
    for (const token of tokens) {
        tf[token] = (tf[token] || 0) + 1;
    }
    const total = tokens.length;
    for (const term in tf) {
        tf[term] /= total;
    }
    return tf;
}

function computeIDF(documents) {
    const N = Object.keys(documents).length;
    const df = {};
    for (const tokens of Object.values(documents)) {
        for (const term of new Set(tokens)) {
            df[term] = (df[term] || 0) + 1;
        }
    }
    const idf = {};
    for (const term in df) {
        idf[term] = Math.log10(N / df[term]);
    }
    return idf;
}

function cosineSimilarity(vecA, vecB) {
    const common = Object.keys(vecA).filter(t => t in vecB);
    if (common.length === 0) return 0;

    const dot = common.reduce((sum, t) => sum + vecA[t] * vecB[t], 0);
    const magA = Math.sqrt(Object.values(vecA).reduce((s, v) => s + v * v, 0));
    const magB = Math.sqrt(Object.values(vecB).reduce((s, v) => s + v * v, 0));

    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

class SearchEngine {
    constructor(docsFolder) {
        this.docsFolder = docsFolder;
        this.rawDocs = {};
        this.tokens = {};
        this.tf = {};
        this.idf = {};
        this.tfidf = {};
        this._buildIndex();
    }

    _loadDocuments() {
        const files = fs.readdirSync(this.docsFolder).filter(f => f.endsWith('.txt'));
        for (const fname of files) {
            const fpath = path.join(this.docsFolder, fname);
            this.rawDocs[fname] = fs.readFileSync(fpath, 'utf-8');
        }
    }

    _buildIndex() {
        console.log('Loading documents...');
        this._loadDocuments();

        console.log('Preprocessing text...');
        for (const [fname, text] of Object.entries(this.rawDocs)) {
            this.tokens[fname] = preprocess(text);
        }

        console.log('Computing TF scores...');
        for (const [fname, toks] of Object.entries(this.tokens)) {
            this.tf[fname] = computeTF(toks);
        }

        console.log('Computing IDF scores...');
        this.idf = computeIDF(this.tokens);

        console.log('Building TF-IDF matrix...');
        for (const fname of Object.keys(this.rawDocs)) {
            this.tfidf[fname] = {};
            for (const term in this.tf[fname]) {
                this.tfidf[fname][term] = this.tf[fname][term] * (this.idf[term] || 0);
            }
        }

        const numDocs = Object.keys(this.rawDocs).length;
        const numTerms = Object.keys(this.idf).length;
        console.log(`Index built: ${numDocs} documents, ${numTerms} unique terms.\n`);
    }

    search(query, topK = 5) {
        const queryTokens = preprocess(query);
        if (queryTokens.length === 0) return [];

        const queryTF = computeTF(queryTokens);
        const queryTFIDF = {};
        for (const term in queryTF) {
            queryTFIDF[term] = queryTF[term] * (this.idf[term] || 0);
        }

        const scores = Object.entries(this.tfidf).map(([fname, docVec]) => ({
            doc: fname,
            score: cosineSimilarity(queryTFIDF, docVec),
        }));

        return scores
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    getSnippet(filename, query, context = 60) {
        const text = this.rawDocs[filename] || '';
        const queryWords = query.toLowerCase().split(/\s+/)
            .filter(w => !STOPWORDS.has(w) && w.length > 2);
        const lowerText = text.toLowerCase();

        const positions = [];
        for (const word of queryWords) {
            let start = 0;
            while (true) {
                const pos = lowerText.indexOf(word, start);
                if (pos === -1) break;
                positions.push(pos);
                start = pos + 1;
            }
        }

        if (positions.length === 0) return text.slice(0, 150).trim() + '...';

        positions.sort((a, b) => a - b);

        // merge overlapping windows
        const windows = [];
        for (const pos of positions) {
            const lo = Math.max(0, pos - context);
            const hi = Math.min(text.length, pos + context);
            if (windows.length > 0 && lo <= windows[windows.length - 1][1]) {
                windows[windows.length - 1][1] = hi;
            } else {
                windows.push([lo, hi]);
            }
        }

        return windows.map(([lo, hi]) => {
            let chunk = text.slice(lo, hi).trim();
            if (lo > 0) chunk = '...' + chunk;
            if (hi < text.length) chunk += '...';
            return chunk;
        }).join('  |  ');
    }

    getStats() {
        const numDocs = Object.keys(this.rawDocs).length;
        const numTerms = Object.keys(this.idf).length;
        const topTerms = Object.entries(this.idf)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 10)
            .map(([t]) => t);
        return { numDocs, numTerms, topTerms };
    }
}

module.exports = SearchEngine;
