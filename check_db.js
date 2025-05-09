const { MongoClient } = require('mongodb');

async function checkDatabases() {
  // Try both potential URIs
  const uris = [
    'mongodb://localhost:27017/omni',
    'mongodb://localhost:27017/omni-app'
  ];
  
  for (const uri of uris) {
    console.log(`Checking connection to: ${uri}`);
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log('✅ Connected successfully');
      
      // List all databases
      const adminDb = client.db('admin');
      const dbs = await adminDb.admin().listDatabases();
      
      console.log('\nAvailable databases:');
      dbs.databases.forEach(db => {
        console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
      });
      
      // Check collections in the current database
      const db = client.db();
      const collections = await db.listCollections().toArray();
      
      console.log(`\nCollections in '${db.databaseName}' database:`);
      if (collections.length === 0) {
        console.log('No collections found');
      } else {
        collections.forEach(collection => {
          console.log(`- ${collection.name}`);
        });
        
        // Check if users collection exists and get count
        if (collections.some(c => c.name === 'users')) {
          const count = await db.collection('users').countDocuments();
          console.log(`\nUsers collection contains ${count} documents`);
          
          // Display a sample user if any exist
          if (count > 0) {
            const sampleUser = await db.collection('users').findOne();
            console.log('\nSample user document:');
            console.log(JSON.stringify(sampleUser, null, 2));
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error connecting to ${uri}:`, error.message);
    } finally {
      await client.close();
      console.log(`Closed connection to ${uri}\n`);
    }
  }
}

checkDatabases(); 