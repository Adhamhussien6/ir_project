const https = require('https');
const fs = require('fs');
const path = require('path');

const DOCS_FOLDER = path.join(__dirname, '..', 'documents');

const TOPICS = [
    // Science & Technology
    'Machine_learning', 'Artificial_intelligence', 'Deep_learning',
    'Natural_language_processing', 'Computer_vision', 'Neural_network',
    'Reinforcement_learning', 'Support_vector_machine', 'Random_forest',
    'Convolutional_neural_network', 'Recurrent_neural_network',
    'Transformer_(deep_learning)', 'BERT_(language_model)',
    'Python_(programming_language)', 'JavaScript', 'Java_(programming_language)',
    'C++', 'Rust_(programming_language)', 'Go_(programming_language)',
    'TypeScript', 'SQL', 'Database', 'Relational_database',
    'NoSQL', 'MongoDB', 'PostgreSQL', 'Redis',
    'Computer_network', 'Internet', 'World_Wide_Web', 'Hypertext_Transfer_Protocol',
    'Cryptography', 'Blockchain', 'Bitcoin', 'Cloud_computing',
    'Operating_system', 'Linux', 'Android_(operating_system)',
    'Quantum_computing', 'Robotics', 'Internet_of_things',
    'Computer_security', 'Algorithm', 'Data_structure', 'Binary_tree',
    'Graph_theory', 'Sorting_algorithm',
    'Compiler', 'Virtual_machine', 'Docker_(software)',
    'Git', 'Agile_software_development', 'DevOps',
    'Application_programming_interface', 'Microservices',
    'Artificial_neural_network', 'Generative_adversarial_network',
    'Large_language_model', 'ChatGPT', 'Computer_graphics',
    'Video_game', 'Augmented_reality', 'Virtual_reality',
    'Semiconductor', 'Integrated_circuit', 'Central_processing_unit',
    'Graphics_processing_unit', 'Supercomputer',

    // Physics & Space
    'Space_exploration', 'NASA', 'SpaceX', 'International_Space_Station',
    'Mars', 'Moon', 'Black_hole', 'Big_Bang', 'General_relativity',
    'Quantum_mechanics', 'String_theory', 'Dark_matter', 'Dark_energy',
    'Milky_Way', 'Solar_System', 'Exoplanet', 'Telescope',
    'James_Webb_Space_Telescope', 'Hubble_Space_Telescope',
    'Nuclear_fusion', 'Particle_physics', 'Higgs_boson',
    'Speed_of_light', 'Special_relativity', 'Thermodynamics',
    'Electromagnetism', 'Gravity', 'Neutron_star', 'Supernova',
    'Galaxy', 'Universe', 'Spacetime', 'Atom',
    'Periodic_table', 'Chemical_element', 'Nuclear_fission',

    // Biology & Medicine
    'DNA', 'Genetics', 'Evolution', 'Cell_(biology)', 'Photosynthesis',
    'Human_brain', 'Neuroscience', 'Cancer', 'Vaccine',
    'Antibiotic', 'Virus', 'Bacteria', 'Immune_system',
    'CRISPR', 'Stem_cell', 'Protein', 'Enzyme',
    'COVID-19', 'Alzheimer%27s_disease', 'Diabetes',
    'Heart', 'Lung', 'Kidney', 'Blood',
    'Chromosome', 'RNA', 'Antibiotic_resistance',
    'Pandemic', 'Epidemiology', 'Surgery',
    'Antibiotic', 'Hormone', 'Nervous_system',
    'Skeleton', 'Muscle', 'Digestion',

    // Environment & Energy
    'Climate_change', 'Global_warming', 'Greenhouse_gas',
    'Renewable_energy', 'Solar_energy', 'Wind_power', 'Hydropower',
    'Nuclear_power', 'Electric_vehicle', 'Carbon_dioxide',
    'Biodiversity', 'Deforestation', 'Ocean', 'Coral_reef',
    'Ozone_layer', 'Air_pollution', 'Recycling',
    'Fossil_fuel', 'Coal', 'Natural_gas', 'Petroleum',
    'Earthquake', 'Volcano', 'Tsunami', 'Hurricane',
    'Glacier', 'Sea_level_rise', 'Wildfire',
    'Wetland', 'Rainforest', 'Desert', 'Tundra',
    'Water_cycle', 'Nitrogen_cycle', 'Ecosystem',

    // History & Civilizations
    'Ancient_Egypt', 'Ancient_Rome', 'Ancient_Greece', 'Byzantine_Empire',
    'Ottoman_Empire', 'Mongol_Empire', 'World_War_I', 'World_War_II',
    'Cold_War', 'French_Revolution', 'Industrial_Revolution',
    'Renaissance', 'Middle_Ages', 'Egyptian_pyramids', 'Cleopatra',
    'Julius_Caesar', 'Napoleon_Bonaparte', 'Alexander_the_Great',
    'Genghis_Khan', 'Leonardo_da_Vinci', 'Isaac_Newton', 'Albert_Einstein',
    'Roman_Empire', 'British_Empire', 'Silk_Road',
    'American_Revolution', 'Russian_Revolution',
    'Holocaust', 'Slavery', 'Colonialism',
    'Ancient_China', 'Mesopotamia', 'Aztec_Empire', 'Inca_Empire',
    'Viking_Age', 'Crusades', 'Black_Death',
    'Abraham_Lincoln', 'Winston_Churchill', 'Mahatma_Gandhi',
    'Martin_Luther_King_Jr.', 'Nelson_Mandela',

    // Sports
    'Association_football', 'Basketball', 'Tennis', 'Cricket',
    'Olympic_Games', 'FIFA_World_Cup', 'NBA', 'Lionel_Messi',
    'Cristiano_Ronaldo', 'LeBron_James', 'Roger_Federer',
    'Tour_de_France', 'Formula_One', 'Rugby_union', 'Baseball',
    'Swimming_(sport)', 'Athletics_(sport)',
    'Golf', 'Volleyball', 'Ice_hockey', 'Boxing',
    'Mixed_martial_arts', 'Cycling', 'Skiing',
    'Super_Bowl', 'Wimbledon_Championships', 'UEFA_Champions_League',
    'Michael_Jordan', 'Usain_Bolt', 'Serena_Williams',
    'Muhammad_Ali', 'Tiger_Woods',

    // Arts, Culture & Philosophy
    'Philosophy', 'Democracy', 'Capitalism', 'Socialism',
    'Psychology', 'Sociology', 'Economics', 'Globalization',
    'Music', 'Film', 'Literature', 'Architecture',
    'Painting', 'Sculpture', 'Photography', 'Theatre',
    'Aristotle', 'Plato', 'Immanuel_Kant', 'Karl_Marx',
    'Sigmund_Freud', 'Charles_Darwin',
    'Jazz', 'Rock_music', 'Classical_music', 'Hip_hop_music',
    'William_Shakespeare', 'Beethoven', 'Mozart',
    'Pablo_Picasso', 'Michelangelo', 'Rembrandt',
    'Novel', 'Poetry', 'Mythology', 'Religion',
    'Islam', 'Christianity', 'Buddhism', 'Hinduism',
    'Human_rights', 'Feminism', 'Liberalism',

    // Geography & Countries
    'Egypt', 'United_States', 'China', 'India', 'Brazil',
    'Germany', 'France', 'United_Kingdom', 'Japan', 'Russia',
    'Amazon_rainforest', 'Sahara', 'Nile', 'Mount_Everest',
    'Great_Wall_of_China', 'Eiffel_Tower',
    'Canada', 'Australia', 'Mexico', 'Argentina',
    'South_Africa', 'Nigeria', 'Kenya', 'Ethiopia',
    'Saudi_Arabia', 'Turkey', 'Iran', 'Pakistan',
    'Mediterranean_Sea', 'Atlantic_Ocean', 'Pacific_Ocean',
    'Amazon_River', 'Mississippi_River', 'Yangtze',
    'Alps', 'Andes', 'Rocky_Mountains', 'Himalayas',
    'New_York_City', 'London', 'Paris', 'Tokyo',
    'United_Nations', 'European_Union',

    // Food & Health
    'Nutrition', 'Carbohydrate', 'Vitamin',
    'Mediterranean_diet', 'Obesity', 'Exercise', 'Meditation',
    'Sleep', 'Mental_health',
    'Coffee', 'Tea', 'Chocolate', 'Bread', 'Rice',
    'Vegetarianism', 'Veganism', 'Fasting',
    'Depression_(mood)', 'Anxiety', 'Stress_(biology)',
    'Yoga', 'Running', 'Weightlifting',
];

