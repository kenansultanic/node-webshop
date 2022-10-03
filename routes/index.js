const express = require('express')
const router = express.Router()
const util = require('../util/util-functions')
const email = require('../util/email')
const pool = require('../database/database')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const SALT = 10
const users = require('../api/users')
const products = require('../api/products')
const search = require('../api/search')
const orders = require('../api/orders')
const admin = require('../api/admin')
const chat = require('../api/chat')


// Login & Register

router.get('/', (req, res) => {
    res.render('index', {message: ''})
})

router.post('/login', users.getUser, users.unblockIfNecessary, users.checkIfUserIsBlocked, users.setStatusToActive, (req, res, next) => {
    if (req.user) {
        const token = jwt.sign(req.user, '42', {expiresIn: 60 * 60 * 24})
        res.cookie('user_token', token)
        res.cookie('user_type', req.user.type)

        switch (req.user.type) {
            case 'store':
                res.redirect(`/store/${req.user.id}`)
                break
            case 'user':
                res.redirect(`/user/${req.user.id}`)
                break
            default:
                res.redirect(`/admin/statistics/${req.user.id}`)
        }
    } else res.render('index', {message: req.message})
})

router.get('/register', (req, res) => {
    res.render('register/register')
})

router.get('/register/store', (req, res) => {
    res.render('register/store', {message: ''})
})

router.get('/register/user', users.getAllInterests, (req, res) => {
    res.render('register/user', {message: '', interests: req.interests})
})

router.post('/register/:type', users.addUser, users.addNewUserInterests, (req, res) => {
    if (req.rowCount === 0)
        if (req.params.type === 'user')
            res.render('register/user', {message: 'Email se već koristi'})
        else res.render('register/store', {message: 'Email se već koristi'})
    else res.redirect('/')
})

router.get('/logout/:id', users.setStatusToInactive, (req, res) => {
    res.clearCookie('user_token')
    res.redirect('/')
})

// Password restart

router.get('/password/restart', (req, res) => {
    res.render('password-restart/password-restart-email', {message: 'Unesite email s kojim ste povezani na sistem'})
})

router.post('/password/restart', users.checkIfUserExists, (req, res) => {
    if (req.user !== undefined)
        res.redirect(`/password/restart/${req.user.id}`)
    else res.render('password-restart/password-restart-email', {message: 'Uneseni email nije registrovan na sistem'})
})

router.get('/password/restart/:id', users.checkIfUserExists, (req, res) => {
    const code = util.randomNumber(10000, 99999)
    const hash = bcrypt.hashSync(toString(code), SALT)
    res.cookie('restartCode', hash)
    email.passwordRestart(code, req.user.email)
    res.render('password-restart/password-restart', {
        id: req.user.id,
        message: 'Unesite kod koji vam je poslat na mail'
    })
})

router.post('/password/restart/:id', (req, res) => {
    if (bcrypt.compareSync(toString(req.body.code), req.cookies.restartCode)) {
        bcrypt.hash(req.body.newPwd, SALT, (err, hash) => {
            if (err) console.log(err)
            pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, req.params.id],
                (err, result) => {
                    if (err) console.log(err)
                    res.redirect('/')
                })
        })
    } else res.render('password-restart/password-restart', {id: req.params.id, message: 'Neispravan kod'})
})

// Store

router.get('/store/:id', users.getStore, users.getStoreOutlets, users.getStoreRevenue, users.getAdminId, (req, res) => {
    res.render('store/profile', {
        id: req.params.id,
        storeInfo: req.storeInfo,
        storeOutlets: req.storeOutlets,
        revenue: req.revenue.sum,
        adminId: req.adminId
    })
})

router.get('/store/change-profile-info/:id', users.getStore, (req, res) => {
    res.render('store/update-profile', {id: req.params.id, storeInfo: req.storeInfo})
})

router.post('/store/update-info/:id', users.updateStoreInfo, (req, res) => {
    res.sendStatus(200)
})

