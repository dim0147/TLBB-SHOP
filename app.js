const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('morgan');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const passport = require('passport');
const flash = require('connect-flash');
const cors = require('cors');
const csurf = require('csurf'); 
const passportSocketIo = require("passport.socketio");


const config = require('./config/config');
const middlewareHandle = require('./controllers/middleware');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const accountRouter = require('./routes/account');
const imageRouter = require('./routes/image');

const socketApi = require('./io/io');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// set up middleware
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    origin: config.urlWebsite
}))

// connect mongodb
console.log('Connect to mongodb...');
mongoose.connect(config.mongodb.uri, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
.then(() => console.log('Connect success'));
mongoose.set('useCreateIndex', true);

// Setup session
  // Store to store session in db
const store = new MongoDBStore({
  uri: config.mongodb.uri,
  collection: 'mySessions'
});
store.on('error', function(error) {
  console.log(error);
});

app.use(session({
  secret: config.session.secretKey,
  resave: false,
  key: config.session.key,
  saveUninitialized: false,
  cookie: {maxAge: config.session.cookieRememberMe}, // 86400000
  store: store
}));

app.use(csurf());

// Config passport
app.use(flash());
require('./config/passport-config.js');
app.use(passport.initialize());
app.use(passport.session());

// Pass user session to ejs
app.use(middlewareHandle.setUserSession);

// Pass menu data to ejs
app.use(middlewareHandle.loadMenuView);

// Setup socket
socketApi.io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,      
  key:          config.session.key,       // the name of the cookie where express/connect stores its session_id
  secret:       config.session.secretKey,    // the session_secret to parse the cookie
  store:        store        // we NEED to use a sessionstore. no memorystore please
}));

app.io = socketApi.io;



// setup route
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/admin', adminRouter);
app.use('/account', accountRouter);
app.use('/image', imageRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
  if(err.statusCode && err.statusCode === 404){
    // return res.render('404', {title: 'Oops! Not Found'})
    return res.status(400).send('Oops! Not Found');
  }

  console.log('System error');
  console.log(err);
  res.render('error', {title: 'Rất xin lỗi, có lỗi xảy ra'})
});

module.exports = app;
