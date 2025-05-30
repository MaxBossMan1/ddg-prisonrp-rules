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
      // Getting next sub-rule number - check ALL rules (active and inactive) to avoid conflicts
      query = `
        SELECT MAX(sub_number) as max_sub 
        FROM rules 
        WHERE category_id = ? AND parent_rule_id = ?
      `;
      params = [categoryId, parentRuleId];
    } else {
      // Getting next main rule number - check ALL rules (active and inactive) to avoid conflicts
      query = `
        SELECT MAX(rule_number) as max_rule 
        FROM rules 
        WHERE category_id = ? AND parent_rule_id IS NULL
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
    
    // Check if rule code already exists and delete it if it does (for reactivated rules)
    await db.run('DELETE FROM rule_codes WHERE full_code = ?', [fullCode]);
    
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
    
    // If category is provided, validate it exists first
    if (category) {
      const categoryExists = await db.get(
        'SELECT id FROM categories WHERE letter_code = ?',
        [category.toUpperCase()]
      );
      
      if (!categoryExists) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }
    
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
    
    // Parse images JSON for each rule
    const rulesWithImages = rules.map(rule => {
        let images = [];
        try {
            if (rule.images && rule.images !== 'null' && rule.images !== '') {
                images = JSON.parse(rule.images);
            }
        } catch (e) {
            console.log('Error parsing images for rule', rule.id, ':', e);
            images = [];
        }
        return {
            ...rule,
            images: Array.isArray(images) ? images : []
        };
    });
    
    // Organize rules hierarchically
    const organizedRules = [];
    const ruleMap = new Map();
    
    rulesWithImages.forEach(rule => {
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
    
    // Parse images JSON for each rule
    const rulesWithImages = rules.map(rule => {
        let images = [];
        try {
            if (rule.images && rule.images !== 'null' && rule.images !== '') {
                images = JSON.parse(rule.images);
            }
        } catch (e) {
            console.log('Error parsing images for rule', rule.id, ':', e);
            images = [];
        }
        return {
            ...rule,
            images: Array.isArray(images) ? images : []
        };
    });
    
    // Organize hierarchically
    const organizedRules = [];
    const ruleMap = new Map();
    
    rulesWithImages.forEach(rule => {
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
    
    console.log(`Attempting to delete rule with ID: ${id}`);
    
    // Check if rule exists
    const rule = await db.get('SELECT * FROM rules WHERE id = ?', [id]);
    if (!rule) {
      console.log(`Rule with ID ${id} not found`);
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    console.log(`Found rule: ${rule.title} (ID: ${rule.id})`);
    
    // Check if this rule has sub-rules
    const subRules = await db.all('SELECT id FROM rules WHERE parent_rule_id = ? AND is_active = 1', [id]);
    if (subRules.length > 0) {
      console.log(`Rule has ${subRules.length} active sub-rules, deleting them first`);
      // Soft delete all sub-rules first
      await db.run('UPDATE rules SET is_active = 0 WHERE parent_rule_id = ?', [id]);
      // Delete rule codes for sub-rules
      await db.run('DELETE FROM rule_codes WHERE rule_id IN (SELECT id FROM rules WHERE parent_rule_id = ?)', [id]);
    }
    
    // Soft delete the main rule (set is_active to false)
    const deleteResult = await db.run('UPDATE rules SET is_active = 0 WHERE id = ?', [id]);
    console.log(`Delete result: ${deleteResult.changes} rows affected`);
    
    // Also delete the rule code entry to prevent conflicts
    await db.run('DELETE FROM rule_codes WHERE rule_id = ?', [id]);
    
    console.log(`Successfully deleted rule ${id}`);
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// GET /api/rules/:id/cross-references - Get cross-references for a specific rule
router.get('/:id/cross-references', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;
    
    // Get all cross-references where this rule is either source or target
    const query = `
      SELECT 
        rcr.*,
        -- Source rule details
        sr.id as source_id,
        src.name as source_category_name,
        src.letter_code as source_category_letter,
        src_rc.full_code as source_full_code,
        sr.title as source_title,
        
        -- Target rule details  
        tr.id as target_id,
        trc.name as target_category_name,
        trc.letter_code as target_category_letter,
        trc_rc.full_code as target_full_code,
        tr.title as target_title
      FROM rule_cross_references rcr
      -- Source rule joins
      LEFT JOIN rules sr ON rcr.source_rule_id = sr.id
      LEFT JOIN categories src ON sr.category_id = src.id
      LEFT JOIN rule_codes src_rc ON sr.id = src_rc.rule_id
      -- Target rule joins
      LEFT JOIN rules tr ON rcr.target_rule_id = tr.id
      LEFT JOIN categories trc ON tr.category_id = trc.id
      LEFT JOIN rule_codes trc_rc ON tr.id = trc_rc.rule_id
      WHERE (rcr.source_rule_id = ? OR rcr.target_rule_id = ?)
      AND sr.is_active = 1 AND tr.is_active = 1
      ORDER BY rcr.reference_type, rcr.created_at DESC
    `;
    
    const crossRefs = await db.all(query, [id, id]);
    
    // Group by relationship type and format the response
    const groupedRefs = crossRefs.reduce((acc, ref) => {
      if (!acc[ref.reference_type]) {
        acc[ref.reference_type] = [];
      }
      
      // Determine if this rule is source or target
      const isSource = ref.source_rule_id == id;
      const relatedRule = isSource ? {
        id: ref.target_id,
        title: ref.target_title,
        full_code: ref.target_full_code,
        category_name: ref.target_category_name
      } : {
        id: ref.source_id,
        title: ref.source_title,
        full_code: ref.source_full_code,
        category_name: ref.source_category_name
      };
      
      acc[ref.reference_type].push({
        id: ref.id,
        related_rule: relatedRule,
        reference_context: ref.reference_context,
        is_bidirectional: ref.is_bidirectional,
        created_at: ref.created_at,
        direction: isSource ? 'outgoing' : 'incoming'
      });
      
      return acc;
    }, {});
    
    res.json(groupedRefs);
  } catch (error) {
    console.error('Error fetching cross-references:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/rules/:id/cross-references - Add a cross-reference
router.post('/:id/cross-references', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_rule_id, reference_type = 'related', reference_context, is_bidirectional = true } = req.body;
    const db = req.app.locals.db;
    
    // Validate input
    if (!target_rule_id) {
      return res.status(400).json({ error: 'target_rule_id is required' });
    }
    
    if (id == target_rule_id) {
      return res.status(400).json({ error: 'Cannot create cross-reference to the same rule' });
    }
    
    // Check that both rules exist and are active
    const sourceRule = await db.get('SELECT * FROM rules WHERE id = ? AND is_active = 1', [id]);
    const targetRule = await db.get('SELECT * FROM rules WHERE id = ? AND is_active = 1', [target_rule_id]);
    
    if (!sourceRule || !targetRule) {
      return res.status(404).json({ error: 'One or both rules not found or inactive' });
    }
    
    // Check if cross-reference already exists
    const existing = await db.get(
      'SELECT * FROM rule_cross_references WHERE source_rule_id = ? AND target_rule_id = ? AND reference_type = ?',
      [id, target_rule_id, reference_type]
    );
    
    if (existing) {
      return res.status(409).json({ error: 'Cross-reference already exists' });
    }
    
    // Create the cross-reference (we'll add proper user auth later)
    const result = await db.run(
      `INSERT INTO rule_cross_references 
       (source_rule_id, target_rule_id, reference_type, reference_context, is_bidirectional, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, target_rule_id, reference_type, reference_context, is_bidirectional ? 1 : 0, 1] // Using 1 as placeholder for created_by
    );
    
    // Get the created cross-reference with full details
    const newCrossRef = await db.get(`
      SELECT 
        rcr.*,
        tr.title as target_title,
        trc.name as target_category_name,
        trc_rc.full_code as target_full_code
      FROM rule_cross_references rcr
      LEFT JOIN rules tr ON rcr.target_rule_id = tr.id
      LEFT JOIN categories trc ON tr.category_id = trc.id
      LEFT JOIN rule_codes trc_rc ON tr.id = trc_rc.rule_id
      WHERE rcr.id = ?
    `, [result.lastID]);
    
    res.status(201).json(newCrossRef);
  } catch (error) {
    console.error('Error creating cross-reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/rules/:id/cross-references/:crossRefId - Remove a cross-reference
router.delete('/:id/cross-references/:crossRefId', async (req, res) => {
  try {
    const { id, crossRefId } = req.params;
    const db = req.app.locals.db;
    
    // Check if cross-reference exists and belongs to this rule
    const crossRef = await db.get(
      'SELECT * FROM rule_cross_references WHERE id = ? AND (source_rule_id = ? OR target_rule_id = ?)',
      [crossRefId, id, id]
    );
    
    if (!crossRef) {
      return res.status(404).json({ error: 'Cross-reference not found' });
    }
    
    // Delete the cross-reference
    await db.run('DELETE FROM rule_cross_references WHERE id = ?', [crossRefId]);
    
    res.json({ message: 'Cross-reference deleted successfully' });
  } catch (error) {
    console.error('Error deleting cross-reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 