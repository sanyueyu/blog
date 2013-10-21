
var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');
module.exports = function(app) {
    app.get('/', function(req, res) {
        Post.getAll(null, function(error, posts) {
            if(error) {
                posts = [];
            }
            res.render('index', {
                title: 'Myblog',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/reg', checkNotLogin);
    app.get('/reg', function(req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', function(req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        if(password != password_re) {
            req.flash('error', '两次密码不一致');
            return res.redirect('/reg');
        }
        //generate md5
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });
        //check username
        User.get(newUser.name, function(error, user) {
            if(user) {
                req.flash('error', '用户名已经存在');
                return res.redirect('/reg');
            }
            newUser.save(function(error, user) {
                if(error) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功');
                res.redirect('/');
            });
        });
    });
    app.get('/login', function(req, res) {
        res.render('login', {
            title: '登陆',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        //generate md5
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //check user
        User.get(req.body.name, function(error, user) {
            if(!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/login');
            }
            //check password
            if(user.password != password) {
                req.flash('error', '密码错误');
                return res.redirect('/login');
            }
            //success
            req.session.user = user;
            req.flash('success', '登陆成功');
            res.redirect('/');
        });
    });
    app.get('/post', checkLogin);
    app.get('/post',  function(req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function(error) {
            if(error) {
                req.flash('error', error);
                return res.redirect('/');
            }
            req.flash('success', '发布成功');
            res.redirect('/');
        });
    });
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/');
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function(req, res) {
        for(var i in req.files) {
            if(req.files[i].size == 0) {
                //delete
                fs.unlinkSync(req.files[i].path);
                console.log('success remove empty file');
            } else {
                var  target_path = './public/images/' + req.files[i].name;
                //rename
                fs.renameSync(req.files[i].path, target_path);
                console.log('success rename file');
            }
        }
        req.flash('success', '文件上传成功');
        res.redirect('/upload');
    });

    app.get('/u/:name', function(req, res) {
        User.get(req.params.name, function(error, user) {
            if(!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/');
            }
            Post.getAll(user.name, function(error, posts) {
                if(error) {
                    req.falsh('error', error);
                    return req.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(error, post) {
            if(error) {
                req.flash('error', error);
                return res.redirect('/');
            }
            res.render('artical', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    function checkLogin(req, res, next) {
        if(!req.session.user) {
            req.flash('error', '未登录');
            return res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if(req.session.user) {
            req.flash('error', '已登录');
            return res.redirect('back');
        }
        next();
    }
};
