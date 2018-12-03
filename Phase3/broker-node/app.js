var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var io_client = require('socket.io-client');

var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pubSubRouter = require('./routes/pubSub');


var app = express();

// Port Number of current broker and its peers port number initialized here
const BROKER_PORT = process.env.BROKER_PORT;
const PEERS = process.env.PEERS.split(":");
var idCounter = process.env.ID_START;

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
  console.log("broker listening on " + BROKER_PORT + "...");
});

const io = require('socket.io')(server);
io.set('origins', '*:*');

var db = new Array();

var peerBrokerConnections = [];

// Broker ports
// broker 1 : 1337
// broker 2 : 1338
// broker 3 : 1339

const connectToPeerNeighbors = function() {
  PEERS.forEach(function(peerBrokerPort) {
    peerBrokerConnections.push(io_client("http://localhost:" + peerBrokerPort));
  });
};

connectToPeerNeighbors();

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
  console.log("db details");
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

// notifying each publisher (should be notifyForImmediateUsers)
const publishForImmediateUsers = function(topic, text) {

  var subscribers = getSubscribers(topic);

  // notifies subscribers
  subscribers.forEach(function(subscriber){
    subscriber.socket.emit("new-notification", {topic: topic, text: text});
  });

};

const broadcastPostToPeerBrokers = function(topic, text) {

  console.log(PEERS);

  PEERS.forEach(function(peerBrokerPort) {

    console.log("http://broker" + peerBrokerPort + ":" + peerBrokerPort);
    var peerSocket = io_client("http://broker" + peerBrokerPort + ":" + peerBrokerPort);

    peerSocket.emit("broadcast-message", {
      topic: topic,
      text: text,
      sender: BROKER_PORT
    });
  });
};

const match = function(topic, text) {
  // notifyForImmediateUsers
  publishForImmediateUsers(topic, text);
  broadcastPostToPeerBrokers(topic, text);
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

    match(data.topic, data.text);
    client.emit("publish-text-reply", {});
  });

  client.on("subscribe-to-topic", function(data) {
    subscribeToTopics(data.clientId, data.topics, client); // might need 'this'
  });

  // broker communication

  client.on("broker-hand-shake", function (data) {

  });

  client.on("broadcast-message", function(data) {

    console.log('received!');
    console.log(data);

    if (data.sender != BROKER_PORT) {
      // publish to immediate users
      publishForImmediateUsers(data.topic, data.text);
    }

  });

});

module.exports = app;
