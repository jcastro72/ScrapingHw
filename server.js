var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var request = require("request");
var cheerio = require("cheerio");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");


var port = process.env.PORT || 3000

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static(path.join(__dirname + '/public')));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoscraper"), { useNewUrlParser: true };
var db = mongoose.connection;
// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
    Article.find({"saved": false}, function(error, data) {
      var hbsObject = {
        article: data
      };
      console.log(hbsObject);
      res.render("home", hbsObject);
    });
  });
  
  app.get("/saved", function(req, res) {
    Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
      var hbsObject = {
        article: articles
      };
      res.render("saved", hbsObject);
    });
  });
  
  // A GET request to scrape the echojs website
  app.get("/scrape", function(req, res) {
    // this will be our link 
    request("https://www.nytimes.com/", function(error, response, html) {
      // grabs link to then scrape information from the page
      var $ = cheerio.load(html);
      // grabs article from our html
      $("article").each(function(i, element) {
  
        // we save our results in an object
        var result = {};
  
        // Add the title and summary of every link, and save them as properties of the result object
        result.title = $(this).children("h2").text();
        result.summary = $(this).children(".summary").text();
        result.link = $(this).children("h2").children("a").attr("href");
  
        // Using our Article model, create a new entry
        // This effectively passes the result object to the entry (and the title and link)
        var entry = new Article(result);
  
        // Now, save that entry to the db
        entry.save(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          }
          // Or log the doc
          else {
            console.log(doc);
          }
        });
  
      });
          res.send("Scrape Complete");
  
    });
    // Tell the browser that we finished scraping the text
  });
  
  // This will get the articles we scraped from the mongoDB
  app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      // Or send the doc to the browser as a json object
      else {
        res.json(doc);
      }
    });
  });
  
  // Grab an article by it's ObjectId
  app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    // now, execute our query
    .exec(function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      // Otherwise, send the doc to the browser as a json object
      else {
        res.json(doc);
      }
    });
  });
  
  
  // Save an article
  app.post("/articles/save/:id", function(req, res) {
        // Use the article id to find and update its saved boolean
        Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
        // Execute the above query
        .exec(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          }
          else {
            // Or send the document to the browser
            res.send(doc);
          }
        });
  });
  
  // Delete an article
  app.post("/articles/delete/:id", function(req, res) {
        // Use the article id to find and update its saved boolean
        Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
        // Execute the above query
        .exec(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          }
          else {
            // Or send the document to the browser
            res.send(doc);
          }
        });
  });
  
  
  // Create a new note
  app.post("/notes/save/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note({
      body: req.body.text,
      article: req.params.id
    });
    console.log(req.body)
    // And save the new note the db
    newNote.save(function(error, note) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      // Otherwise
      else {
        // Use the article id to find and update it's notes
        Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
        // Execute the above query
        .exec(function(err) {
          // Log any errors
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            // Or send the note to the browser
            res.send(note);
          }
        });
      }
    });
  });
  
  // Delete a note
  app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
    // Use the note id to find and delete it
    Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
      // Log any errors
      if (err) {
        console.log(err);
        res.send(err);
      }
      else {
        Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
         // Execute the above query
          .exec(function(err) {
            // Log any errors
            if (err) {
              console.log(err);
              res.send(err);
            }
            else {
              // Or send the note to the browser
              res.send("Note Deleted");
            }
          });
      }
    });
  });
  
  // Listen on port
  app.listen(port, function() {
    console.log("App running on port " + port);
  });
  