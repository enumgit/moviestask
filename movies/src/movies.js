const express = require("express");
const bodyParser = require("body-parser");
const { User, isAuthorized } = require("./user");
const mongoConnect = require("./mongo-connect");

const { JWT_SECRET, OMDB_APIKEY, WEB_PORT, MONGO_DB_ADDR, MONGO_DB_PORT } = process.env;
if (!JWT_SECRET || !OMDB_APIKEY || !WEB_PORT || !MONGO_DB_ADDR || !MONGO_DB_PORT) 
	throw new Error("Missing some env vars. Set it and restart the server");

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
	const authHeader = req.headers.authorization;
	if(authHeader) {
		isAuthorized(authHeader, JWT_SECRET, (e, data) => {
			if(e) return res.status(403).json({ error: "forbidden" });;
		
			req.udata = data;
			next();
		});
	} else
		res.status(401).json({ error: "unauthorized" });
});

app.post("/movies", (req, res, next) => {
	if (!req.body)
		return res.status(400).json({ error: "invalid payload" });

	const { title } = req.body;
	let user = new User(req.udata);
	user.addMovie(title, OMDB_APIKEY, (e, data) => {
		if(!e) {
			return res.status(200).json(data);
		}  else
			next(e);
	});
});

app.get("/movies", (req, res, next) => {
	let user = new User(req.udata);
	user.getMovies((e, data) => {
		if(!e) {
			return res.status(200).json(data);
		}  else
			next(e);
	});
});

app.use((error, _, res, __) => {
	console.error(`Error processing request ${error}. See next message for details`);
	console.error(error);
	
	return res.status(500).json({ error: "internal server error" });
});

mongoConnect(MONGO_DB_ADDR, MONGO_DB_PORT, (e, clientdb, collection) => {
	if(!e) {
		global.dbClient = clientdb;
		global.moviesCollection = collection;
		
		app.listen(WEB_PORT, () => {
			console.log(`Movies service started at port ${WEB_PORT}`);
		});
	} else {
		console.error(e);
	}
});