router.get('/store/update-profile-photos/:id', (req, res) => {
    res.render('store/update-profile-photos', {id: req.params.id, message: ''})
})

router.post('/store/update-profile-photos/:id', users.updateStorePhotos, (req, res) => {
    res.render('store/update-profile-photos', {id: req.params.id, message: req.message})
})

router.get('/store/new-outlet/:id', (req, res) => {
    res.render('store/new-store-outlet', {id: req.params.id, message: ''})
})

router.post('/store/new-outlet/:id', users.addStoreOutlets, (req, res) => {
    res.render('store/new-store-outlet', {id: req.params.id, message: 'Produžnica spašena'})
})

router.get('/store/new-product/:id', products.getCategories, (req, res) => {
    res.render('store/new-product', {id: req.params.id, categories: req.allCategories})
})

router.post('/store/new-product/:id', products.addProduct, products.addProductCategories, products.addProductImages, products.addProductKeywords, (req, res) => {
    res.redirect('back')
})

router.get('/store/product/update-images/:id/:productId', (req, res) => {
    res.render('store/update-product-photos', {id: req.params.id, productId: req.params.productId, message: ''})
})

router.post('/store/product/update-images/:id/:productId', products.updateProductImages, (req, res) => {
    res.render('store/update-product-photos', {
        id: req.params.id,
        productId: req.params.productId,
        message: req.message
    })
})

router.get('/store/reviews/:storeId', users.getStoreInfo, users.getStoreReviews, (req, res) => {
    res.render('store/store-reviews', {
        id: req.params.storeId,
        storeInfo: req.storeInfo,
        reviews: req.reviews,
        averageRating: util.calculateAverageStoreRating(req.reviews)
    })
})


router.get('/store/products/all/:id', products.getAllProductsByStoreId, (req, res) => {
    res.render('store/all-products', {id: req.params.id, products: req.products})
})

router.get('/store/product-details/:id/:storeId', products.getProductById, products.getProductCategoriesById, products.getProductImagesById, products.getProductKeywordsById, products.getCategories, (req, res) => {
    res.render('store/product-overview', {
        id: req.params.storeId,
        productId: req.params.id,
        product: req.product,
        categories: req.categories,
        images: req.images,
        keywords: req.keywords,
        allCategories: req.allCategories
    })
})

router.get('/store/product-reviews/:productId/:userId', products.getProductReviews, (req, res) => {
    res.render('store/product-reviews', {
        id: req.params.userId,
        reviews: req.reviews,
        averageRating: util.calculateAverageStoreRating(req.reviews)
    })
})

router.post('/store/update-product/:id', products.notifyChanges, products.updateProduct, products.addProductCategories, products.addProductKeywords, (req, res) => {
    res.sendStatus(200)
})

router.get('/store/product/delete/:productId/:storeId', products.deleteProduct, (req, res) => {
    res.redirect('back')
})

router.get('/change-password/store/:id', (req, res) => {
    res.render('store/password-change', {id: req.params.id})
})

router.post('/change-password/store/:id', users.getUserById, users.updateUserPassword, (req, res) => {
    if (req.updated)
        res.send('Promjene spašene')
    else res.send('Netačna lozinka')
})

router.get('/store/orders/:id', orders.getStoreOrders, (req, res) => {
    res.render('store/orders', {id: req.params.id, orders: req.orders})
})

router.post('/store/order/:orderId/:status', orders.getBuyerEmailByOrderId, orders.updateStatus, (req, res) => {
    res.sendStatus(200)
})

router.get('/store/chats/:sender', chat.getUserChats, chat.getChatUsersImages, (req, res) => {
    console.log(util.parseChatUsers(req.chats, req.images))
    res.render('store/chats', {id: req.params.sender, chats: util.parseChatUsers(req.chats, req.images)})
})

router.get('/store/chat/:sender/:receiver', chat.getUserMessages, chat.getReceiverInfo,  (req, res) => {
    res.render('store/chat', {
        id: parseInt(req.params.sender),
        userId: req.params.receiver,
        messages: req.messages,
        receiver: req.receiver
    })
})

