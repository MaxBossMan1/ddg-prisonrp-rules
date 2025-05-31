# DigitalDeltaGaming PrisonRP - Backend API Documentation

## 📋 Overview

This document provides comprehensive documentation for the DDG PrisonRP backend API system. The API is built with Node.js/Express and uses SQLite for data storage.

**Base URL**: `http://34.132.234.56:3001`  
**Environment**: Production (see below for development setup)  
**Authentication**: Steam OpenID with session-based auth  
**Database**: SQLite with activity logging  
**Version**: 1.2.1 - Complete Visual Design and Footer Integration  

### 🆕 **Recent Updates (v1.2.1)**
- ✅ **Enhanced Category Validation** - Proper 404 handling for invalid categories
- ✅ **Footer Integration API Support** - Dynamic category fetching for footer
- ✅ **Database Compatibility Fixes** - Resolved column reference issues
- ✅ **Enhanced Error Handling** - Improved validation and response consistency

---

## 🔐 Authentication System

### Steam Authentication Flow

The API uses Steam OpenID for staff authentication with role-based permissions.

#### Permission Levels
- **Editor** (Level 1): **Request-based content editing** - All content requires approval
  - Can create drafts and submit for approval
  - Cannot publish content directly
  - Can view approved content + their own drafts/pending submissions
- **Moderator** (Level 2): **Content management + approval authority** 
  - Can approve/reject editor submissions with review notes
  - Can create approved content directly (bypasses workflow)
  - Can view all content including pending approvals
- **Admin** (Level 3): **Full system access, can manage moderators & editors**
  - All moderator permissions + user management
  - Cannot manage other admins/owners
- **Owner** (Level 4): **Ultimate system control, can manage admins**
  - All admin permissions + can manage admins
  - Ultimate system authority

#### Auth Endpoints

**`GET /auth/steam`**
- **Purpose**: Initiate Steam authentication
- **Access**: Public
- **Response**: Redirects to Steam OpenID
- **Notes**: Checks for valid Steam API key configuration

**`GET /auth/steam/return`**
- **Purpose**: Steam authentication callback
- **Access**: Steam OpenID callback
- **Response**: Redirects to staff dashboard on success
- **Logs**: User login activity

**`POST /auth/logout`**
- **Purpose**: End user session
- **Access**: Authenticated users only
- **Response**: `{ "message": "Logged out successfully" }`
- **Logs**: User logout activity

**`GET /auth/check`**
- **Purpose**: Check authentication status
- **Access**: Any (returns auth state)
- **Response**: `{ "authenticated": boolean, "user": object }`

### Authentication Middleware

**`requireAuth`**: Ensures user is authenticated  
**`requirePermission(level)`**: Ensures user has minimum permission level  
**`canManageUser(managerLevel, targetLevel)`**: Checks if manager can manage target user  
**`getValidPermissionLevels(userLevel)`**: Returns permission levels user can assign

### Approval Workflow Functions
**`canApproveContent(userLevel)`**: Checks if user can approve/reject content (Moderator+)  
**`filterContentByPermission(content, userLevel, userId)`**: Filters content based on approval workflow rules  
**`getApprovalStatus(content)`**: Returns detailed approval status information

---

## 🏥 Health & System Endpoints

**`GET /health`**
- **Purpose**: API health check
- **Access**: Public
- **Response**: 
```json
{
  "status": "OK",
  "timestamp": "2024-01-27T...",
  "environment": "development",
  "rateLimiting": {
    "enabled": false,
    "limits": {
      "public": "50 requests per minute",
      "search": "30 requests per minute",
      "auth": "5 requests per 2 minutes",
      "staff": "150 requests per minute",
      "upload": "15 requests per minute",
      "health": "50 requests per minute",
      "discord": "5 requests per minute",
      "global": "75 requests per minute"
    }
  }
}
```

---

## 📊 Core Data Endpoints

**`GET /api/categories`**
- **Purpose**: Get all rule categories with rule counts for public display and footer integration
- **Access**: Public
- **Response**: Array of category objects with rule counts
- **Query**: Includes active rules count per category
- **Enhanced Features** ✅ NEW:
  - Used by dynamic footer for category links
  - Filters categories with rules for footer display
  - Proper error handling and validation
- **Response Format**:
```json
[
  {
    "id": 1,
    "name": "General Server Rules",
    "description": "Basic rules that apply to all players",
    "letter_code": "A",
    "order_index": 1,
    "rule_count": 3,
    "created_at": "2025-01-30T...",
    "updated_at": "2025-01-30T..."
  }
]
```
- **Use Cases**: 
  - Homepage category grid display
  - Footer dynamic category links
  - Staff dashboard category management

**`GET /api/announcements`**
- **Purpose**: Get active announcements for homepage display
- **Access**: Public  
- **Response**: Array of announcements ordered by priority/date
- **Filter**: Only active announcements
- **Enhanced Features** ✅ NEW:
  - Improved error handling and validation
  - Consistent response formatting
  - Better performance optimization

---

