# Bulk Menu Item Import Guide

## Overview
The bulk CSV import feature allows you to add multiple menu items at once using a CSV file, eliminating the need to enter items one by one through the form.

## How to Use

### Step 1: Access the Bulk Upload Section
1. Navigate to **Menu Items** page
2. Click the **"Bulk Upload (CSV)"** tab in the form section
3. Click **"📥 Download CSV Template"** to get a starter template

### Step 2: Prepare Your CSV File
Your CSV file must have the following columns (in any order):

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| `item_name` | Yes | Text | Name of the menu item |
| `category` | Yes | Text | Category name or ID (must match existing categories) |
| `itemType` | Yes | Text | Either `veg` or `non-veg` |
| `description` | No | Text | Optional description of the item |
| `selling_price` | Yes | Number | Price at which item is sold |
| `mrp` | Yes | Number | Maximum Retail Price |
| `gstRate` | No | Text | GST category name or percentage (e.g., "5%" or "Standard") |
| `isGSTincluded` | No | Boolean | `true` if GST is included in price, `false` if not. Defaults to `true` |

### Step 3: Example CSV Format

```csv
item_name,category,itemType,description,selling_price,mrp,gstRate,isGSTincluded
Masala Dosa,Breakfast,veg,Crispy dosa with spicy potato filling,180,200,5%,true
Butter Chicken,Main Course,non-veg,Tender chicken in creamy tomato sauce,320,380,,true
Paneer Tikka,Starters,veg,Grilled paneer with Indian spices,240,280,,true
Biryani,Main Course,non-veg,Fragrant rice with meat,280,350,5%,true
Samosa,Starters,veg,Crispy pastry with potato filling,40,50,,true
```

### Step 4: Upload the File
1. Click the file upload area or drag & drop your CSV file
2. The system will parse and validate all items
3. If there are validation errors, they will be shown with details about which rows have issues
4. Fix any errors and re-upload if needed

### Step 5: Review and Confirm
1. A preview table will show all parsed items
2. Review the data for accuracy
3. Click **"Confirm Upload"** to add all items to the system
4. A success message will confirm the import

## Validation Rules

- **item_name**: Required, must be non-empty
- **category**: Required, must match an existing category name (case-insensitive)
- **itemType**: Must be `veg` or `non-veg` (case-insensitive)
- **selling_price**: Required, must be a valid number
- **mrp**: Required, must be a valid number
- **gstRate**: Optional, can be either:
  - A GST category name from your system (e.g., "Standard", "Premium")
  - A percentage value (e.g., "5%", "18%")
  - Leave empty to use default
- **isGSTincluded**: Optional, expects `true` or `false` (defaults to `true`)

## Error Handling

If validation errors are found:
- The upload will show all errors for review
- Each error indicates the row number and the specific issue
- Fix the issues in your CSV file and try uploading again
- Valid items from previous attempts won't be duplicated (the bulk upload will replace them)

## Tips & Best Practices

1. **Start with the template** - Use the downloadable template to ensure correct column names
2. **Use category names** - It's easier than looking up category IDs. Just ensure the names match exactly
3. **Set GST information** - If you have specific GST rates for items, include them. Otherwise, the system will use defaults
4. **Validate externally** - Open your CSV in Excel and verify the data before uploading
5. **Keep backups** - Save your CSV files for future reference

## Troubleshooting

### "CSV file is empty or has only headers"
- Ensure your file has at least one data row in addition to the header row

### "Missing required columns"
- Verify your CSV has columns: item_name, category, itemType, selling_price, mrp
- Column names must be lowercase

### "Category not found: XYZ"
- The category name doesn't match any existing categories in your system
- Go to **Categories** page to verify the exact category name

### "Invalid number for selling_price/mrp"
- Ensure price fields contain only numbers (no special characters or letters)
- Example: `180` is valid, `Rs 180` is not

### Upload fails silently
- Check browser console for detailed error messages
- Ensure the CSV file is properly formatted (not corrupted)
- Try downloading and using the template again

## Support

For issues with bulk import:
1. Check the validation error messages for details
2. Review this guide's Validation Rules section
3. Download a fresh CSV template and try again
