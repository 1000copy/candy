var path = require('path');
var moment = require('moment');
var Theme = require('theme');
var Duoshuo = require('duoshuo');
var sign = require('./sign');
var board = require('./board');
var thread = require('./thread');
var user = require('./user');
var page = require('./page');
var admin = require('./admin');
var media = require('./media');
var cn = require('../libs/zh-cn');
var sys = require('../package.json');
var home = path.resolve(__dirname, '../');

moment.lang('zh-cn', cn);

module.exports = function(app, models, ctrlers, middlewares) {

  var passport = middlewares.passport.check();
  var check = middlewares.passport.check(true);
  var duoshuo = new Duoshuo(app.locals.site.duoshuo);

  // locals
  var locals = {};
  locals.sys = sys;
  locals.moment = moment;
  locals.site = app.locals.site;
  locals.url = app.locals.url;

  // init themes
  var themes = new Theme(home, locals, locals.site.theme || 'flat');

  // routes
  var routes = {
    sign: sign(ctrlers, themes),
    signout: middlewares.passport.signout,
    board: board(ctrlers, themes),
    thread: thread(ctrlers, themes),
    media: media(ctrlers, themes),
    user: user(ctrlers, app.locals, themes),
    pager: page(ctrlers, themes),
    admin: admin(ctrlers, app.locals, themes)
  };

  routes.board.show = routes.pager.show;

  // middlewares
  app.all('*', passport);
  app.all('*', themes.local('user'));
  app.get('*', middlewares.current);
  app.get('*', middlewares.install(app, models.config));

  // home
  app.get('/', routes.pager.show);
  app.get('/page/:page', routes.pager.show);

  // signin & signout
  app.get('/sign', routes.sign.sign)
  app.get('/signin', duoshuo.signin(), routes.sign.signin);
  app.get('/signout', routes.signout);

  // board
  app.resource('board', routes.board)
    .add(app.resource('page', routes.pager));

  // thread
  app.resource('thread', routes.thread);

  // media
  app.resource('medias', routes.media);

  // member
  app.resource('member', routes.user);
  app.post('/member/sync', check, routes.user.sync);

  // admin
  app.get('/admin', routes.sign.checkAdmin, routes.admin.page);
  app.post('/setting', routes.admin.update);

};