## 🔄 **Approval Workflow System**

### Overview
The system implements a request-based approval workflow where Editors must have their content approved by Moderators+ before it goes live.

### Workflow States
- **`draft`** - Content saved locally, not submitted for review
- **`pending_approval`** - Content submitted and waiting for moderator review
- **`approved`** - Content approved and live/active
- **`rejected`** - Content rejected with reviewer feedback

### Permission-Based Content Visibility
- **Editors**: See approved content + their own drafts/pending submissions
- **Moderators+**: See all content regardless of approval status

### Approval Process
1. **Editor creates content** → Status: `draft` or `pending_approval`
2. **Moderator+ reviews** → Can approve (goes live) or reject (with notes)
3. **Approved content** → Becomes active and visible to public
4. **Rejected content** → Returns to editor with feedback

### Approval Endpoints

**`PUT /api/staff/rules/:id/approve`**
- **Purpose**: Approve pending rule submission
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Optional feedback" }`
- **Actions**: Sets status to 'approved', activates rule, logs activity
- **Response**: `{ "message": "Rule approved successfully" }`

**`PUT /api/staff/rules/:id/reject`**
- **Purpose**: Reject pending rule submission
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Required feedback explaining rejection" }`
- **Actions**: Sets status to 'rejected', adds review notes, logs activity
- **Response**: `{ "message": "Rule rejected successfully" }`

**`PUT /api/staff/announcements/:id/approve`**
- **Purpose**: Approve pending announcement submission
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Optional feedback" }`
- **Actions**: Sets status to 'approved', activates announcement, logs activity
- **Response**: `{ "message": "Announcement approved successfully" }`

**`PUT /api/staff/announcements/:id/reject`**
- **Purpose**: Reject pending announcement submission
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Required feedback explaining rejection" }`
- **Actions**: Sets status to 'rejected', adds review notes, logs activity
- **Response**: `{ "message": "Announcement rejected successfully" }`

**`GET /api/staff/pending-approvals`**
- **Purpose**: Get all content pending approval for review dashboard
- **Access**: Moderator+ only
- **Response**: 
```json
{
  "rules": [...],
  "announcements": [...],
  "totalPending": 5
}
```

---

## 📋 Rules API (`/api/rules`)

### Enhanced Category Validation ✅ NEW FEATURE

**`GET /api/rules`**
- **Purpose**: Get all active rules with hierarchical structure and enhanced validation
- **Access**: Public
- **Query Parameters**: 
  - `category` (optional): Filter by category letter (e.g., "A", "B")
- **Enhanced Validation** ✅ NEW:
  - **Category Existence Check**: Validates category exists before processing
  - **Proper 404 Responses**: Returns HTTP 404 for invalid categories instead of empty arrays
  - **Database Compatibility**: Fixed column reference issues (removed non-existent is_active from categories)
  - **Error Handling**: Comprehensive error messages and status codes
- **Response**: 
  - **Valid Category**: Array of parent rules with nested sub_rules arrays
  - **Invalid Category**: `{ "error": "Category not found" }` with HTTP 404 status
- **Features**: 
  - Automatic image parsing from JSON
  - Hierarchical organization (parent → sub-rules)
  - Includes rule codes and category information
  - Enhanced validation prevents empty result confusion

**Database Query Enhancement**:
```sql
-- Before (caused SQL errors)
SELECT id FROM categories WHERE letter_code = ? AND is_active = 1

-- After (fixed compatibility)
SELECT id FROM categories WHERE letter_code = ?
```

### Frontend Integration Benefits ✅ NEW
- **Footer Dynamic Links**: Enables proper category link generation
- **404 Error Handling**: Invalid category URLs now show proper error pages
- **Enhanced UX**: Users get clear feedback for invalid routes
- **API Consistency**: Standardized error responses across all endpoints

### Rule Data Structure
```json
{
  "id": 1,
  "title": "Rule Title",
  "content": "Rule content in markdown",
  "rule_number": 1,
  "sub_number": null,
  "category_id": 1,
  "parent_rule_id": null,
  "full_code": "A.1",
  "category_name": "General Server Rules",
  "category_letter": "A",
  "images": [],
  "sub_rules": []
}
```

### Rule Code Generation
- **Main Rules**: `A.1`, `A.2`, etc.
- **Sub-Rules**: `A.1.1`, `A.1.2`, etc.  
- **Revisions**: `A.1.1a`, `A.1.1b` (database ready)
- **Auto-numbering**: Prevents conflicts, handles gaps

---

## 🔧 Frontend Integration Enhancements

### Footer Integration Support ✅ NEW FEATURE

The API now provides comprehensive support for the dynamic footer system:

**Dynamic Category Links**:
- Footer fetches categories via `apiService.getCategories()`
- Only displays categories with `rule_count > 0`
- Generates proper links using `category.letter_code.toLowerCase()`
- Link format: `/rules/a`, `/rules/b`, etc.

**Error Handling Integration**:
- Invalid category requests return proper HTTP 404
- Frontend shows "Invalid Rule Category" error instead of empty results
- Consistent error messaging across public and staff interfaces

