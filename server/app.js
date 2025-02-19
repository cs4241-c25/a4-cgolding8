const express = require('express');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const app = express();
var path = require('path');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local').Strategy

app.use('/login', express.static(path.join(__dirname, 'public', 'login')));
app.use('/todo', express.static(path.join(__dirname, 'public', 'todo_list')));
app.use(express.json());

const url = "mongodb+srv://colemgolding:3UlNRKYePSaOaKw6@assignment-a3.llq9g.mongodb.net/?retryWrites=true&w=majority&appName=Assignment-A3";
const dbconnect = new MongoClient(url);
let collection = null;
let log_collection = null;

async function run() {
	await dbconnect.connect().then(() => console.log("Connected!"));
	collection = await dbconnect.db("user_data").collection("todo_lists");
	log_collection = await dbconnect.db("user_data").collection("logins");

	// Passport setup
	app.use(session({
    secret: "secret",
    resave: false ,
    saveUninitialized: true ,
	}))

	app.use(passport.initialize());
	app.use(passport.session())

	passport.use(new LocalStrategy({
			username: 'username',
			password: 'password'
		},
		async function verify(username, password, done) {
			let user = await log_collection.findOne({ username: username });

			if (user == null) {
				await log_collection.insertOne({ username: username, password: password });
				let new_user = await log_collection.findOne({ username: username });
				return done(null, new_user);
			}
			else if (user.password != password) {
				return done(null, false);
			}
			else {
				return done(null, user);
			}
		}
	))

	passport.serializeUser((user, done) => {
		done(null, user);
	});

	passport.deserializeUser((user, done) => {
		done (null, user);
	});

	app.get('/', function(req, res){
		res.redirect('/login');
	});

	// Login Page
	app.use('/login', (req, res, next) => {
		next();
	})

	app.post('/login-attempt', function (req, res, next) {
		passport.authenticate("local", function (err, user, info) {
			if (!user) {
				return res.status(302).json({ redirectUrl: "/login" });
			}
			return res.status(302).json({ redirectUrl: "/todo " + user._id });
		})(req, res, next);
	});
	
	// To Do List Page
	app.use('/todo', async (req, res, next) => {
		res.json(await collection.find({}));
		next();
	})

	// Process and send data upon page load
	app.post('/getRows', (req, res) => {
		let user_id = "";

		req.on("data", function( data ) {
			user_id += data;
		})

		req.on("end", async function() {
			const rows = await collection.find({'user_id': user_id}).toArray();

			res.end(JSON.stringify(rows));
		})
	})

	// Process and send data upon form submission
	app.post('/submit', (req, res) => {
		let dataString = "";

		req.on( "data", function( data ) {
			dataString += data;
		})

		req.on( "end", async function() {
			let parsed = JSON.parse(dataString);

			// ... do something with the data here and at least generate the derived data
			let priority = parsed.TDpriority;
			let startDate = new Date(parsed.TDdate);
			let dueDate = new Date(startDate);

			// Add X days to the start date to derive a due date
			switch(priority) {
				case "urgent":
					dueDate.setDate(startDate.getDate() + 1);
					break;
				case "high":
					dueDate.setDate(startDate.getDate() + 3);
					break;
				case "medium":
					dueDate.setDate(startDate.getDate() + 7);
					break;
				case "low":
					dueDate.setDate(startDate.getDate() + 10);
					break;
				default:
			}

			// Add the new item to the object and reorganize it
			parsed["TDdueDate"] = dueDate.toISOString().substring(0, 10);
			parsed["user_id"] = parsed.user_id;
			let org_string = JSON.stringify(parsed, ["TDdescription","TDdate","TDdueDate","TDpriority","user_id"]);
			console.log(org_string); // Check that everything is A-okay

			// Add data to MongoDB server
			const results = await collection.insertOne(JSON.parse(org_string));

			// Add _id to front of sent JSON
			parsed["_id"] = results.insertedId.toString();
			org_string = JSON.stringify(parsed, ["_id","TDdescription","TDdate","TDdueDate","TDpriority"])

			// Send data back to client
			res.writeHead( 200, "OK", {"Content-Type": "text/plain" })
			res.end(org_string)
		})
	})

	// Process and send data upon row modification
	app.post('/modify', (req, res) => {
		let json = "";

		req.on("data", function( data ) {
			json += data;
		})

		req.on("end", async function() {
			json = JSON.parse(json);
			id = new ObjectId(json._id);

			const mod_row = await collection.updateOne({'_id': id}, {$set :{
				TDdescription: json.TDdescription,
  			TDdueDate: json.TDdate,
  			TDpriority: json.TDpriority
			}});

			res.end("modified");
		})
	})

	// Modify row
	app.post('/getData', (req, res) => {
		let id = "";

		req.on("data", function( data ) {
			id += data;
		})

		req.on("end", async function() {
			id = new ObjectId(id);

			const mod_row = await collection.findOne({"_id": id});

			res.end(JSON.stringify(mod_row));
		})
	})

	// Process and send data upon row deletion
	app.post('/delete', (req, res) => {
		let id = "";

		req.on("data", function( data ) {
			id += data;
		})

		req.on("end", async function() {
			id = new ObjectId(id);

			const del_row = await collection.findOne({"_id": id});

			// Delete item by ID
			const results = await collection.deleteOne({"_id": id});

			res.end('Deleted "' + del_row.TDdescription + '"');
		})
	})

	// 404 Not Found
	app.use(function(req, res, next) {
		res.status(404);
		res.type('txt').send('404 - Not found');
	});
}
const appRun = run();

app.listen(process.env.PORT || 3001);