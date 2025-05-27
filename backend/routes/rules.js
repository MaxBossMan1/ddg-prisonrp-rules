const express = require('express');
const router = express.Router();

// Helper function to generate rule codes
function generateRuleCode(category_letter, rule_number, sub_number = null, revision_letter = 'a') {
  let code = `${category_letter}.${rule_number}`;
  if (sub_number) {
    code += `.${sub_number}`;
  }
  // Only add revision letter if it's not the first revision
  if (revision_letter !== 'a') {
    code += revision_letter;
  }
  return code;
}

// Helper function to get next rule number for a category
async function getNextRuleNumber(db, categoryId, parentRuleId = null) {
  try {
    let query, params;
    
    if (parentRuleId) {
      // Getting next sub-rule number
      query = `
        SELECT MAX(sub_number) as max_sub 
        FROM rules 
        WHERE category_id = ? AND parent_rule_id = ? AND is_active = 1
      `;
      params = [categoryId, parentRuleId];
    } else {
      // Getting next main rule number
      query = `
        SELECT MAX(rule_number) as max_rule 
        FROM rules 
        WHERE category_id = ? AND parent_rule_id IS NULL AND is_active = 1
      `;
      params = [categoryId];
    }
    
    const result = await db.get(query, params);
    
    if (parentRuleId) {
      return (result.max_sub || 0) + 1;
    } else {
      return (result.max_rule || 0) + 1;
    }
  } catch (error) {
    console.error('Error getting next rule number:', error);
    throw error;
  }
}

// Helper function to create rule code entry
async function createRuleCode(db, ruleId, categoryLetter, ruleNumber, subNumber, revisionLetter, title, content) {
  try {
    const fullCode = generateRuleCode(categoryLetter, ruleNumber, subNumber, revisionLetter);
    const truncatedDescription = content.substring(0, 100).replace(/\n/g, ' ') + (content.length > 100 ? '...' : '');
    const searchableContent = `${title} ${content}`.toLowerCase();
    
    await db.run(
      'INSERT INTO rule_codes (rule_id, full_code, truncated_description, searchable_content) VALUES (?, ?, ?, ?)',
      [ruleId, fullCode, truncatedDescription, searchableContent]
    );
    
    return fullCode;
  } catch (error) {
    console.error('Error creating rule code:', error);
    throw error;
  }
}