**API Service Integration**:
```javascript
// Footer component now uses proper API service
const response = await apiService.getCategories();
setCategories(response.data.filter(cat => cat.rule_count > 0));
```

### Enhanced Error Responses ✅ NEW

**Standardized Error Format**:
```json
{
  "error": "Category not found",
  "statusCode": 404,
  "timestamp": "2025-01-30T...",
  "path": "/api/rules?category=INVALID"
}
```

**Common Error Scenarios**:
- **Invalid Category**: HTTP 404 with "Category not found"
- **Database Errors**: HTTP 500 with "Internal server error" 
- **Missing Parameters**: HTTP 400 with specific validation messages
- **Permission Denied**: HTTP 403 with "Insufficient permissions"

---

## 🔄 Recent Technical Improvements

### Database Compatibility Fixes ✅ NEW
- **Column Reference Issues**: Fixed queries referencing non-existent columns
- **Query Optimization**: Improved performance for category validation
- **Error Handling**: Enhanced SQL error handling and recovery
- **Consistency**: Standardized database access patterns

### API Response Enhancements ✅ NEW
- **Consistent Headers**: Standardized CORS and security headers
- **Response Timing**: Improved response time tracking
- **Error Logging**: Enhanced error logging with context
- **Validation Messages**: More descriptive error messages

### Security Improvements ✅ NEW
- **Input Validation**: Enhanced validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries throughout
- **Permission Checks**: Consistent permission validation
- **Activity Logging**: Comprehensive action tracking

---

## 🔍 Search API (`/api/search`)

**`GET /api/search`**
- **Purpose**: Search rules with autocomplete
- **Access**: Public
- **Query Parameters**:
  - `q` (required): Search query (min 2 characters)
  - `limit` (optional): Result limit (default: 10)
- **Response**: Array of search results with relevance scoring
- **Search Fields**: Rule codes, titles, content
- **Relevance Order**: 
  1. Rule code matches
  2. Title matches  
  3. Content matches

**`GET /api/search/suggestions`**
- **Purpose**: Get search suggestions for autocomplete
- **Access**: Public
- **Response**: Popular rule codes and titles
- **Use Case**: Empty search state suggestions

**`POST /api/search/history`**
- **Purpose**: Log search queries for analytics
- **Access**: Public
- **Body**: `{ "query": "search terms", "results_count": 5 }`
- **Response**: `{ "message": "Search logged successfully" }`
- **Database**: Stored in search_history table

---

## 🖼️ Image Management API (`/api/images`)

### Image Upload & Processing

**`POST /api/images/upload`**
- **Purpose**: Upload and process images for rules/announcements
- **Access**: Authenticated staff (Editor+)
- **Content-Type**: `multipart/form-data`
- **Body**: `image` field with image file
- **File Limits**: 10MB max, images only
- **Processing**:
  - Converts to WebP format
  - Resizes large images (max 1920x1080)
  - Generates thumbnails (400x300)
  - Quality optimization (85% full, 70% thumb)
- **Response**:
```json
{
  "success": true,
  "imageId": 123,
  "filename": "1640995200000_abc123.webp",
  "thumbnailFilename": "thumb_1640995200000_abc123.webp", 
  "url": "/uploads/images/1640995200000_abc123.webp",
  "thumbnailUrl": "/uploads/images/thumb_1640995200000_abc123.webp",
  "originalName": "original-filename.jpg"
}
```
- **Database**: Records in `uploaded_images` table
- **Activity Log**: Upload activity tracked

**`GET /api/images/list`**  
- **Purpose**: Get recent uploaded images for picker
- **Access**: Authenticated staff (Editor+)
- **Response**: Array of image objects with uploader info
- **Limit**: 50 most recent images
- **Use Case**: Image picker in content editors

**`DELETE /api/images/:id`**
- **Purpose**: Delete uploaded image and files
- **Access**: Authenticated staff (Moderator+)
- **Parameters**: `id` - Image database ID
- **Actions**:
  - Removes files from filesystem
  - Deletes database record
  - Handles missing files gracefully
- **Response**: `{ "success": true, "message": "Image deleted successfully" }`

### Static File Serving

**`/uploads/images/*`**
- **Purpose**: Serve uploaded images
- **Access**: Public with CORS headers
- **Features**: Optimized for cross-origin requests
- **Cache**: Browser caching enabled 

---

## 🛡️ Staff Management API (`/api/staff`)

### Dashboard & Overview

**`GET /api/staff/dashboard`**
- **Purpose**: Get dashboard statistics and recent activity
- **Access**: Authenticated staff (Any level)
- **Response**: Dashboard data with stats, recent changes, activity summary
- **Features**: 
  - Rule/category/announcement counts
  - Recent changes with user attribution
  - Activity insights for last 7 days
  - Current user information

### Rules Management