function fetchOne(title) {
    return new Promise((resolve) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=true&format=json&redirects=1`;
        https.get(url, { headers: { 'User-Agent': 'TF-IDF-Search-Engine/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const page = Object.values(json.query.pages)[0];
                    if (page.missing === undefined && page.extract && page.extract.length > 500) {
                        resolve({ title: page.title, content: page.extract });
                    } else {
                        resolve(null);
                    }
                } catch {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').toLowerCase();
}

async function fetchAll() {
    if (!fs.existsSync(DOCS_FOLDER)) fs.mkdirSync(DOCS_FOLDER, { recursive: true });

    // skip already downloaded articles
    const alreadySaved = new Set(
        fs.readdirSync(DOCS_FOLDER).filter(f => f.startsWith('wiki_'))
    );

    const remaining = TOPICS.filter(t => {
        const fname = `wiki_${sanitizeFilename(t)}.txt`;
        return !alreadySaved.has(fname);
    });

    console.log(`Already saved: ${alreadySaved.size} | Remaining: ${remaining.length}\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < remaining.length; i++) {
        const result = await fetchOne(remaining[i]);

        if (result) {
            const fname = `wiki_${sanitizeFilename(result.title)}.txt`;
            const fpath = path.join(DOCS_FOLDER, fname);
            fs.writeFileSync(fpath, `${result.title}\n\n${result.content}`, 'utf-8');
            process.stdout.write(`  [OK] ${result.title}\n`);
            success++;
        } else {
            failed++;
        }

        process.stdout.write(`  Progress: ${i + 1}/${remaining.length} | Total saved: ${alreadySaved.size + success}\n`);
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nDone! ${success} articles saved, ${failed} failed/skipped.`);
    console.log(`Documents folder: ${DOCS_FOLDER}`);
}

fetchAll().catch(console.error);