router.post('/store/send-message/:sender/:receiver', chat.saveMessage, (req, res) => {
    res.sendStatus(200)
})

router.get('/store/notifications/:id', users.getStoreNotifications, (req, res) => {
    res.render('store/notifications', {id: req.params.id, notifications: req.notifications})
})

router.post('/store/delete-notification/:id/:notificationId', users.deleteStoreNotification, (req, res) => {
    res.sendStatus(200)
})


// User

router.get('/user/profile/:id', users.getBuyerInfo, users.getAllUserInterestsById, users.getAllInterests, users.getAdminId, (req, res) => {
    res.render('user/profile', {
        id: req.params.id,
        user: req.buyerInfo,
        userInterests: req.userInterests,
        allInterests: req.interests,
        adminId: req.adminId
    })
})

router.post('/user/update-info/:id', users.updateUserInfo, users.addNewUserInterests, (req, res) => {
    res.sendStatus(200)
})

router.get('/user/:id', products.getAllProducts, products.getAllProductImages, products.getAllProductCategories,
    products.getRecommendedProducts, products.getRecommendedProductsImages, products.getPopularProducts,
    products.getPopularProductsImages, (req, res) => {
        res.cookie('userID', req.params.id)
        res.render('user/user', {
            id: req.params.id,
            allProducts: util.parseProducts(req.products, req.images, req.categories),
            recommendedProducts: util.parseProducts(req.recommendedProducts, req.recommendedImages, []),
            popularProducts: util.parseProducts(req.popularProducts, req.popularImages, [])
        })
    })

router.get('/user/product/:userId/:id', products.getProductById, products.getProductCategoriesById, products.getProductImagesById, users.getStoreInfo, (req, res) => {
    res.render('user/product-overview', {
        id: req.params.userId,
        product: req.product,
        categories: req.categories,
        images: req.images,
        storeInfo: req.storeInfo
    })
})

router.get('/user/product-reviews/:productId/:userId/:storeId', products.getProductReviews, (req, res) => {
    res.render('user/product-reviews', {
        id: req.params.userId,
        productId: req.params.productId,
        storeId: req.params.storeId,
        reviews: req.reviews,
        averageRating: util.calculateAverageStoreRating(req.reviews)
    })
})

router.get('/user/leave-product-review/:productId/:userId/:storeId', (req, res) => {
    res.render('user/leave-product-review', {
        id: req.params.userId,
        productId: req.params.productId,
        storeId: req.params.storeId
    })
})

router.post('/user/leave-product-review/:productId/:userId/:storeId', products.addNewProductReview, (req, res) => {
    res.redirect(`/user/product-reviews/${req.params.productId}/${req.params.userId}/${req.params.storeId}`)
})

router.post('/user/add-to-cart/:id', products.getProductById, products.getProductImagesById, (req, res) => {
    const cart = req.cookies.cart
    const product = {...req.product, images: req.images}
    if (cart)
        res.cookie('cart', util.addToCart(cart, product))
    else res.cookie('cart', [product])
    res.sendStatus(200)
})

router.get('/user/cart/:id', (req, res) => {
    res.render('user/cart', {
        id: req.params.id,
        cart: req.cookies.cart || [],
        price: util.calculateCartPrice(req.cookies.cart)
    })
})

router.get('/user/check-coupon/:coupon', products.checkIfCouponExists, (req, res) => {
    res.send({coupon: req.coupon || null})
})

router.post('/user/cart/delete/:id', (req, res) => {
    res.cookie('cart', util.deleteFromCart(req.cookies.cart, parseInt(req.params.id)))
    res.sendStatus(200)
})

router.post('/user/place-order/:id', orders.placeNewOrder, orders.addOrderItems, users.getUserById, (req, res) => {
    email.userOrderCreated(req.user.email, req.order_id)
    res.clearCookie('cart')
    res.sendStatus(200)
})

