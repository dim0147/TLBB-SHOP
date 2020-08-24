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
const axios = require('axios').default

const config = require('./config/config');

const userModel = require('./models/user');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// set up middleware
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// connect mongodb
console.log('Connect to mongodb...');
mongoose.connect(config.mongodb.uri, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
.then(() => console.log('Connect success'));

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
  saveUninitialized: false,
  cookie: {maxAge: config.session.cookieRememberMe}, // 86400000
  store: store
}));

// Config passport
app.use(flash());
require('./config/passport-config.js');
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req, res, next) {
      res.locals.userSS = req.user;
      next()
});


// setup route
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/admin', adminRouter);

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

module.exports = app;
