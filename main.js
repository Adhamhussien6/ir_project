const readline   = require('readline');
const path       = require('path');
const SearchEngine = require('./src/search_engine');

const DOCS_FOLDER = path.join(__dirname, 'documents');

const engine = new SearchEngine(DOCS_FOLDER);

const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
    prompt: 'Search> ',
});

console.log("Type a query to search  | 'quit' to exit\n");
rl.prompt();

rl.on('line', (line) => {
    const query = line.trim();

    if (!query) {
        rl.prompt();
        return;
    }

    if (query === 'quit') {
        console.log('Goodbye!');
        rl.close();
        return;
    }

  

    const results = engine.search(query, 5);

    if (results.length === 0) {
        console.log('\nNo results found.\n');
        rl.prompt();
        return;
    }

    console.log(`\nFound ${results.length} result(s):\n`);

    for (let i = 0; i < results.length; i++) {
        const { doc, score } = results[i];
        const name    = doc.replace(/_/g, ' ').replace('.txt', '');
        const snippet = engine.getSnippet(doc, query);
        console.log(`${i + 1}. ${name}  (score: ${score.toFixed(4)})`);
        console.log(`   ${snippet}\n`);
    }

    rl.prompt();
});

rl.on('close', () => process.exit(0));
