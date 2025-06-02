const Database = require('./backend/database/init');

async function updateUsername() {
    try {
        const db = new Database('./backend/database/ddg_prisonrp.db');
        await db.initialize();
        
        console.log('Current user data:');
        const user = await db.get('SELECT * FROM staff_users WHERE steam_id = ?', ['76561198157812847']);
        console.log(user);
        
        console.log('\nUpdating username to MaxBossMan1...');
        await db.run('UPDATE staff_users SET steam_username = ? WHERE steam_id = ?', ['MaxBossMan1', '76561198157812847']);
        
        const updatedUser = await db.get('SELECT * FROM staff_users WHERE steam_id = ?', ['76561198157812847']);
        console.log('Updated user data:');
        console.log(updatedUser);
        
        await db.close();
        console.log('\nUsername updated successfully!');
    } catch (error) {
        console.error('Error updating username:', error);
    }
}

updateUsername(); 