const express = require('express');
const { requireAuth, requirePermission } = require('./auth');
const ActivityLogger = require('../middleware/activityLogger');
const router = express.Router();

// Activity logging middleware for all analytics routes
router.use(ActivityLogger.middleware('access', 'analytics'));

// Rule popularity and view analytics
router.get('/rule-views', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { days = 30, limit = 20, categoryId } = req.query;
        const db = require('../database/init').getInstance();

        // Get rule view analytics from search history and staff activity
        let query = `
            SELECT 
                r.id,
                r.title,
                r.rule_number,
                r.sub_number,
                rc.full_code,
                c.name as category_name,
                c.letter_code,
                COUNT(DISTINCT sh.id) as search_mentions,
                COUNT(DISTINCT sal.id) as staff_views,
                (COUNT(DISTINCT sh.id) + COUNT(DISTINCT sal.id)) as total_activity
            FROM rules r
            JOIN categories c ON r.category_id = c.id
            LEFT JOIN rule_codes rc ON r.id = rc.rule_id
            LEFT JOIN search_history sh ON (
                sh.query LIKE '%' || rc.full_code || '%' 
                OR sh.query LIKE '%' || r.title || '%'
            ) AND sh.search_date >= datetime('now', '-${days} days')
            LEFT JOIN staff_activity_logs sal ON (
                sal.resource_type = 'rule' 
                AND sal.resource_id = r.id
                AND sal.created_at >= datetime('now', '-${days} days')
            )
            WHERE r.is_active = 1
        `;

        let params = [];
        
        if (categoryId) {
            query += ' AND r.category_id = ?';
            params.push(categoryId);
        }

        query += `
            GROUP BY r.id, r.title, r.rule_number, r.sub_number, rc.full_code, c.name, c.letter_code
            ORDER BY total_activity DESC, search_mentions DESC
            LIMIT ?
        `;
        params.push(parseInt(limit));

        const ruleViews = await db.all(query, params);

        res.json({
            period: `${days} days`,
            rules: ruleViews,
            totalRules: ruleViews.length
        });
    } catch (error) {
        console.error('Error fetching rule views analytics:', error);
        res.status(500).json({ error: 'Failed to fetch rule views analytics' });
    }
});

// Search trends and popular queries
router.get('/search-trends', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { days = 30, limit = 20 } = req.query;
        const db = require('../database/init').getInstance();

        // Get search trends
        const [popularQueries, searchVolume, noResultQueries] = await Promise.all([
            // Most popular search queries
            db.all(`
                SELECT 
                    query,
                    COUNT(*) as search_count,
                    AVG(results_count) as avg_results,
                    MAX(search_date) as last_searched
                FROM search_history 
                WHERE search_date >= datetime('now', '-${days} days')
                AND LENGTH(query) >= 2
                GROUP BY LOWER(query)
                ORDER BY search_count DESC
                LIMIT ?
            `, [parseInt(limit)]),

            // Daily search volume
            db.all(`
                SELECT 
                    DATE(search_date) as search_date,
                    COUNT(*) as search_count,
                    COUNT(DISTINCT query) as unique_queries,
                    AVG(results_count) as avg_results_per_search
                FROM search_history 
                WHERE search_date >= datetime('now', '-${days} days')
                GROUP BY DATE(search_date)
                ORDER BY search_date DESC
            `),

            // Queries with no results (potential content gaps)
            db.all(`
                SELECT 
                    query,
                    COUNT(*) as search_count,
                    MAX(search_date) as last_searched
                FROM search_history 
                WHERE search_date >= datetime('now', '-${days} days')
                AND results_count = 0
                AND LENGTH(query) >= 2
                GROUP BY LOWER(query)
                ORDER BY search_count DESC
                LIMIT ?
            `, [parseInt(limit)])
        ]);

        res.json({
            period: `${days} days`,
            popularQueries,
            searchVolume,
            noResultQueries,
            insights: {
                totalSearches: popularQueries.reduce((sum, q) => sum + q.search_count, 0),
                uniqueQueries: popularQueries.length,
                avgResultsPerSearch: popularQueries.length > 0 
                    ? popularQueries.reduce((sum, q) => sum + q.avg_results, 0) / popularQueries.length 
                    : 0
            }
        });
    } catch (error) {
        console.error('Error fetching search trends:', error);
        res.status(500).json({ error: 'Failed to fetch search trends' });
    }
});