router.post('/user/follow-product/:productId/:userId', products.followProduct, (req, res) => {
    res.sendStatus(200)
})

router.get('/user/unsubscribe-from-product/:productId/:userId', products.unsubscribeFromProduct, (req, res) => {
    res.render('user/unsubscribe-product', {id: req.params.userId})
})

router.get('/change-password/user/:id', (req, res) => {
    res.render('user/password-change', {id: req.params.id})
})

router.post('/change-password/user/:id', users.getUserById, users.updateUserPassword, (req, res) => {
    if (req.updated)
        res.send('Promjene spašene')
    else res.send('Netačna lozinka')
})

router.get('/user/store-page/:userId/:storeId', users.getStoreInfo, users.getStoreOutlets, users.getStoreProductsCount, (req, res) => {
    res.render('user/store-page', {
        id: req.params.userId,
        storeInfo: req.storeInfo,
        storeOutlets: req.storeOutlets,
        productsCount: req.productsCount
    })
})

router.get('/user/search-stores/:id', users.getAllStores, (req, res) => {
    res.render('user/search-stores', {id: req.params.id, stores: req.stores, searchQuery: ''})
})

router.post(`/user/search-stores/:id`, search.searchForStores, (req, res) => {
    res.render('user/search-stores', {
        id: req.params.id,
        stores: util.orderStores(req.stores),
        searchQuery: req.body.search
    })
})

router.get('/user/store-reviews/:userId/:storeId', users.getStoreInfo, users.getStoreReviews, (req, res) => {
    res.render('user/store-reviews', {
        id: req.params.userId,
        storeInfo: req.storeInfo,
        reviews: req.reviews,
        averageRating: util.calculateAverageStoreRating(req.reviews)
    })
})

router.get('/user/leave-store-review/:userId/:storeId', (req, res) => {
    res.render('user/leave-store-review', {id: req.params.userId, storeId: req.params.storeId})
})

router.post('/user/leave-store-review/:userId/:storeId', users.addNewStoreReview, (req, res) => {
    res.redirect(`/user/store-reviews/${req.params.userId}/${req.params.storeId}`)
})

router.get('/user/store-products/:userId/:id', products.getAllProductsByStoreId, products.getAllProductCategoriesByStoreId, products.getAllProductImagesByStoreId, (req, res) => {
    res.render('user/store-products', {
        id: req.params.userId,
        storeId: req.params.id,
        products: util.parseProducts(req.products, req.images, req.categories)
    })
})

router.post('/user/search-store/:userId/:storeId', search.getProductsByStoreId, search.getCategoriesById, search.getProductImagesById, (req, res) => {
    const orderBy = req.body.orderBy || null
    res.render('user/store-products', {
        id: req.params.userId,
        storeId: req.params.storeId,
        products: util.parseProducts(util.sortProducts(req.products, orderBy), req.images, req.categories)
    })
})

router.post('/user/search-products/:id', search.searchForProducts, search.searchProductsImages, (req, res) => {
    const orderBy = req.body.orderBy || null
    const products = util.filterProducts(req.searchProducts, req.body.priceFrom, req.body.priceTo)
    res.render('user/products-search', {
        id: req.params.id,
        products: util.parseProducts(util.sortProducts(products, orderBy), req.searchImages, []),
        searchQuery: req.body.search
    })
})


router.get('/user/orders/:id', orders.getUserOrders, (req, res) => {
    res.render('user/orders', {id: req.params.id, orders: req.orders})
})

router.get('/user/cancel-order/:orderId/:userId', orders.cancelUserOrder, (req, res) => {
    res.redirect(`/user/orders/${req.params.userId}`)
})


router.get('/user/chats/:sender', chat.getUserChats, chat.getChatUsersImages, (req, res) => {
    console.log(util.parseChatUsers(req.chats, req.images))
    res.render('user/chats', {id: req.params.sender, chats: util.parseChatUsers(req.chats, req.images)})
})

