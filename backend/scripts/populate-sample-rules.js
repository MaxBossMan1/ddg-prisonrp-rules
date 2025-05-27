const Database = require('../database/init');
const path = require('path');

async function populateSampleRules() {
    try {
        // Initialize database
        const dbPath = path.join(__dirname, '../database/ddg_prisonrp.db');
        const database = new Database(dbPath);
        await database.initialize();

        console.log('Adding sample rules...');

        // Sample rules for different categories
        const sampleRules = [
            // General Rules (Category A)
            {
                category_id: 1, // General Rules
                title: "No Random Death Match (RDM)",
                content: "Players are not allowed to kill other players without a valid roleplay reason. This includes:\n\n• Killing someone because you don't like them\n• Killing for no reason at all\n• Revenge killing outside of roleplay context\n\nPunishment: 3-day ban for first offense, permanent ban for repeat offenders.",
                rule_type: "main"
            },
            {
                category_id: 1,
                title: "No Meta Gaming",
                content: "Using information obtained outside of roleplay (such as Discord, Steam chat, or other external sources) to gain an advantage in-game is strictly prohibited.\n\nExamples include:\n• Using Discord to coordinate raids\n• Sharing locations through Steam chat\n• Using external voice chat during gameplay",
                rule_type: "main"
            },
            {
                category_id: 1,
                title: "Respect All Players",
                content: "Harassment, discrimination, or toxic behavior towards other players will not be tolerated. This includes but is not limited to:\n\n• Racist, sexist, or homophobic language\n• Personal attacks or doxxing\n• Excessive trolling or griefing\n• Spam in chat or voice channels",
                rule_type: "main"
            },

            // Prison Rules (Category B)
            {
                category_id: 2, // Prison Rules
                title: "Prisoner Conduct",
                content: "All prisoners must follow basic conduct rules while incarcerated:\n\n• Follow all guard orders unless they violate server rules\n• No rioting without proper roleplay escalation\n• Respect the prison hierarchy and established gangs\n• No exploiting prison systems or glitches",
                rule_type: "main"
            },
            {
                category_id: 2,
                title: "Contraband Rules",
                content: "Contraband items are regulated within the prison system:\n\n• Weapons must be obtained through proper roleplay channels\n• No spawning items through exploits\n• Trading contraband must involve realistic roleplay\n• Guards may search prisoners at any time",
                rule_type: "main"
            },

            // Guard Rules (Category C)
            {
                category_id: 3, // Guard Rules
                title: "Guard Authority",
                content: "Guards have authority over prisoners but must exercise it responsibly:\n\n• Use appropriate force for the situation\n• Follow proper arrest and search procedures\n• Maintain professional conduct at all times\n• Report rule violations to staff immediately",
                rule_type: "main"
            },
            {
                category_id: 3,
                title: "Use of Force Policy",
                content: "Guards must follow escalation procedures when dealing with prisoners:\n\n1. Verbal warnings first\n2. Non-lethal force if necessary\n3. Lethal force only in extreme situations\n4. Document all incidents properly",
                rule_type: "main"
            },

            // Staff Rules (Category D)
            {
                category_id: 4, // Staff Rules
                title: "Staff Conduct",
                content: "All staff members must maintain the highest standards of conduct:\n\n• Remain impartial in all situations\n• Use admin powers only when necessary\n• Document all administrative actions\n• Treat all players with respect and fairness",
                rule_type: "main"
            },

            // Roleplay Rules (Category E)
            {
                category_id: 5, // Roleplay Rules
                title: "Character Development",
                content: "All players must maintain realistic character development:\n\n• Create believable backstories for your character\n• Stay in character at all times during roleplay\n• Character actions must have realistic consequences\n• No overpowered or unrealistic characters",
                rule_type: "main"
            },
            {
                category_id: 5,
                title: "Roleplay Scenarios",
                content: "All roleplay scenarios must be realistic and engaging:\n\n• Plan major events with staff approval\n• Include other players in your storylines\n• Respect other players' roleplay choices\n• No forcing unrealistic scenarios on others",
                rule_type: "main"
            }
        ];

        // Insert rules and generate codes
        for (let i = 0; i < sampleRules.length; i++) {
            const rule = sampleRules[i];
            
            // Get category info
            const category = await database.get('SELECT * FROM categories WHERE id = ?', [rule.category_id]);
            
            // Get next rule number for this category
            const maxRuleResult = await database.get(
                'SELECT MAX(rule_number) as max_rule FROM rules WHERE category_id = ? AND parent_rule_id IS NULL AND is_active = 1',
                [rule.category_id]
            );
            const ruleNumber = (maxRuleResult.max_rule || 0) + 1;
            
            // Insert rule
            const result = await database.run(
                `INSERT INTO rules 
                 (category_id, title, content, rule_number, rule_type, order_index) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [rule.category_id, rule.title, rule.content, ruleNumber, rule.rule_type, ruleNumber * 100]
            );
            
            const ruleId = result.id;
            
            // Generate rule code
            const fullCode = `${category.letter_code}.${ruleNumber}`;
            const truncatedDescription = rule.content.substring(0, 100).replace(/\n/g, ' ') + (rule.content.length > 100 ? '...' : '');
            const searchableContent = `${rule.title} ${rule.content}`.toLowerCase();
            
            // Insert rule code
            await database.run(
                'INSERT INTO rule_codes (rule_id, full_code, truncated_description, searchable_content) VALUES (?, ?, ?, ?)',
                [ruleId, fullCode, truncatedDescription, searchableContent]
            );
            
            console.log(`Added rule ${fullCode}: ${rule.title}`);
        }

        // Add some sub-rules as examples
        console.log('Adding sample sub-rules...');
        
        // Get the first rule to add sub-rules to
        const parentRule = await database.get('SELECT * FROM rules WHERE rule_number = 1 AND category_id = 1');
        
        if (parentRule) {
            const subRules = [
                {
                    title: "RDM in Self-Defense",
                    content: "Self-defense is allowed when your life is in immediate danger. However, you must be able to prove the threat was real and imminent."
                },
                {
                    title: "RDM During Events",
                    content: "Special event rules may override standard RDM rules. Always check with staff before participating in events that involve combat."
                }
            ];

            for (let i = 0; i < subRules.length; i++) {
                const subRule = subRules[i];
                const subNumber = i + 1;
                
                // Insert sub-rule
                const result = await database.run(
                    `INSERT INTO rules 
                     (category_id, parent_rule_id, title, content, rule_number, sub_number, rule_type, order_index) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [parentRule.category_id, parentRule.id, subRule.title, subRule.content, 
                     parentRule.rule_number, subNumber, 'sub', parentRule.rule_number * 100 + subNumber]
                );
                
                const subRuleId = result.id;
                
                // Generate sub-rule code
                const category = await database.get('SELECT * FROM categories WHERE id = ?', [parentRule.category_id]);
                const fullCode = `${category.letter_code}.${parentRule.rule_number}.${subNumber}`;
                const truncatedDescription = subRule.content.substring(0, 100).replace(/\n/g, ' ') + (subRule.content.length > 100 ? '...' : '');
                const searchableContent = `${subRule.title} ${subRule.content}`.toLowerCase();
                
                // Insert sub-rule code
                await database.run(
                    'INSERT INTO rule_codes (rule_id, full_code, truncated_description, searchable_content) VALUES (?, ?, ?, ?)',
                    [subRuleId, fullCode, truncatedDescription, searchableContent]
                );
                
                console.log(`Added sub-rule ${fullCode}: ${subRule.title}`);
            }
        }

        console.log('Sample rules added successfully!');
        await database.close();
        
    } catch (error) {
        console.error('Error populating sample rules:', error);
        process.exit(1);
    }
}

// Run the script
populateSampleRules(); 