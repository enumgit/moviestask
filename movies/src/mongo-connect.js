const { MongoClient } = require('mongodb');

const mongoConnect = async (host, port, callback) => {
	
	const client = new MongoClient('mongodb://'+host+':'+port);
	const cname = 'movies', dbname = 'movies';
	
	try {
		await client.connect();
		console.log("Connection with database established");
		const clientdb = await client.db(dbname);
		
		const collections = await clientdb.listCollections({}, { nameOnly: true }).toArray()
		let shouldCreate = true;
		for(let i=0; i<collections.length; i++)
			if(collections[i].name == cname)
				shouldCreate = false;
			
		if(shouldCreate)
			await clientdb.createCollection(cname);
		
		const moviesCollection = clientdb.collection(cname);
		callback(null, clientdb, moviesCollection);
	} catch(e) {
		console.log("Can't create connection with database");
		callback(e);
	}
	
};

module.exports = mongoConnect;