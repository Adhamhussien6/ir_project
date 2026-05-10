const fs   = require('fs');
const path = require('path');

const STOPWORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with',
    'by','from','as','is','was','are','were','be','been','being','have',
    'has','had','do','does','did','will','would','could','should','may',
    'might','shall','can','it','its','this','that','these','those','i',
    'we','you','he','she','they','me','us','him','her','them','my','our',
    'your','his','their','what','which','who','when','where','how','all',
    'also','more','into','than','then','so','such','about','up','out','if',
    'not','no','only','new','other','while','both','each','over','after',
    'before','between','through','during','without','like','used','use',
    'using','now','well','very','most','many','much','some','any','one',
    'two','three','first','second','however','including','make','made',
    'still','known','often','even','since','continue','continued',
]);

function preprocess(text) {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    return words.filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function computeTF(tokens) {
    const counts = {};
    for (const word of tokens) {
        counts[word] = (counts[word] || 0) + 1;
    }
    const tf = {};
    for (const word in counts) {
        tf[word] = counts[word] / tokens.length;
    }
    return tf;
}

function computeIDF(allTokens) {
    const totalDocs = Object.keys(allTokens).length;
    const docCount  = {};
    for (const tokens of Object.values(allTokens)) {
        for (const word of new Set(tokens)) {
            docCount[word] = (docCount[word] || 0) + 1;
        }
    }
    const idf = {};
    for (const word in docCount) {
        idf[word] = Math.log10(totalDocs / docCount[word]);
    }
    return idf;
}

function cosineSimilarity(vecA, vecB) {
    let dot  = 0;
    let magA = 0;
    let magB = 0;

    for (const word in vecA) {
        magA += vecA[word] ** 2;
        if (word in vecB) dot += vecA[word] * vecB[word];
    }
    for (const word in vecB) {
        magB += vecB[word] ** 2;
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

class SearchEngine {
    constructor(docsFolder) {
        this.rawDocs = {};
        this.tfidf   = {};
        this.idf     = {};
        this._buildIndex(docsFolder);
    }

    _buildIndex(docsFolder) {
        console.log('Loading documents...');
        const files = fs.readdirSync(docsFolder).filter(f => f.endsWith('.txt'));
        for (const file of files) {
            this.rawDocs[file] = fs.readFileSync(path.join(docsFolder, file), 'utf-8');
        }

        console.log('Preprocessing & computing TF...');
        const allTokens = {};
        const allTF     = {};
        for (const file in this.rawDocs) {
            const tokens    = preprocess(this.rawDocs[file]);
            allTokens[file] = tokens;
            allTF[file]     = computeTF(tokens);
        }

        console.log('Computing IDF...');
        this.idf = computeIDF(allTokens);

        console.log('Building TF-IDF matrix...');
        for (const file in this.rawDocs) {
            this.tfidf[file] = {};
            for (const word in allTF[file]) {
                this.tfidf[file][word] = allTF[file][word] * (this.idf[word] || 0);
            }
        }

        console.log(`Index ready: ${files.length} documents, ${Object.keys(this.idf).length} terms.\n`);
    }

    search(query, topK = 5) {
        const queryTokens = preprocess(query);
        if (queryTokens.length === 0) return [];

        const queryTF  = computeTF(queryTokens);
        const queryVec = {};
        for (const word in queryTF) {
            queryVec[word] = queryTF[word] * (this.idf[word] || 0);
        }

        const results = [];
        for (const file in this.tfidf) {
            const score = cosineSimilarity(queryVec, this.tfidf[file]);
            if (score > 0) results.push({ doc: file, score });
        }

        return results.sort((a, b) => b.score - a.score).slice(0, topK);
    }

    getSnippet(filename, query, contextChars = 60) {
        const text      = this.rawDocs[filename] || '';
        const lowerText = text.toLowerCase();
        const words     = preprocess(query);

        const positions = [];
        for (const word of words) {
            let i = 0;
            while (true) {
                const pos = lowerText.indexOf(word, i);
                if (pos === -1) break;
                positions.push(pos);
                i = pos + 1;
            }
        }

        if (positions.length === 0) return text.slice(0, 150).trim() + '...';

        positions.sort((a, b) => a - b);

        const windows = [];
        for (const pos of positions) {
            const start = Math.max(0, pos - contextChars);
            const end   = Math.min(text.length, pos + contextChars);
            const last  = windows[windows.length - 1];
            if (last && start <= last[1]) {
                last[1] = end;
            } else {
                windows.push([start, end]);
            }
        }

        return windows.map(([s, e]) => {
            let chunk = text.slice(s, e).trim();
            if (s > 0)          chunk = '...' + chunk;
            if (e < text.length) chunk += '...';
            return chunk;
        }).join('  |  ');
    }

    getStats() {
        const topTerms = Object.entries(this.idf)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 10)
            .map(([term]) => term);
        return {
            numDocs:  Object.keys(this.rawDocs).length,
            numTerms: Object.keys(this.idf).length,
            topTerms,
        };
    }
}

module.exports = SearchEngine;
