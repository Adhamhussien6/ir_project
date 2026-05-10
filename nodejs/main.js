const readline = require('readline');
const path = require('path');
const SearchEngine = require('./search_engine');

const DOCS_FOLDER = path.join(__dirname, '..', 'documents');

const BANNER = `
+----------------------------------------------+
|        TF-IDF Search Engine (Node.js)        |
|  Information Retrieval Project - Spring 2025 |
+----------------------------------------------+
`;

function displayResults(results, engine, query) {
    if (results.length === 0) {
        console.log('\n  No matching documents found.\n');
        return;
    }

    console.log(`\n  Found ${results.length} result(s):\n`);
    console.log(`  ${'Rank'.padEnd(6)} ${'Document'.padEnd(45)} ${'Score'.padEnd(10)}`);
    console.log('  ' + '-'.repeat(63));

    results.forEach(({ doc, score }, i) => {
        const cleanName = doc.replace(/_/g, ' ').replace('.txt', '');
        console.log(`  ${String(i + 1).padEnd(6)} ${cleanName.padEnd(45)} ${score.toFixed(4)}`);
        const snippet = engine.getSnippet(doc, query);
        console.log(`         [${snippet}]\n`);
    });
}

function main() {
    console.log(BANNER);
    const engine = new SearchEngine(DOCS_FOLDER);

    console.log("  Commands: type a query to search | 'stats' for index info | 'quit' to exit\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '  Search> ',
    });

    rl.prompt();

    rl.on('line', (line) => {
        const query = line.trim();

        if (!query) {
            rl.prompt();
            return;
        }

        if (query.toLowerCase() === 'quit') {
            console.log('  Goodbye!');
            rl.close();
            return;
        }

        if (query.toLowerCase() === 'stats') {
            const { numDocs, numTerms, topTerms } = engine.getStats();
            console.log(`\n  Documents indexed : ${numDocs}`);
            console.log(`  Unique terms      : ${numTerms}`);
            console.log(`  Most common terms : ${topTerms.join(', ')}\n`);
            rl.prompt();
            return;
        }

        const results = engine.search(query, 5);
        displayResults(results, engine, query);
        rl.prompt();
    });

    rl.on('close', () => process.exit(0));
}

main();
