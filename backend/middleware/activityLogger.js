const Database = require('../database/init');

/**
 * Activity Logger Middleware
 * Tracks all staff actions for auditing and management
 */

class ActivityLogger {
    static async log(options) {
        try {
            const db = Database.getInstance();
            const {
                staffUserId,
                actionType,
                resourceType,
                resourceId = null,
                actionDetails = {},
                ipAddress = null,
                userAgent = null,
                sessionId = null,
                success = true,
                errorMessage = null,
                durationMs = null
            } = options;

            // Ensure required fields are present
            if (!staffUserId || !actionType || !resourceType) {
                console.error('ActivityLogger: Missing required fields', options);
                return;
            }

            await db.run(`
                INSERT INTO staff_activity_logs (
                    staff_user_id, action_type, resource_type, resource_id,
                    action_details, ip_address, user_agent, session_id,
                    success, error_message, duration_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                staffUserId,
                actionType,
                resourceType,
                resourceId,
                JSON.stringify(actionDetails),
                ipAddress,
                userAgent,
                sessionId,
                success ? 1 : 0,
                errorMessage,
                durationMs
            ]);

        } catch (error) {
            // Don't throw errors for logging failures to avoid breaking main functionality
            console.error('ActivityLogger error:', error);
        }
    }

    static middleware(actionType, resourceType) {
        return (req, res, next) => {
            const startTime = Date.now();

            // Store original end method
            const originalEnd = res.end;

            // Override end method to log after response
            res.end = function(...args) {
                const endTime = Date.now();
                const duration = endTime - startTime;

                // Determine success based on status code
                const success = res.statusCode < 400;

                // Extract resource ID from various sources
                let resourceId = req.params.id || req.params.ruleId || req.params.categoryId || req.params.announcementId;
                
                // For POST requests, try to get ID from response body
                if (!resourceId && req.method === 'POST' && res.locals.createdId) {
                    resourceId = res.locals.createdId;
                }

                // Log the activity
                if (req.user) {
                    ActivityLogger.log({
                        staffUserId: req.user.id,
                        actionType,
                        resourceType,
                        resourceId: resourceId || null,
                        actionDetails: {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                            body: req.method !== 'GET' ? req.body : undefined,
                            statusCode: res.statusCode
                        },
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent'),
                        sessionId: req.sessionID,
                        success,
                        errorMessage: success ? null : res.locals.errorMessage,
                        durationMs: duration
                    });
                }

                // Call original end method
                originalEnd.apply(this, args);
            };

            next();
        };
    }

    // Specific logging methods for common actions
    static async logLogin(staffUserId, req, success = true, errorMessage = null) {
        return this.log({
            staffUserId,
            actionType: 'login',
            resourceType: 'system',
            actionDetails: {
                loginMethod: 'steam',
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success,
            errorMessage
        });
    }

    static async logLogout(staffUserId, req) {
        return this.log({
            staffUserId,
            actionType: 'logout',
            resourceType: 'system',
            actionDetails: {
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });
    }

    static async logRuleAction(staffUserId, actionType, ruleId, details, req) {
        return this.log({
            staffUserId,
            actionType,
            resourceType: 'rule',
            resourceId: ruleId,
            actionDetails: {
                ...details,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });
    }

    static async logImageUpload(staffUserId, filename, fileSize, req) {
        return this.log({
            staffUserId,
            actionType: 'upload',
            resourceType: 'image',
            actionDetails: {
                filename,
                fileSize,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: true
        });
    }

    // Get activity logs with filtering
    static async getActivityLogs(options = {}) {
        const db = Database.getInstance();
        const {
            staffUserId = null,
            actionType = null,
            resourceType = null,
            startDate = null,
            endDate = null,
            limit = 50,
            offset = 0,
            includeUserDetails = true
        } = options;

        let whereConditions = [];
        let params = [];

        if (staffUserId) {
            whereConditions.push('sal.staff_user_id = ?');
            params.push(staffUserId);
        }

        if (actionType) {
            whereConditions.push('sal.action_type = ?');
            params.push(actionType);
        }

        if (resourceType) {
            whereConditions.push('sal.resource_type = ?');
            params.push(resourceType);
        }

        if (startDate) {
            whereConditions.push('sal.created_at >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereConditions.push('sal.created_at <= ?');
            params.push(endDate);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                sal.*,
                ${includeUserDetails ? 'su.steam_username, su.permission_level,' : ''}
                CASE 
                    WHEN sal.resource_type = 'rule' THEN r.title
                    WHEN sal.resource_type = 'category' THEN c.name
                    WHEN sal.resource_type = 'announcement' THEN a.title
                    ELSE NULL
                END as resource_name
            FROM staff_activity_logs sal
            ${includeUserDetails ? 'LEFT JOIN staff_users su ON sal.staff_user_id = su.id' : ''}
            LEFT JOIN rules r ON sal.resource_type = 'rule' AND sal.resource_id = r.id
            LEFT JOIN categories c ON sal.resource_type = 'category' AND sal.resource_id = c.id
            LEFT JOIN announcements a ON sal.resource_type = 'announcement' AND sal.resource_id = a.id
            ${whereClause}
            ORDER BY sal.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(limit, offset);

        return await db.all(query, params);
    }

    // Get activity summary/stats
    static async getActivitySummary(staffUserId = null, days = 30) {
        const db = Database.getInstance();
        
        let whereConditions = [`created_at >= datetime('now', '-${days} days')`];
        let params = [];
        
        if (staffUserId) {
            whereConditions.unshift('staff_user_id = ?');
            params.push(staffUserId);
        }
        
        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        
        const query = `
            SELECT 
                action_type,
                resource_type,
                COUNT(*) as count,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_count,
                AVG(duration_ms) as avg_duration_ms
            FROM staff_activity_logs
            ${whereClause}
            GROUP BY action_type, resource_type
            ORDER BY count DESC
        `;

        return await db.all(query, params);
    }
}

module.exports = ActivityLogger; 