router.get('/user/chat/:sender/:receiver', chat.getUserMessages, chat.getReceiverInfo,  (req, res) => {
    res.render('user/chat', {
        id: parseInt(req.params.sender),
        userId: req.params.receiver,
        messages: req.messages,
        receiver: req.receiver
    })
})

router.post('/user/send-message/:sender/:receiver', chat.saveMessage, (req, res) => {
    res.sendStatus(200)
})

//  Admin

router.get('/admin/statistics/:id', admin.getNumberOfStores, admin.getNumberOfUsers, admin.getNumberOfProducts, admin.getNumberOfOrders,
    admin.getAverageNumberOfOrderItems, admin.getAveragePriceOfOrder, admin.getAveragePriceOfProducts, (req, res) => {
        console.log(req.numberOfStores)
        res.render('admin/statistics', {
            id: req.params.id,
            numberOfStores: req.numberOfStores,
            numberOfUsers: req.numberOfUsers,
            numberOfProducts: req.numberOfProducts,
            numberOfOrders: req.numberOfOrders,
            avgPriceOfOrder: req.avgPriceOfOrder,
            avgPriceOfProducts: req.avgPriceOfProducts,
            avgNumOfOrderItems: req.avgNumOfOrderItems

        })
    })

router.get('/admin/users/:id', admin.getAllUsers, (req, res) => {
    res.render('admin/users', {id: req.params.id, users: req.users})
})

router.post('/admin/block-user/:userId/:duration', admin.blockUser, (req, res) => {
    res.sendStatus(200)
})

router.post('/admin/unblock-user/:userId', admin.unblockUser, (req, res) => {
    res.sendStatus(200)
})

router.get('/admin/lookup-tables/:id', users.getAllInterests, products.getCategories, (req, res) => {
    res.render('admin/lookup-tables', {id: req.params.id, categories: req.allCategories, interests: req.interests})
})

router.post('/admin/add-interest', admin.addInterest, (req, res) => {
    res.sendStatus(200)
})

router.post('/admin/add-category', admin.addCategory, (req, res) => {
    res.sendStatus(200)
})

router.post('/admin/delete-interest/:id', admin.deleteInterest, (req, res) => {
    res.sendStatus(200)
})

router.post('/admin/delete-category/:id', admin.deleteCategory, (req, res) => {
    res.sendStatus(200)
})

router.get('/admin/update-table/:type/:itemId/:id', (req, res) => {
    res.render('admin/update-table', {id: req.params.id, type: req.params.type, itemId: req.params.itemId})
})

router.post('/admin/update-table/category/:id/:adminId', admin.updateCategory, (req, res) => {
    res.redirect(`/admin/lookup-tables/${req.params.adminId}`)
})

router.post('/admin/update-table/interest/:id/:adminId', admin.updateInterest, (req, res) => {
    res.redirect(`/admin/lookup-tables/${req.params.adminId}`)
})

router.get('/admin/chats/:sender', chat.getUserChats, chat.getChatUsersImages, (req, res) => {
    console.log(util.parseChatUsers(req.chats, req.images))
    res.render('admin/chats', {id: req.params.sender, chats: util.parseChatUsers(req.chats, req.images)})
})

router.get('/admin/chat/:sender/:receiver', chat.getUserMessages, chat.getReceiverInfo,  (req, res) => {
    res.render('admin/chat', {
        id: parseInt(req.params.sender),
        userId: req.params.receiver,
        messages: req.messages,
        receiver: req.receiver
    })
})

router.post('/admin/send-message/:sender/:receiver', chat.saveMessage, (req, res) => {
    res.sendStatus(200)
})

router.get('/admin/coupons/:id', products.getCoupons, (req, res) => {
    res.render('admin/coupons', {id: req.params.id, coupons: req.coupons})
})

router.post('/admin/add-coupon', admin.addCoupon, (req, res) => {
    if (req.rowCount === 1)
        res.sendStatus(200)
    else res.sendStatus(409)
})

router.post('/admin/delete-coupon/:id', admin.deleteCoupon, (req, res) => {
    res.sendStatus(200)
})


module.exports = router