**`GET /api/staff/rules`** 
- **Purpose**: Get all rules for staff management with approval workflow filtering
- **Access**: Authenticated staff (Editor+)
- **Response**: Rules filtered by permission level and approval status
- **Features**: 
  - Editors see: approved rules + their own drafts/pending
  - Moderators+ see: all rules regardless of status
  - Includes approval workflow metadata (status, submitted_by, reviewed_by, etc.)
- **Use Case**: Staff dashboard rules management tab

**`POST /api/staff/rules`**
- **Purpose**: Create new rule with approval workflow
- **Access**: Authenticated staff (Editor+)
- **Body**: Rule data with category, title, content, images, parent_rule_id, `isDraft` flag
- **Approval Logic**:
  - Editors: Creates `draft` (if isDraft=true) or `pending_approval` (if isDraft=false)
  - Moderators+: Creates `approved` rules directly (bypasses workflow)
- **Features**:
  - Automatic rule numbering and code generation
  - Image handling and activity logging
  - Permission-based status assignment
- **Response**: Created rule object with status information

**`PUT /api/staff/rules/:id`**
- **Purpose**: Update existing rule (approval workflow aware)
- **Access**: Authenticated staff (Editor+ for own content, Moderator+ for all)
- **Parameters**: `id` - Rule database ID
- **Body**: Updated rule data
- **Features**: 
  - Change tracking with approval workflow integration
  - Rule code updates and activity logging
- **Response**: Updated rule object

**`PUT /api/staff/rules/:id/approve`**
- **Purpose**: Approve pending rule submission
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Optional feedback" }`
- **Response**: Success confirmation with approval logging

**`PUT /api/staff/rules/:id/reject`**
- **Purpose**: Reject pending rule submission with required feedback
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Required rejection reason" }`
- **Response**: Success confirmation with rejection logging

**`DELETE /api/staff/rules/:id`**
- **Purpose**: Soft delete rule (marks inactive)
- **Access**: Authenticated staff (Moderator+)
- **Parameters**: `id` - Rule database ID
- **Safety**: Checks for sub-rules, prevents orphaning
- **Response**: Success confirmation

### Announcements Management

**`GET /api/staff/announcements`**
- **Purpose**: Get all announcements for management with approval workflow filtering
- **Access**: Authenticated staff (Editor+)
- **Response**: Announcements filtered by permission level and approval status
- **Features**:
  - Editors see: approved announcements + their own drafts/pending
  - Moderators+ see: all announcements regardless of status
  - Includes approval workflow metadata and scheduling information
- **Ordering**: Priority and creation date

**`POST /api/staff/announcements`**
- **Purpose**: Create new announcement with approval workflow
- **Access**: Authenticated staff (Editor+)
- **Body**: Announcement data with title, content, priority, scheduling, `isDraft` flag
- **Approval Logic**:
  - Editors: Creates `draft` (if isDraft=true) or `pending_approval` (if isDraft=false)
  - Moderators+: Creates `approved` announcements directly (bypasses workflow)
  - Editors cannot create scheduled announcements (Moderator+ only)
- **Features**:
  - Priority levels (1-5), active/inactive status
  - Scheduling for future publication, auto-expire functionality
  - Permission-based status assignment
- **Response**: Created announcement object with status information

**`PUT /api/staff/announcements/:id`**
- **Purpose**: Update existing announcement (approval workflow aware)
- **Access**: Authenticated staff (Editor+ for own content, Moderator+ for all)
- **Parameters**: `id` - Announcement database ID
- **Body**: Updated announcement data
- **Features**: Change tracking with approval workflow integration
- **Response**: Updated announcement object

**`PUT /api/staff/announcements/:id/approve`**
- **Purpose**: Approve pending announcement submission
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Optional feedback" }`
- **Response**: Success confirmation with approval logging

**`PUT /api/staff/announcements/:id/reject`**
- **Purpose**: Reject pending announcement submission with required feedback
- **Access**: Moderator+ only
- **Body**: `{ "reviewNotes": "Required rejection reason" }`
- **Response**: Success confirmation with rejection logging

**`DELETE /api/staff/announcements/:id`**
- **Purpose**: Delete announcement permanently
- **Access**: Authenticated staff (Moderator+)
- **Parameters**: `id` - Announcement database ID
- **Response**: Success confirmation

### User Management (Admin+ Only)

**`GET /api/staff/users`**
- **Purpose**: Get all staff users with activity stats
- **Access**: Admin+ only (Admin and Owner)
- **Response**: Array of staff users with action counts, filtered by permission hierarchy
- **Features**: Total actions, recent activity (7 days), permission-based filtering

**`POST /api/staff/users`**
- **Purpose**: Add new staff user
- **Access**: Admin+ only (Admin and Owner)
- **Body**: `{ "steamId", "username", "permissionLevel" }`
- **Validation**: Permission level check based on hierarchy, duplicate prevention
- **Hierarchy**: Admins can create Editor/Moderator, Owners can create any level
- **Response**: Created user object
- **Activity Log**: User creation tracked

