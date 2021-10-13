const jwt = require("jsonwebtoken");
const request = require("request");

const isAuthorized = (authorization, secret, callback) => { // checking if user authorized
	const token = authorization.split(' ')[1];
	jwt.verify(token, secret, callback);
};

class User {
	constructor(udata) {
		this.userId = udata.userId;
		this.name = udata.name;
		this.role = udata.role;
	}
	
	addMovie(title, apikey, callback) { // fetching data from omdb api and add movie to database if exist
		this.canCreateMovie((e, allow) => {
			if(!e && allow) {
				request({
					url: "https://www.omdbapi.com/",
					qs: {
						t: title,
						apikey: apikey
					}
				}, (e, r, b) => {
					if(!e) {
						try {
							const data = JSON.parse(b);
							
							if(!data.Error) {
								this.saveMovie({
									userid: this.userId,
									title: data.Title,
									released: data.Released,
									genre: data.Genre,
									director: data.Director,
									created: Math.floor(new Date().getTime()/1000)
								}, (e, success) => {
									if(!e) {
										callback(null, {
											success: true
										});
									} else
										callback(e);
								});
							} else {
								callback(null, {
									success: false,
									error: data.Error
								});
							}
						} catch(e) {
							callback(e);
						}
					} else
						callback(e);
				});
			} else {
				if(!e)
					callback(null, {
						success: false,
						error: "On a basic plan, you cannot create more than 5 movies per month, upgrade your plan to Premium"
					});
				else
					callback(e)
			}
		});
	}
	
	getMovies(callback) { //getting list of movies for user
		global.moviesCollection.find({
			userid: this.userId
		}).toArray((e, rs) => {
			if(!e) {
				let res = [];
				for(let i=0; i<rs.length; i++) {
					res.push({
						title: rs[i].title,
						released: rs[i].released,
						genre: rs[i].genre,
						director: rs[i].director
					});
				}
				callback(null, res);
			} else 
				callback(e);
		});
	}
	
	canCreateMovie(callback) { // checking if user have 5 movies or more (and plans)
		if(this.role === "basic") {
			const date = new Date();
			const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
			const monthEnd = new Date(date.getFullYear(), date.getMonth()+1, 1).getTime();
			
			const f = async () => {
				
				try {
					const c = await global.moviesCollection.find({
						userid: this.userId, 
						created: { 
							$gte: monthStart 
						}, created: {
							$lt: monthEnd 
						}
					}).count();
					
					if(c >= 5) {
						callback(null, false);
					} else
						callback(null, true);
				} catch (e) {
					callback(e);
				}
				
			};
			f();
		} else {
			callback(null, true);
		}
	}
	
	saveMovie(data, callback) { // save movie to database
		global.moviesCollection.insertOne(data, (e, r) => {
			if(!e) callback(null, true);
			else callback(e);
		});
	}
}

module.exports = {
	User,
	isAuthorized
};