# 🖼️ Image Upload & Hover Preview Testing Guide

## ✅ **Features Implemented**

### **1. Image Upload in Staff Dashboard**
- **Location**: Staff Dashboard → Add/Edit Rules or Announcements
- **How to use**: Click the image button (📷) in the Quill editor toolbar
- **Supported formats**: JPG, PNG, GIF, WebP, etc.
- **File size limit**: 10MB
- **Auto-processing**: Images are automatically converted to WebP and optimized

### **2. Hover Preview on Frontend**
- **Location**: Frontend rule pages (`http://34.132.234.56:3000/rules/[category]`)
- **How it works**: Hover over any image to see a larger preview
- **Features**: 
  - Smooth fade-in animation
  - Follows mouse cursor
  - Shows image caption
  - Click to open full-size in new tab

### **3. Image Optimization**
- **Full images**: Resized to max 1920x1080, 85% quality WebP
- **Thumbnails**: Generated at 400x300, 70% quality WebP
- **Storage**: `/backend/uploads/images/`
- **Database tracking**: All uploads logged with metadata

## 🧪 **Testing Steps**

### **Step 1: Test Image Upload**
1. Go to: `http://34.132.234.56:3001/staff/staff-management-2024/dashboard`
2. Login with Steam
3. Click "Add New Rule" or "Add New Announcement"
4. In the rich text editor, click the image button (📷)
5. Select an image file from your computer
6. Watch for "Uploading image..." indicator
7. Verify image appears in editor with proper styling

### **Step 2: Test Hover Preview**
1. Save the rule/announcement with the image
2. Go to frontend: `http://34.132.234.56:3000`
3. Navigate to the category with your test rule
4. Hover over the image in the rule content
5. Verify preview appears with smooth animation
6. Move mouse around to test preview positioning
7. Click image to open full-size in new tab

### **Step 3: Test Different Image Types**
- Upload a large image (test auto-resize)
- Upload a small image (test no enlargement)
- Upload different formats (JPG, PNG, GIF)
- Test with images that have special characters in filename

## 🎯 **Expected Results**

### **Upload Process**
- ✅ File picker opens when clicking image button
- ✅ "Uploading image..." text appears during upload
- ✅ Image appears in editor after successful upload
- ✅ Image has proper styling (rounded corners, shadow)
- ✅ Image is clickable and hoverable in editor

### **Frontend Display**
- ✅ Images display properly in rule content
- ✅ Hover shows preview with smooth animation
- ✅ Preview follows mouse cursor intelligently
- ✅ Preview stays on screen (doesn't go off edges)
- ✅ Click opens full-size image in new tab
- ✅ Images are responsive and properly sized

### **Technical Verification**
- ✅ Images saved as WebP format in `/backend/uploads/images/`
- ✅ Thumbnails generated with `thumb_` prefix
- ✅ Database entries created in `uploaded_images` table
- ✅ Proper HTML attributes added (`data-hover-preview`, `data-thumbnail`)

## 🚨 **Troubleshooting**

### **Upload Issues**
- Check file size (must be under 10MB)
- Verify file is an image format
- Check browser console for errors
- Ensure uploads directory exists and is writable

### **Preview Issues**
- Check browser console for JavaScript errors
- Verify images have `data-hover-preview="true"` attribute
- Test with different browsers
- Check network tab for image loading issues

### **Performance Issues**
- Large images should be automatically resized
- Thumbnails should load faster than full images
- WebP format should provide good compression

## 📝 **Example Use Cases**

### **Prison RP Rule Examples**
1. **Contraband Examples**: Upload images showing prohibited items
2. **Proper Procedures**: Show step-by-step visual guides
3. **Location References**: Images of specific prison areas
4. **Uniform Standards**: Visual examples of proper attire
5. **Equipment Usage**: How to properly use prison equipment

### **Staff Training**
- Visual guides for common violations
- Before/after examples of rule compliance
- Screenshots of proper documentation
- Reference images for consistent enforcement

## 🔧 **API Endpoints**

- `POST /api/images/upload` - Upload new image
- `GET /api/images/list` - Get uploaded images list
- `DELETE /api/images/:id` - Delete image (moderator+)
- `GET /uploads/images/:filename` - Serve image files

## 📊 **Database Schema**

```sql
CREATE TABLE uploaded_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    thumbnail_filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES staff_users(id)
);
```

---

**Ready to test!** 🚀 Both servers should be running:
- Backend: `http://34.132.234.56:3001`
- Frontend: `http://34.132.234.56:3000`

> **Note:** For local development, replace `34.132.234.56` with `localhost` in all URLs.
- Backend: `http://34.132.234.56:3001`
- Frontend: `http://34.132.234.56:3000` 