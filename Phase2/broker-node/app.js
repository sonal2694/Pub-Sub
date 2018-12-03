var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pubSubRouter = require('./routes/pubSub');


var app = express();

const BROKER_PORT = 1337;

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/publish', pubSubRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


const server = app.listen(BROKER_PORT, function () {
  console.log("broker listening on 1337...");
});

const io = require('socket.io')(server);
io.set('origins', '*:*');

var idCounter = 1000;
var db = new Array();

const subscribeToTopics = function(userId, topics, socket) {

  var flag = false;
  for (var i = 0; i < db.length ; i++) {

    if (db[i].userId === userId) {

      db[i].topics = topics;
      flag = true;
    }
  }
  if (!flag) {
    db.push({
      userId: userId,
      topics: topics,
      socket: socket
    });
  }

  console.log(db);
};

const getSubscribers = function(topic) {

  var subscribers = new Array();

  for (var i = 0; i < db.length ; i++) {

    if (db[i].topics.includes(topic)) {
      subscribers.push(db[i]);
    }
  }

  return subscribers;
};

// notify
const publish = function(topic, text) {

  var subscribers = getSubscribers(topic);

  // notifies subscribers
  subscribers.forEach(function(subscriber){
    subscriber.socket.emit("new-notification", {topic: topic, text: text});
  });

};

io.on('connection', function (client) {

  console.log("connection established");

  client.on('register', function(data) {
    console.log(data);
  });

  client.on('error', function (err) {
    console.log('received error from client:', client.id);
    console.log(err);
  });

  client.on("hand-shake", function(data) {
    console.log("client shook hands");

    client.emit("hand-shake-reply", {
      clientId: idCounter++
    });
  });

  client.on("publish-text", function(data) {

    publish(data.topic, data.text);
    console.log(data);
    client.emit("publish-text-reply", {});
  });

  client.on("subscribe-to-topic", function(data) {
    console.log(data);
    subscribeToTopics(data.clientId, data.topics, client); // might need 'this'
  });

});

module.exports = app;
