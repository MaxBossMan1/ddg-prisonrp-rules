const express = require('express');
const router = express.Router();

// GET /api/search - Search rules with autocomplete
router.get('/', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const db = req.app.locals.db;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const searchTerm = q.trim().toLowerCase();
    
    // Search in rule codes and content
    const query = `
      SELECT 
        r.id,
        r.title,
        r.content,
        c.name as category_name,
        c.letter_code as category_letter,
        rc.full_code,
        rc.truncated_description,
        CASE 
          WHEN rc.full_code LIKE ? THEN 1
          WHEN LOWER(r.title) LIKE ? THEN 2
          WHEN rc.searchable_content LIKE ? THEN 3
          ELSE 4
        END as relevance_score
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      LEFT JOIN rule_codes rc ON r.id = rc.rule_id
      WHERE r.is_active = 1 
        AND (
          rc.full_code LIKE ? 
          OR LOWER(r.title) LIKE ?
          OR rc.searchable_content LIKE ?
        )
      ORDER BY relevance_score, r.rule_number, r.sub_number
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const codePattern = `${searchTerm.toUpperCase()}%`;
    
    const results = await db.all(query, [
      codePattern,        // For relevance score 1
      searchPattern,      // For relevance score 2
      searchPattern,      // For relevance score 3
      codePattern,        // For WHERE clause code search
      searchPattern,      // For WHERE clause title search
      searchPattern,      // For WHERE clause content search
      parseInt(limit)
    ]);
    
    // Format results for autocomplete
    const formattedResults = results.map(rule => ({
      id: rule.id,
      code: rule.full_code,
      title: rule.title,
      description: rule.truncated_description,
      category: rule.category_name,
      category_letter: rule.category_letter,
      relevance: rule.relevance_score
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error searching rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/search/suggestions - Get search suggestions based on popular searches
router.get('/suggestions', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Get most common rule codes and titles for suggestions
    const query = `
      SELECT 
        rc.full_code as suggestion,
        'code' as type,
        COUNT(*) as frequency
      FROM rule_codes rc
      JOIN rules r ON rc.rule_id = r.id
      WHERE r.is_active = 1
      GROUP BY rc.full_code
      
      UNION ALL
      
      SELECT 
        r.title as suggestion,
        'title' as type,
        1 as frequency
      FROM rules r
      WHERE r.is_active = 1 AND LENGTH(r.title) < 50
      
      ORDER BY frequency DESC, suggestion ASC
      LIMIT 20
    `;
    
    const suggestions = await db.all(query);
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/search/history - Log search query (for analytics)
router.post('/history', async (req, res) => {
  try {
    const { query, results_count } = req.body;
    const db = req.app.locals.db;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Invalid search query' });
    }
    
    // Insert search history (optional feature for analytics)
    await db.run(
      'INSERT INTO search_history (query, results_count, search_date) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [query.trim(), results_count || 0]
    );
    
    res.json({ message: 'Search logged successfully' });
  } catch (error) {
    console.error('Error logging search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 