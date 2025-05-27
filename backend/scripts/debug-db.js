const Database = require('../database/init');
const path = require('path');

async function debugDatabase() {
    try {
        console.log('Starting debug...');
        // Initialize database
        const dbPath = path.join(__dirname, '../database/ddg_prisonrp.db');
        console.log('Database path:', dbPath);
        const database = new Database(dbPath);
        const db = await database.initialize();
        console.log('Database initialized');

        console.log('Checking database structure...');
        
        // Check categories
        const categories = await database.all('SELECT * FROM categories');
        console.log('Categories:', categories);
        
        // Clear existing rules
        await database.run('DELETE FROM rules');
        await database.run('DELETE FROM rule_codes');
        console.log('Cleared existing rules');
        
        // Test inserting a single rule
        console.log('Testing rule insertion...');
        
        const result = await database.run(
            `INSERT INTO rules 
             (category_id, title, content, rule_number, rule_type, order_index) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [1, 'Test Rule', 'This is a test rule content', 1, 'main', 100]
        );
        
        console.log('Insert result:', result);
        console.log('id:', result.id);
        
        if (result.id) {
            // Test rule code insertion
            const category = await database.get('SELECT * FROM categories WHERE id = ?', [1]);
            console.log('Category:', category);
            
            const fullCode = `${category.letter_code}.1`;
            const truncatedDescription = 'This is a test rule content';
            const searchableContent = 'test rule this is a test rule content';
            
            console.log('Inserting rule code:', {
                rule_id: result.id,
                full_code: fullCode,
                truncated_description: truncatedDescription,
                searchable_content: searchableContent
            });
            
            await database.run(
                'INSERT INTO rule_codes (rule_id, full_code, truncated_description, searchable_content) VALUES (?, ?, ?, ?)',
                [result.id, fullCode, truncatedDescription, searchableContent]
            );
            
            console.log('Rule code inserted successfully!');
        }
        
        // Check final state
        const rules = await database.all('SELECT * FROM rules');
        const ruleCodes = await database.all('SELECT * FROM rule_codes');
        
        console.log('Final rules:', rules);
        console.log('Final rule codes:', ruleCodes);
        
        await database.close();
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugDatabase(); 