# Bulk Menu Item CSV Import Feature

## Overview

A new **Bulk Import** feature has been added to the Restaurant Menu Items management page. This feature allows restaurant staff to add multiple menu items at once by uploading a CSV (Comma-Separated Values) file, instead of entering each item individually through the form.

## 🎯 What's New

### User Interface Changes
- **Mode Tabs**: The menu item form now has two tabs:
  - **Single Item**: Traditional form for adding one menu item at a time
  - **Bulk Upload (CSV)**: New tab for importing multiple items from a CSV file

### Features in Bulk Upload Mode

1. **CSV File Upload**
   - Click or drag-and-drop a CSV file
   - Download a template CSV to understand the format
   - Supported format: `.csv` files only

2. **Data Validation**
   - Automatic validation of all CSV data before upload
   - Clear error messages showing which rows have issues
   - Prevents invalid data from being uploaded to the database

3. **Preview Table**
   - See all parsed items in a table format
   - Review data for accuracy before confirming
   - Can cancel and upload a different file

4. **Bulk Upload**
   - Upload all validated items with one click
   - Progress indication while uploading
   - Auto-refresh of menu items list after upload

## 📋 CSV File Format

### Required Columns
Your CSV file **must include** these columns (names are case-insensitive):
- `item_name` - Name of the menu item
- `category` - Category (use existing category names)
- `itemType` - Must be `veg` or `non-veg`
- `selling_price` - Numeric price value
- `mrp` - Maximum Retail Price (numeric value)

### Optional Columns
- `description` - Item description (optional)
- `gstRate` - GST percentage or category name (optional)
- `isGSTincluded` - `true` or `false`, defaults to `true` (optional)

### Example CSV
```
item_name,category,itemType,description,selling_price,mrp,gstRate,isGSTincluded
Masala Dosa,Breakfast,veg,Crispy dosa with spicy potato filling,180,200,5%,true
Butter Chicken,Main Course,non-veg,Tender chicken in creamy sauce,320,380,,true
Paneer Tikka,Starters,veg,Grilled paneer with Indian spices,240,280,,true
```

## 🚀 How to Use

### Step 1: Navigate to Menu Items
- Go to the **Menu Items** page from the main navigation

### Step 2: Switch to Bulk Upload Mode
- Click the **"Bulk Upload (CSV)"** tab in the form section

### Step 3: Get the Template (Optional but Recommended)
- Click **"📥 Download CSV Template"** to download a starter template
- This ensures correct column names and format

### Step 4: Prepare Your CSV File
- Create or edit your CSV file with menu items
- Ensure all required columns are present
- Save the file in CSV format

### Step 5: Upload the File
- Click the upload area or drag your CSV file
- The system will parse and validate all items
- Any errors will be displayed with details

### Step 6: Review and Confirm
- A table will show all parsed items
- Check the data for accuracy
- Click **"Confirm Upload"** to add items to the system
- If there are errors, fix them and re-upload

## ✅ Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| item_name | Text | Yes | Cannot be empty |
| category | Text | Yes | Must match existing category name (case-insensitive) |
| itemType | Text | Yes | Must be 'veg' or 'non-veg' (case-insensitive) |
| selling_price | Number | Yes | Must be a valid number, no special characters |
| mrp | Number | Yes | Must be a valid number, no special characters |
| description | Text | No | Any text allowed |
| gstRate | Text/Number | No | Can be category name or percentage |
| isGSTincluded | Boolean | No | 'true' or 'false', defaults to 'true' |

## 🔧 Technical Implementation

### Files Modified/Created

1. **src/app/services/api.service.ts**
   - Added `addMenuItemsBulk()` method for bulk upload API calls

2. **src/app/components/menu-item/menu-item.ts**
   - Added CSV parsing logic
   - Category mapping functionality
   - Validation error handling
   - New signals for bulk upload state management
   - Comprehensive CSS for new UI elements

3. **src/app/components/menu-item/menu-item.html**
   - New mode tabs (Single Item / Bulk Upload)
   - File upload area with drag-and-drop
   - Preview table for parsed items
   - Error display panel
   - Upload action buttons

### Backend Integration

The feature expects the backend to implement:

**Endpoint**: `POST /api/menu-items/bulk`

**Request Body**:
```json
{
  "items": [
    {
      "item_name": "Masala Dosa",
      "category": "507f1f77bcf86cd799439011",
      "itemType": "veg",
      "description": "Crispy dosa with spicy potato",
      "selling_price": 180,
      "mrp": 200,
      "gstRate": "507f1f77bcf86cd799439012",
      "isGSTincluded": true
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "20 menu items added successfully",
  "data": { /* array of created items */ }
}
```

## 📚 Documentation

Detailed documentation is available in:
- **CSV_IMPORT_GUIDE.md** - Complete user guide with examples and troubleshooting
- **sample-menu-items.csv** - Example CSV file with 20 sample restaurant items

## ⚠️ Common Issues & Solutions

### Issue: "Missing required columns"
**Solution**: Ensure your CSV has these exact column names (lowercase):
- item_name
- category
- itemType
- selling_price
- mrp

### Issue: "Category not found: Breakfast"
**Solution**: Go to Categories page and verify the exact category name. Use the same spelling and case.

### Issue: "Invalid number for selling_price"
**Solution**: Remove any currency symbols, commas, or text. Example: Use `180`, not `Rs 180`

### Issue: Empty CSV file error
**Solution**: Ensure your CSV has at least one header row and one data row

## 🎓 Best Practices

1. **Always Download Template First**
   - Start with the provided template to ensure correct column names

2. **Validate Before Uploading**
   - Check your CSV in Excel or a text editor for data accuracy
   - Ensure all prices are numbers without special characters

3. **Use Category Names**
   - Reference categories by name (e.g., "Breakfast") rather than trying to use IDs
   - System will automatically map names to IDs

4. **Set GST Information**
   - Include GST rate for accurate billing
   - System uses defaults if not specified

5. **Keep Backups**
   - Save your CSV files for future reference
   - Makes it easy to add similar items later

## 🆘 Support

For issues or questions:
1. Check **CSV_IMPORT_GUIDE.md** for detailed troubleshooting
2. Review error messages shown in the upload interface
3. Use the **Download CSV Template** to verify format
4. Check that all categories exist before uploading

## 📝 Notes

- The bulk upload is **cumulative** - it adds new items without removing existing ones
- Categories used in CSV must already exist in the system
- All items use the selected GST settings or defaults
- Uploaded items immediately appear in the Menu Directory table
