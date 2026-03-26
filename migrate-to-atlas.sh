#!/bin/bash

# MongoDB Migration Script
# Migrate data from Local MongoDB to MongoDB Atlas

echo "🔄 Starting MongoDB Migration from Local to Atlas..."
echo ""

# Configuration
LOCAL_MONGODB_URI="mongodb://127.0.0.1:27017"
LOCAL_DB_NAME="birdiefund"
ATLAS_MONGODB_URI="mongodb+srv://namacoder2287_db_user:AZqx060usnsVuYWW@cluster0.gfo8sb5.mongodb.net/birdiefund?appName=Cluster0"
DUMP_DIR="./mongodb_backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="birdiefund_backup_${TIMESTAMP}"

echo "📋 Migration Details:"
echo "  Source: Local MongoDB ($LOCAL_DB_NAME)"
echo "  Destination: MongoDB Atlas (birdiefund)"
echo "  Backup Directory: $DUMP_DIR/$BACKUP_NAME"
echo ""

# Step 1: Create backup directory
echo "📁 Step 1: Creating backup directory..."
mkdir -p "$DUMP_DIR/$BACKUP_NAME"
echo "✓ Backup directory created"
echo ""

# Step 2: Export data from local MongoDB
echo "📤 Step 2: Exporting data from Local MongoDB..."
echo "  Command: mongodump --uri='$LOCAL_MONGODB_URI' --db='$LOCAL_DB_NAME' --out='$DUMP_DIR/$BACKUP_NAME'"
echo ""

mongodump --uri="$LOCAL_MONGODB_URI" --db="$LOCAL_DB_NAME" --out="$DUMP_DIR/$BACKUP_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Data exported successfully!"
    echo "  Backup location: $DUMP_DIR/$BACKUP_NAME"

    # Show backup contents
    echo ""
    echo "📊 Backup contents:"
    find "$DUMP_DIR/$BACKUP_NAME" -type f -name "*.bson" | while read file; do
        collection=$(basename "$file" .bson)
        echo "  - $collection"
    done
else
    echo "✗ Export failed! Make sure MongoDB is running locally."
    echo "  Try: mongod --dbpath /path/to/data"
    exit 1
fi

echo ""
echo "✅ Step 2 Complete"
echo ""

# Step 3: Import data to MongoDB Atlas
echo "📥 Step 3: Importing data to MongoDB Atlas..."
echo "  Command: mongorestore --uri='$ATLAS_MONGODB_URI' --dir='$DUMP_DIR/$BACKUP_NAME/birdiefund'"
echo ""

mongorestore --uri="$ATLAS_MONGODB_URI" --dir="$DUMP_DIR/$BACKUP_NAME/$LOCAL_DB_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Data imported successfully!"
else
    echo "✗ Import failed! Check your Atlas connection string."
    echo "  Verify credentials and network whitelist."
    exit 1
fi

echo ""
echo "✅ Step 3 Complete"
echo ""

# Step 4: Verify migration
echo "🔍 Step 4: Verifying migration..."
echo ""
echo "Checking collections in Atlas..."
mongo "$ATLAS_MONGODB_URI" --eval "db.getCollectionNames()" 2>/dev/null | grep -E "^\[|users|charities|draws|scores|winnings|verifications|\]"

echo ""
echo "✅ Migration Complete!"
echo ""
echo "📋 Summary:"
echo "  ✓ Local data exported to: $DUMP_DIR/$BACKUP_NAME"
echo "  ✓ Data imported to MongoDB Atlas"
echo "  ✓ Your application is now connected to Atlas"
echo ""
echo "🎯 Next Steps:"
echo "  1. Restart your application: npm run dev"
echo "  2. Test the connection by logging in"
echo "  3. Verify data integrity in MongoDB Atlas console"
echo "  4. Keep the local backup for reference: $DUMP_DIR/$BACKUP_NAME"
echo ""
