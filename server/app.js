const express = require('express');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const app = express();
var path = require('path');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const GitHubStrategy = require('passport-github2').Strategy;
const dotenv = require('dotenv').config({path: `${__dirname}/secrets.env`});

// Destructure process.env to get nice to read variable names
const {
	MONGO_USER,
	MONGO_PASS,
	MONGO_HOST,
	MONGO_DBNAME,
	MONGO_DBCOLLECTION,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	EXPRESS_SESSION_SECRET
} = process.env;

app.use('/login', express.static(path.join(__dirname, 'public', 'login')));
app.use('/todo', express.static(path.join(__dirname, 'public', 'todo_list')));
app.use(express.json());

const url = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}`;
const dbconnect = new MongoClient(url);
let collection = null;

async function run() {
	await dbconnect.connect().then(() => console.log("Connected!"));
	collection = await dbconnect.db(MONGO_DBNAME).collection(MONGO_DBCOLLECTION);

	// Passport setup
	app.use(session({
		secret: EXPRESS_SESSION_SECRET,
		resave: false,
		saveUninitialized: false
	}));

	app.use(passport.initialize());
	app.use(passport.session())

	passport.use(new GitHubStrategy({
			clientID: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET
		},
		async function (accessToken, refreshToken, profile, done) {
			// This code will run when the user is successfully logged in with GitHub.
			process.nextTick(function () {
				return done(null, profile);
			});
		}
	));

	passport.serializeUser(function (user, done) {
    done(null, { username: user.username, id: user._id || user.id });
	});

	passport.deserializeUser(function (obj, done) {
    done(null, obj);
	});

	app.get('/', function(req, res){
		res.redirect('/login');
	});

	// Login Page
	app.use('/login', (req, res, next) => {
		// User is logged in
    if (req.user) {
			window.sessionStorage.setItem("id", req.user.username);
			res.redirect("/todo");
    } else {
      next();
    }
	})

	app.get('/auth/github/callback',
    passport.authenticate('github', { session: true, failureRedirect: '/login' }),
    function (req, res) {
			// Successful authentication, redirect home.
			res.redirect('/todo');
    }
	);

	app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

	function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect("/login");
    }
	}
	
	// To Do List Page
	app.use('/todo', ensureAuth, async (req, res, next) => {
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