// Enhanced staff activity metrics
router.get('/staff-activity', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { days = 30, staffUserId, detailed = false } = req.query;
        const db = require('../database/init').getInstance();

        let whereClause = `WHERE sal.created_at >= datetime('now', '-${days} days')`;
        let params = [];

        if (staffUserId) {
            whereClause += ' AND sal.staff_user_id = ?';
            params.push(staffUserId);
        }

        // Get activity summary by staff member
        const activitySummary = await db.all(`
            SELECT 
                su.id,
                su.discord_username as steam_username,
                su.permission_level,
                COUNT(sal.id) as total_actions,
                COUNT(CASE WHEN sal.action_type = 'create' THEN 1 END) as creates,
                COUNT(CASE WHEN sal.action_type = 'update' THEN 1 END) as updates,
                COUNT(CASE WHEN sal.action_type = 'delete' THEN 1 END) as deletes,
                COUNT(CASE WHEN sal.resource_type = 'rule' THEN 1 END) as rule_actions,
                COUNT(CASE WHEN sal.resource_type = 'announcement' THEN 1 END) as announcement_actions,
                COUNT(CASE WHEN sal.resource_type = 'category' THEN 1 END) as category_actions,
                COUNT(CASE WHEN sal.resource_type = 'image' THEN 1 END) as image_actions,
                AVG(sal.duration_ms) as avg_response_time,
                COUNT(CASE WHEN sal.success = 0 THEN 1 END) as failed_actions,
                MIN(sal.created_at) as first_action,
                MAX(sal.created_at) as last_action
            FROM staff_users su
            LEFT JOIN staff_activity_logs sal ON su.id = sal.staff_user_id ${whereClause.replace('WHERE', 'AND')}
            WHERE su.is_active = 1
            GROUP BY su.id, su.discord_username, su.permission_level
            ORDER BY total_actions DESC
        `, params);

        let detailedData = {};
        
        if (detailed === 'true') {
            // Get daily activity breakdown
            const dailyActivity = await db.all(`
                SELECT 
                    DATE(sal.created_at) as activity_date,
                    sal.action_type,
                    sal.resource_type,
                    COUNT(*) as action_count
                FROM staff_activity_logs sal
                ${whereClause}
                GROUP BY DATE(sal.created_at), sal.action_type, sal.resource_type
                ORDER BY activity_date DESC
            `, params);

            // Get performance metrics
            const performanceMetrics = await db.all(`
                SELECT 
                    sal.action_type,
                    sal.resource_type,
                    AVG(sal.duration_ms) as avg_duration,
                    MIN(sal.duration_ms) as min_duration,
                    MAX(sal.duration_ms) as max_duration,
                    COUNT(CASE WHEN sal.success = 1 THEN 1 END) as successful_actions,
                    COUNT(CASE WHEN sal.success = 0 THEN 1 END) as failed_actions,
                    COUNT(*) as total_actions
                FROM staff_activity_logs sal
                ${whereClause}
                GROUP BY sal.action_type, sal.resource_type
                ORDER BY total_actions DESC
            `, params);

            detailedData = {
                dailyActivity,
                performanceMetrics
            };
        }

        res.json({
            period: `${days} days`,
            activitySummary,
            ...detailedData,
            insights: {
                totalStaffMembers: activitySummary.length,
                activeStaffMembers: activitySummary.filter(staff => staff.total_actions > 0).length,
                totalActions: activitySummary.reduce((sum, staff) => sum + staff.total_actions, 0),
                avgActionsPerStaff: activitySummary.length > 0 
                    ? activitySummary.reduce((sum, staff) => sum + staff.total_actions, 0) / activitySummary.length 
                    : 0
            }
        });
    } catch (error) {
        console.error('Error fetching staff activity analytics:', error);
        res.status(500).json({ error: 'Failed to fetch staff activity analytics' });
    }
});

