const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const jwt = require('jsonwebtoken')
const upload = require('express-fileupload')

const indexRouter = require('./routes/index')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(upload())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/public/images/', express.static('./public/images'))
app.use('/public/javascripts/', express.static('./public/javascripts'))

const openRoutes = ['/', '/login', '/register', '/register/store', '/register/user', '/logout', '/password/restart', '/password/restart/:id', '/favicon.ico']

app.use((req, res, next) => {
    if (openRoutes.includes(req.url) || req.url.includes('/register/') || req.url.includes('/logout/') || req.url.includes('/password/restart'))
        return next()
    try {
        jwt.verify(req.cookies.user_token, '42')
    } catch (err) {
        console.log(err)
        res.redirect('/')
        return next()
    }
    next()
})

app.use((req, res, next) => {
    if (!req.cookies.user_type || openRoutes.includes(req.url)
        || req.url.includes('/register/') || req.url.includes('/logout/') || req.url.includes('/password/restart'))
        return next()
    if (req.url.includes('/admin/') && req.cookies.user_type === 'admin')
        return next()
    if ((req.url.includes('/store/') || req.url.includes('/change-password/store/')) && req.cookies.user_type === 'store')
        return next()
    if ((req.url.includes('/user/') || req.url.includes('/change-password/user/')) && req.cookies.user_type === 'user')
        return next()
    return res.redirect('back')
})


app.use('/', indexRouter)

app.use((req, res, next) => {
    next(createError(404))
})

app.use((err, req, res, next) => {
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    res.status(err.status || 500)
    res.render('error')
})


module.exports = app