**`PUT /api/staff/users/:id`**
- **Purpose**: Update staff user permissions/status
- **Access**: Admin+ only (Admin and Owner)
- **Parameters**: `id` - Staff user database ID
- **Body**: `{ "permissionLevel", "isActive" }`
- **Hierarchy**: Admins cannot edit other Admins/Owners, Owners can edit anyone
- **Response**: Updated user object
- **Activity Log**: Permission changes tracked

**`DELETE /api/staff/users/:id`**
- **Purpose**: Deactivate staff user (soft delete)
- **Access**: Admin+ only (Admin and Owner)
- **Parameters**: `id` - Staff user database ID
- **Hierarchy**: Admins cannot deactivate other Admins/Owners, Owners can deactivate anyone
- **Safety**: Prevents self-deactivation
- **Response**: Success confirmation
- **Activity Log**: Deactivation tracked

### Activity Logging

**`GET /api/staff/activity-logs`**
- **Purpose**: Get filtered activity logs for auditing
- **Access**: Moderator+
- **Query Parameters**: `staffUserId`, `actionType`, `resourceType`, `startDate`, `endDate`, `limit`, `offset`
- **Response**: Paginated activity logs with user details
- **Use Case**: Staff oversight and auditing

**`GET /api/staff/activity-summary`**
- **Purpose**: Get activity statistics and summaries
- **Access**: Moderator+
- **Query Parameters**: `staffUserId`, `days` (default: 30)
- **Response**: Aggregated activity metrics
- **Use Case**: Dashboard insights and reporting

---

## 🚀 Implemented API Endpoints (Recently Added)

### ✅ Complete Rule Cross-Referencing System (v1.2.0) ⭐ **NEW**
- `GET /api/rules/:id/cross-references` - Get all cross-references for a specific rule
- `POST /api/rules/:id/cross-references` - Create new cross-reference between rules  
- `DELETE /api/rules/:id/cross-references/:crossRefId` - Remove cross-reference between rules
- **Relationship Types** - Support for related, clarifies, supersedes, superseded_by, conflicts_with
- **Bidirectional Linking** - Cross-references can appear on both linked rules
- **Staff Dashboard Integration** - Modal interface for managing cross-references with search
- **Public Display Integration** - Cross-references shown on rule pages with navigation
- **Real-time Search** - Find rules to link with autocomplete functionality
- **Permission-based Access** - Editors can create, Moderators+ can delete
- **Activity Logging** - All cross-reference actions tracked for audit

### ✅ Complete Discord Integration System (v1.1.0) ⭐ **NEW**
- `GET /api/discord/settings` - Get Discord integration settings (Admin only)
- `PUT /api/discord/settings` - Update webhook URLs and Discord configuration
- `POST /api/discord/webhook/test` - Test Discord webhook configuration
- `GET /api/discord/messages` - Get Discord message history and tracking
- **Automatic Rule Notifications** - Auto-triggered Discord embeds for rule changes
  - Rule creation notifications with green embeds
  - Rule update notifications with orange embeds  
  - Rule deletion notifications with red embeds
  - Rule approval notifications with blue embeds
- **Smart Rule Links** - Automatic URL generation and parsing
  - Discord links use proper format: C.7 → /rules/C/7
  - Sub-rule support: C.7.1 → /rules/C/7/1
  - Frontend scroll and highlight animation from Discord links
- **Copy Link Functionality** - Manual rule sharing with generated URLs

### ✅ Approval Workflow System (v1.0.0) ⭐ **ENHANCED**
- `PUT /api/staff/rules/:id/approve` - Approve pending rule submission with review notes
- `PUT /api/staff/rules/:id/reject` - Reject pending rule submission with required feedback
- `PUT /api/staff/announcements/:id/approve` - Approve pending announcement submission
- `PUT /api/staff/announcements/:id/reject` - Reject pending announcement submission
- `GET /api/staff/pending-approvals` - Get all content pending approval for review dashboard

**Approval Workflow Features:**
- **Request-based editing for Editors** - All content requires moderator approval
- **Draft and submission states** - Save drafts or submit for review
- **Moderator approval authority** - Approve/reject with detailed review notes
- **Permission-based content filtering** - Users see content based on their role
- **Complete audit trail** - All approval actions logged with timestamps
- **Status tracking** - Draft, pending_approval, approved, rejected states

### ✅ Categories Management (Complete)
- `GET /api/staff/categories` - Get all categories with rule counts (Admin only)
- `GET /api/staff/categories/list` - Get simple categories list for editors
- `POST /api/staff/categories` - Create new category with validation
- `PUT /api/staff/categories/:id` - Update category (name, description, letter code)
- `DELETE /api/staff/categories/:id` - Delete category (with safety checks for existing rules)
- `POST /api/staff/categories/reorder` - Reorder categories (affects automatic letter codes!)

### ✅ Enhanced Analytics (Complete)
- `GET /api/analytics/rule-views` - Rule popularity and view analytics
- `GET /api/analytics/search-trends` - Search term analytics and popular queries
- `GET /api/analytics/staff-activity` - Enhanced staff metrics with detailed breakdowns
- `GET /api/analytics/content-stats` - Rules and announcements statistics
- `GET /api/analytics/system-performance` - System performance and error analytics