// Content analytics - rules and announcements statistics
router.get('/content-stats', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const db = require('../database/init').getInstance();

        const [ruleStats, announcementStats, categoryStats, contentTrends] = await Promise.all([
            // Rule statistics
            db.get(`
                SELECT 
                    COUNT(*) as total_rules,
                    COUNT(CASE WHEN parent_rule_id IS NULL THEN 1 END) as main_rules,
                    COUNT(CASE WHEN parent_rule_id IS NOT NULL THEN 1 END) as sub_rules,
                    COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as rules_with_titles,
                    COUNT(CASE WHEN images IS NOT NULL AND images != '[]' AND images != '' THEN 1 END) as rules_with_images,
                    COUNT(CASE WHEN created_at >= datetime('now', '-${days} days') THEN 1 END) as recent_rules
                FROM rules 
                WHERE is_active = 1
            `),

            // Announcement statistics  
            db.get(`
                SELECT 
                    COUNT(*) as total_announcements,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_announcements,
                    COUNT(CASE WHEN priority >= 4 THEN 1 END) as high_priority_announcements,
                    COUNT(CASE WHEN is_scheduled = 1 THEN 1 END) as scheduled_announcements,
                    COUNT(CASE WHEN created_at >= datetime('now', '-${days} days') THEN 1 END) as recent_announcements,
                    AVG(priority) as avg_priority
                FROM announcements
            `),

            // Category statistics
            db.all(`
                SELECT 
                    c.id,
                    c.letter_code,
                    c.name,
                    COUNT(r.id) as rule_count,
                    COUNT(CASE WHEN r.parent_rule_id IS NULL THEN 1 END) as main_rules_count,
                    COUNT(CASE WHEN r.parent_rule_id IS NOT NULL THEN 1 END) as sub_rules_count
                FROM categories c
                LEFT JOIN rules r ON c.id = r.category_id AND r.is_active = 1
                GROUP BY c.id, c.letter_code, c.name
                ORDER BY c.order_index
            `),

            // Content creation trends
            db.all(`
                SELECT 
                    DATE(created_at) as creation_date,
                    'rule' as content_type,
                    COUNT(*) as count
                FROM rules 
                WHERE created_at >= datetime('now', '-${days} days')
                GROUP BY DATE(created_at)
                
                UNION ALL
                
                SELECT 
                    DATE(created_at) as creation_date,
                    'announcement' as content_type,
                    COUNT(*) as count
                FROM announcements 
                WHERE created_at >= datetime('now', '-${days} days')
                GROUP BY DATE(created_at)
                
                ORDER BY creation_date DESC
            `)
        ]);

        res.json({
            period: `${days} days`,
            ruleStats,
            announcementStats,
            categoryStats,
            contentTrends,
            insights: {
                totalContent: ruleStats.total_rules + announcementStats.total_announcements,
                recentContentCreated: ruleStats.recent_rules + announcementStats.recent_announcements,
                avgRulesPerCategory: categoryStats.length > 0 
                    ? categoryStats.reduce((sum, cat) => sum + cat.rule_count, 0) / categoryStats.length 
                    : 0,
                mostActiveCategory: categoryStats.reduce((max, cat) => 
                    cat.rule_count > (max?.rule_count || 0) ? cat : max, null)
            }
        });
    } catch (error) {
        console.error('Error fetching content analytics:', error);
        res.status(500).json({ error: 'Failed to fetch content analytics' });
    }
});

// System performance analytics
router.get('/system-performance', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const db = require('../database/init').getInstance();

        const [errorStats, responseTimeStats, authStats] = await Promise.all([
            // Error statistics
            db.all(`
                SELECT 
                    sal.action_type,
                    sal.resource_type,
                    sal.error_message,
                    COUNT(*) as error_count,
                    MAX(sal.created_at) as last_error
                FROM staff_activity_logs sal
                WHERE sal.success = 0 
                AND sal.created_at >= datetime('now', '-${days} days')
                GROUP BY sal.action_type, sal.resource_type, sal.error_message
                ORDER BY error_count DESC
                LIMIT 20
            `),

            // Response time statistics
            db.get(`
                SELECT 
                    AVG(duration_ms) as avg_response_time,
                    MIN(duration_ms) as min_response_time,
                    MAX(duration_ms) as max_response_time,
                    COUNT(CASE WHEN duration_ms > 5000 THEN 1 END) as slow_requests,
                    COUNT(*) as total_requests
                FROM staff_activity_logs 
                WHERE duration_ms IS NOT NULL 
                AND created_at >= datetime('now', '-${days} days')
            `),

            // Authentication statistics
            db.all(`
                SELECT 
                    DATE(sal.created_at) as auth_date,
                    COUNT(CASE WHEN sal.action_type = 'login' THEN 1 END) as logins,
                    COUNT(CASE WHEN sal.action_type = 'logout' THEN 1 END) as logouts,
                    COUNT(CASE WHEN sal.action_type = 'login' AND sal.success = 0 THEN 1 END) as failed_logins
                FROM staff_activity_logs sal
                WHERE sal.resource_type = 'system'
                AND sal.created_at >= datetime('now', '-${days} days')
                GROUP BY DATE(sal.created_at)
                ORDER BY auth_date DESC
            `)
        ]);

        res.json({
            period: `${days} days`,
            errorStats,
            responseTimeStats,
            authStats,
            insights: {
                totalErrors: errorStats.reduce((sum, error) => sum + error.error_count, 0),
                errorRate: responseTimeStats.total_requests > 0 
                    ? (errorStats.reduce((sum, error) => sum + error.error_count, 0) / responseTimeStats.total_requests * 100).toFixed(2) + '%'
                    : '0%',
                avgResponseTime: responseTimeStats.avg_response_time ? 
                    Math.round(responseTimeStats.avg_response_time) + 'ms' : 'N/A',
                slowRequestRate: responseTimeStats.total_requests > 0 
                    ? (responseTimeStats.slow_requests / responseTimeStats.total_requests * 100).toFixed(2) + '%'
                    : '0%'
            }
        });
    } catch (error) {
        console.error('Error fetching system performance analytics:', error);
        res.status(500).json({ error: 'Failed to fetch system performance analytics' });
    }
});

module.exports = router; 