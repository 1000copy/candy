var path = require('path'),
    moment = require('moment'),
    Theme = require('theme'),
    Duoshuo = require('duoshuo'),
    home = require('./home'),
    sign = require('./sign'),
    board = require('./board'),
    thread = require('./thread'),
    user = require('./user'),
    page = require('./page'),
    admin = require('./admin'),
    media = require('./media'),
    cn = require('../libs/zh-cn'),
    sys = require('../package.json');

moment.lang('zh-cn', cn);

module.exports = function(app, models, ctrlers, middlewares) {

    var passport = middlewares.passport.check(),
        check = middlewares.passport.check(true),
        duoshuo = new Duoshuo(app.locals.site.duoshuo);

    // locals
    var locals = {};
    locals.sys = sys;
    locals.moment = moment;
    locals.site = app.locals.site;
    locals.url = app.locals.url;

    // load default theme: candy-theme-flat
    var defaultTheme = {};
    defaultTheme.name =  'candy-theme-flat';
    defaultTheme.realPath = path.join(__dirname, '../', 'node_modules', defaultTheme.name);
    defaultTheme.static = './static';

    var theme = app.locals.site.theme || defaultTheme,
        themes = new Theme(path.resolve(__dirname, '../'), theme, locals);

    // routes
    var routes = {
        sign: sign(ctrlers, themes),
        signout: middlewares.passport.signout,
        home: home(ctrlers, themes),
        board: board(ctrlers, themes),
        thread: thread(ctrlers, themes),
        media: media(ctrlers, themes),
        user: user(ctrlers, app.locals, themes),
        pager: page(ctrlers, themes),
        admin: admin(ctrlers, app.locals, themes)
    };

    // middlewares
    app.all('*', passport);
    app.all('*', function(req, res, next){
        themes.locals.user = res.locals.user;
        next();
    });
    app.get('*', middlewares.current);
    app.get('*', middlewares.install(app, models.config));

    // home
    app.get('/', routes.home);

    // signin & signout
    app.get('/sign', routes.sign.sign)
    app.get('/signin', duoshuo.signin(), routes.sign.signin);
    app.get('/signout', routes.signout);

    // board
    app.resource('board', routes.board)
        .add(app.resource('page', routes.pager));

    // thread
    app.resource('thread', routes.thread)
        .add(app.resource('page', routes.pager));

    // media
    app.resource('medias', routes.media);

    // member
    app.resource('member', routes.user);
    app.post('/member/sync', check, routes.user.sync);

    // admin
    app.get('/admin', routes.sign.checkAdmin, routes.admin.page);
    app.post('/setting', routes.admin.update);

};