**Analytics Features:**
- Rule popularity based on search mentions and staff activity
- Search trend analysis with no-result query identification  
- Staff productivity metrics with action breakdowns
- Content creation trends and category statistics
- System performance monitoring with error tracking
- Response time analysis and authentication statistics

---

## 🔮 Future API Endpoints (Planned)

### Bulk Operations (Future Enhancement)
- `POST /api/staff/rules/import` - Bulk import rules from JSON/CSV
- `GET /api/staff/rules/export` - Export all rules with formatting
- `POST /api/staff/announcements/bulk` - Bulk announcement operations

### Advanced Discord Features (Future)
- `POST /api/discord/rules/:id/send` - Send rule change notifications to Discord
- `GET /api/discord/channels` - Get available Discord channels from bot
- `POST /api/discord/schedule` - Schedule Discord messages for later sending

---

## 🔧 Development Patterns & Standards

### Error Handling
- **Standard Format**: `{ "error": "Error message" }`
- **Status Codes**: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- **Logging**: All errors logged with context

### Activity Logging
- **Automatic**: All staff actions logged via middleware
- **Manual**: Critical actions have explicit logging calls
- **Data**: User ID, action type, resource, details, timestamp, IP, user agent

### Request/Response Patterns
- **Body Parsing**: JSON with 50MB limit for rich content
- **CORS**: Configured for frontend origin with credentials
- **Sessions**: 24-hour expiry, secure in production
- **Validation**: Input validation on all staff endpoints

### Database Patterns
- **Soft Deletes**: Rules marked inactive instead of deleted
- **Hierarchical Data**: Parent-child relationships for rules
- **Auto-numbering**: Conflict-free rule numbering system
- **Image Storage**: JSON arrays for multiple images per rule

---

## 📝 Notes for Future Development

1. **Discord Integration**: ✅ COMPLETE - Automatic rule notifications with smart links implemented
2. **Rule Navigation**: ✅ COMPLETE - URL-based highlighting and scroll animation implemented
3. **Copy Link Feature**: ✅ COMPLETE - Manual rule sharing with proper URL generation
4. **Database Schema**: Discord integration tables and indexes implemented
5. **API Versioning**: Consider versioning for future breaking changes
6. **Rate Limiting**: Add rate limiting for public endpoints
7. **Caching**: Response caching for frequently accessed analytics data
8. **Documentation**: OpenAPI/Swagger specification for interactive docs
9. **Bulk Operations**: Import/export functionality for rules and announcements
10. **Frontend Dashboards**: Analytics and Approval Dashboard interfaces (backends complete)

### New Dependencies Required
```bash
npm install axios  # For Discord webhook requests (✅ INSTALLED)
```

### Database Migration
Run the updated schema.sql to add Discord integration tables: ✅ COMPLETE
- discord_settings (webhook configuration)
- discord_messages (message tracking)

---

**Last Updated**: 2025-01-30  
**API Version**: 1.2.1 - Complete Visual Design and Footer Integration  
**Database Schema**: Enhanced with improved validation and error handling ✅ NEW  
**Recent Updates**: Footer integration support, category validation fixes, enhanced error handling ✅ NEW

## 🔗 Discord Integration API (`/api/discord`)

### Overview
Complete Discord integration system providing automatic rule notifications with rich embeds and smart link functionality. All Discord features are automatically triggered by rule management actions.

#### Discord Integration Features
- **Automatic Rule Notifications**: Create, update, delete, and approval actions trigger Discord notifications
- **Rich Embeds**: Action-specific colors, rule codes, categories, and change descriptions
- **Smart Rule Links**: Discord notifications include clickable links to specific rules
- **URL Parsing**: Backend converts rule codes (C.7) to proper URLs (/rules/C/7)
- **Frontend Navigation**: Discord links trigger scroll and highlight animations

### Discord Settings Management

**`GET /api/discord/settings`**
- **Purpose**: Get Discord integration configuration
- **Access**: Admin+ only
- **Response**: 
```json
{
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "enableRuleNotifications": true,
  "enableAnnouncementNotifications": true,
  "mentionRoleId": "123456789",
  "channelName": "#server-updates"
}
```

**`PUT /api/discord/settings`**
- **Purpose**: Update Discord webhook configuration
- **Access**: Admin+ only
- **Body**: Discord settings object with webhook URL and notification preferences
- **Validation**: Tests webhook URL before saving
- **Response**: Updated settings with validation status

### Automatic Rule Notifications ✅ NEW FEATURE

**Automatic Triggers**: The following staff actions automatically send Discord notifications:

#### Rule Creation Notification
- **Trigger**: `POST /api/staff/rules` (when approved)
- **Embed Color**: Green (#27ae60)
- **Content**: Rule code, category, title, and creation details
- **Link Format**: `https://your-domain.com/rules/C/7` (for rule C.7)

#### Rule Update Notification  
- **Trigger**: `PUT /api/staff/rules/:id` (when approved)
- **Embed Color**: Orange (#f39c12)
- **Content**: Rule code, category, what changed, and update details
- **Link Format**: Proper URL for direct rule navigation

#### Rule Deletion Notification
- **Trigger**: `DELETE /api/staff/rules/:id`
- **Embed Color**: Red (#e74c3c)
- **Content**: Deleted rule information and staff attribution
- **Link Format**: Category page link (since rule no longer exists)

#### Rule Approval Notification
- **Trigger**: `PUT /api/staff/rules/:id/approve`
- **Embed Color**: Blue (#3498db)
- **Content**: Newly approved rule with reviewer information
- **Link Format**: Direct link to the approved rule

### Smart URL Generation ✅ NEW FEATURE

**Rule Code Parsing Logic**:
```javascript
// C.7 → /rules/C/7
// C.7.1 → /rules/C/7/1  
// A.3.2 → /rules/A/3/2
```

**Implementation in Discord Embeds**:
- Rule codes are automatically parsed into proper URL format
- URLs trigger frontend scroll and highlight animations
- Sub-rules are properly handled with parent/child navigation
- Invalid codes fallback to category pages

### Discord Message Tracking

**`GET /api/discord/messages`**
- **Purpose**: Get Discord message history and tracking
- **Access**: Admin+ only
- **Query Parameters**: `limit`, `messageType`, `startDate`, `endDate`
- **Response**: Array of sent messages with metadata
- **Use Case**: Audit trail and message management

**`POST /api/discord/webhook/test`**
- **Purpose**: Test Discord webhook configuration
- **Access**: Admin+ only
- **Body**: `{ "webhookUrl": "discord-webhook-url" }`
- **Response**: Test result with success/error status
- **Validation**: Sends test message to verify webhook functionality

---

## 🔗 Rule Cross-References API (`/api/rules/:id/cross-references`)

### Overview
Complete rule cross-referencing system allowing staff to link related rules with different relationship types. Cross-references can be bidirectional and include contextual information.

#### Relationship Types
- **`related`** - General relationship between rules
- **`clarifies`** - Source rule provides clarification for target rule
- **`supersedes`** - Source rule replaces/overrides target rule
- **`superseded_by`** - Source rule is replaced by target rule
- **`conflicts_with`** - Rules have conflicting information

### Cross-References Endpoints

**`GET /api/rules/:id/cross-references`**
- **Purpose**: Get all cross-references for a specific rule
- **Access**: Public
- **Parameters**: `id` - Rule database ID
- **Response**: Grouped cross-references by relationship type
```json
{
  "clarifies": [
    {
      "id": 1,
      "related_rule": {
        "id": 2,
        "title": "Target Rule Title",
        "full_code": "B.4",
        "category_name": "Category Name"
      },
      "reference_context": "Additional context",
      "is_bidirectional": true,
      "created_at": "2025-01-29T...",
      "direction": "outgoing"
    }
  ]
}
```
- **Features**: Returns both incoming and outgoing references with full rule details

**`POST /api/rules/:id/cross-references`**
- **Purpose**: Create new cross-reference between rules
- **Access**: Authenticated staff (Editor+)
- **Parameters**: `id` - Source rule database ID
- **Body**:
```json
{
  "target_rule_id": 2,
  "reference_type": "clarifies",
  "reference_context": "Optional context description",
  "is_bidirectional": true
}
```
- **Validation**: 
  - Prevents self-referencing (same rule)
  - Checks both rules exist and are active
  - Prevents duplicate cross-references
- **Response**: Created cross-reference with full target rule details
- **Activity Log**: Cross-reference creation tracked

**`DELETE /api/rules/:id/cross-references/:crossRefId`**
- **Purpose**: Remove cross-reference between rules
- **Access**: Authenticated staff (Moderator+)
- **Parameters**: 
  - `id` - Rule database ID
  - `crossRefId` - Cross-reference database ID
- **Validation**: Ensures cross-reference belongs to specified rule
- **Response**: `{ "message": "Cross-reference deleted successfully" }`
- **Activity Log**: Cross-reference removal tracked

### Cross-References Data Structure
```json
{
  "id": 1,
  "source_rule_id": 1,
  "target_rule_id": 2,
  "reference_type": "clarifies",
  "reference_context": "B.4 provides additional clarification for B.3",
  "is_bidirectional": true,
  "created_by": 1,
  "created_at": "2025-01-29T12:00:00Z"
}
```

### Frontend Integration
- **Staff Dashboard**: Modal interface for managing cross-references
- **Public Display**: Cross-references shown on rule pages with visual indicators
- **Search Integration**: Find rules to link with real-time search
- **Navigation**: Click cross-references to navigate between related rules

### Database Schema
```sql
CREATE TABLE rule_cross_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_rule_id INTEGER NOT NULL,
  target_rule_id INTEGER NOT NULL,
  reference_type TEXT NOT NULL DEFAULT 'related',
  reference_context TEXT,
  is_bidirectional BOOLEAN DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_rule_id) REFERENCES rules(id),
  FOREIGN KEY (target_rule_id) REFERENCES rules(id),
  FOREIGN KEY (created_by) REFERENCES staff_users(id)
);
```

---

## 🛡️ API Rate Limiting

### Overview
Comprehensive rate limiting system implemented to prevent abuse and ensure fair usage across all API endpoints. Different limits are applied based on endpoint type and resource intensity.

#### Rate Limiting Strategy
- **Development Environment**: Rate limiting is disabled for localhost (127.0.0.1) to facilitate development

---

> **NOTE:** In all API examples, replace `localhost` with `34.132.234.56` for production/cloud deployments.
- **Production Environment**: Full rate limiting enforced for all clients
- **Headers**: Standard rate limit headers included in responses (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`)
- **Error Handling**: 429 status code with detailed error messages and retry information

### Rate Limits by Endpoint Type

#### Public API Endpoints
- **Limit**: 50 requests per minute
- **Applies to**: `/api/rules`, `/api/categories`, `/api/announcements`
- **Purpose**: Protect public data from excessive scraping

#### Search Endpoints
- **Limit**: 30 requests per minute  
- **Applies to**: `/api/search/*`
- **Purpose**: Prevent search spam while allowing reasonable autocomplete usage

#### Authentication Endpoints
- **Limit**: 5 requests per 2 minutes
- **Applies to**: `/auth/*`
- **Purpose**: Prevent brute force authentication attacks

#### Staff Management Endpoints
- **Limit**: 150 requests per minute
- **Applies to**: `/api/staff/*`, `/api/analytics/*`
- **Purpose**: Allow intensive staff work while preventing abuse

#### Image Upload Endpoints
- **Limit**: 15 requests per minute
- **Applies to**: `/api/images/*`
- **Purpose**: Prevent upload spam and resource exhaustion

#### Discord Integration
- **Limit**: 5 requests per minute
- **Applies to**: `/api/discord/*`
- **Purpose**: Prevent Discord webhook testing spam

#### Health Check
- **Limit**: 50 requests per minute
- **Applies to**: `/health`
- **Purpose**: Allow monitoring while preventing ping spam

#### Global Fallback
- **Limit**: 75 requests per minute
- **Applies to**: All unspecified endpoints
- **Purpose**: Catch-all protection for any missed endpoints

### Rate Limit Responses

#### Standard Error Response (429 Too Many Requests)
```json
{
  "error": "Too many search requests from this IP. Please try again later.",
  "retryAfter": 60,
  "limit": 30,
  "window": "1 minute"
}
```

#### Rate Limit Headers
```
RateLimit-Limit: 30
RateLimit-Remaining: 20
RateLimit-Reset: 1643723460
```

### Rate Limiting Monitoring

**`GET /api/rate-limit-status`**
- **Purpose**: Get current rate limiting configuration and status
- **Access**: Admin+ only (Level 3+)
- **Response**: 
```json
{
  "message": "Rate limiting is active",
  "environment": "production",
  "skipLocalhost": false,
  "limits": {
    "publicApi": { "requests": 50, "window": "1 minute" },
    "search": { "requests": 30, "window": "1 minute" },
    "authentication": { "requests": 5, "window": "2 minutes" },
    "staff": { "requests": 150, "window": "1 minute" },
    "upload": { "requests": 15, "window": "1 minute" },
    "health": { "requests": 50, "window": "1 minute" },
    "discord": { "requests": 5, "window": "1 minute" },
    "global": { "requests": 75, "window": "1 minute" }
  }
}
```

### Health Check Enhancement

**`GET /health`**
- **Enhanced Response**: Now includes rate limiting status
```json
{
  "status": "OK",
  "timestamp": "2025-01-30T12:00:00.000Z",
  "environment": "development",
  "rateLimiting": {
    "enabled": false,
    "limits": {
      "public": "50 requests per minute",
      "search": "30 requests per minute",
      "auth": "5 requests per 2 minutes",
      "staff": "150 requests per minute",
      "upload": "15 requests per minute",
      "health": "50 requests per minute",
      "discord": "5 requests per minute",
      "global": "75 requests per minute"
    }
  }
}
```

### Implementation Details

#### Middleware Architecture
- **Modular Design**: Separate rate limiters for different endpoint types
- **IP-based Tracking**: Limits tracked per client IP address
- **Memory Storage**: Uses in-memory storage (suitable for single-instance deployment)
- **Graceful Handling**: Detailed error messages with retry timing

#### Security Features
- **Brute Force Protection**: Strict limits on authentication endpoints
- **Resource Protection**: Upload limits prevent storage exhaustion
- **Spam Prevention**: Search limits prevent autocomplete abuse
- **Monitoring Integration**: Admin access to rate limiting status

#### Configuration
```javascript
// Example rate limiter configuration
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many public API requests. Please try again later.",
    retryAfter: 900,
    limit: 100,
    window: "15 minutes"
  }
});
```

--- 