// GET /api/rules - Get all rules (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const db = req.app.locals.db;
    
    let query = `
      SELECT 
        r.*,
        c.name as category_name,
        c.letter_code as category_letter,
        rc.full_code,
        rc.truncated_description
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      LEFT JOIN rule_codes rc ON r.id = rc.rule_id
      WHERE r.is_active = 1
    `;
    
    let params = [];
    
    if (category) {
      query += ' AND c.letter_code = ?';
      params.push(category.toUpperCase());
    }
    
    query += ' ORDER BY c.order_index, r.rule_number, r.sub_number';
    
    const rules = await db.all(query, params);
    
    // Organize rules hierarchically
    const organizedRules = [];
    const ruleMap = new Map();
    
    rules.forEach(rule => {
      if (!rule.parent_rule_id) {
        // Main rule
        rule.sub_rules = [];
        organizedRules.push(rule);
        ruleMap.set(rule.id, rule);
      } else {
        // Sub-rule
        const parentRule = ruleMap.get(rule.parent_rule_id);
        if (parentRule) {
          parentRule.sub_rules.push(rule);
        }
      }
    });
    
    res.json(organizedRules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rules/category/:categoryId - Get rules for specific category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const db = req.app.locals.db;
    
    const query = `
      SELECT 
        r.*,
        c.name as category_name,
        c.letter_code as category_letter,
        rc.full_code,
        rc.truncated_description
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      LEFT JOIN rule_codes rc ON r.id = rc.rule_id
      WHERE r.category_id = ? AND r.is_active = 1
      ORDER BY r.rule_number, r.sub_number
    `;
    
    const rules = await db.all(query, [categoryId]);
    
    // Organize hierarchically
    const organizedRules = [];
    const ruleMap = new Map();
    
    rules.forEach(rule => {
      if (!rule.parent_rule_id) {
        rule.sub_rules = [];
        organizedRules.push(rule);
        ruleMap.set(rule.id, rule);
      } else {
        const parentRule = ruleMap.get(rule.parent_rule_id);
        if (parentRule) {
          parentRule.sub_rules.push(rule);
        }
      }
    });
    
    res.json(organizedRules);
  } catch (error) {
    console.error('Error fetching category rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rules/code/:code - Get rule by code (e.g., A.1, B.2.3)
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const db = req.app.locals.db;
    
    const query = `
      SELECT 
        r.*,
        c.name as category_name,
        c.letter_code as category_letter,
        rc.full_code,
        rc.truncated_description
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      LEFT JOIN rule_codes rc ON r.id = rc.rule_id
      WHERE rc.full_code = ? AND r.is_active = 1
    `;
    
    const rule = await db.get(query, [code.toUpperCase()]);
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error fetching rule by code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/rules - Create new rule
router.post('/', async (req, res) => {
  try {
    const { category_id, parent_rule_id, title, content, rule_type = 'main' } = req.body;
    const db = req.app.locals.db;
    
    // Validate required fields
    if (!category_id || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields: category_id, title, content' });
    }
    
    // Get category info
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Generate rule numbers
    let ruleNumber, subNumber = null;
    
    if (parent_rule_id) {
      // This is a sub-rule
      const parentRule = await db.get('SELECT * FROM rules WHERE id = ?', [parent_rule_id]);
      if (!parentRule) {
        return res.status(404).json({ error: 'Parent rule not found' });
      }
      ruleNumber = parentRule.rule_number;
      subNumber = await getNextRuleNumber(db, category_id, parent_rule_id);
    } else {
      // This is a main rule
      ruleNumber = await getNextRuleNumber(db, category_id);
    }
    
    // Insert rule
    const result = await db.run(
      `INSERT INTO rules 
       (category_id, parent_rule_id, title, content, rule_number, sub_number, rule_type, order_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, parent_rule_id, title, content, ruleNumber, subNumber, rule_type, ruleNumber * 100 + (subNumber || 0)]
    );
    
    const ruleId = result.id;
    
    // Create rule code entry
    const fullCode = await createRuleCode(db, ruleId, category.letter_code, ruleNumber, subNumber, 'a', title, content);
    
    // Get the created rule with all details
    const newRule = await db.get(`
      SELECT 
        r.*,
        c.name as category_name,
        c.letter_code as category_letter,
        rc.full_code,
        rc.truncated_description
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      LEFT JOIN rule_codes rc ON r.id = rc.rule_id
      WHERE r.id = ?
    `, [ruleId]);
    
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/rules/:id - Update rule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const db = req.app.locals.db;
    
    // Get existing rule
    const existingRule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
    if (!existingRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Update rule
    await db.run(
      'UPDATE rules SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title || existingRule.title, content || existingRule.content, id]
    );
    
    // Update rule code if content changed
    if (content && content !== existingRule.content) {
      const truncatedDescription = content.substring(0, 100).replace(/\n/g, ' ') + (content.length > 100 ? '...' : '');
      const searchableContent = `${title || existingRule.title} ${content}`.toLowerCase();
      
      await db.run(
        'UPDATE rule_codes SET truncated_description = ?, searchable_content = ? WHERE rule_id = ?',
        [truncatedDescription, searchableContent, id]
      );
    }
    
    // Get updated rule
    const updatedRule = await db.get(`
      SELECT 
        r.*,
        c.name as category_name,
        c.letter_code as category_letter,
        rc.full_code,
        rc.truncated_description
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      LEFT JOIN rule_codes rc ON r.id = rc.rule_id
      WHERE r.id = ?
    `, [id]);
    
    res.json(updatedRule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/rules/:id - Delete rule (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;
    
    // Check if rule exists
    const rule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Soft delete (set is_active to false)
    await db.run('UPDATE rules SET is_active = 0 WHERE id = ?', [id]);
    
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 