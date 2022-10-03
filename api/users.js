const bcrypt = require("bcrypt")
const pool = require("../database/database")
const util = require("../util/util-functions")
const upload = require("../util/cloudinary")
const SALT = 10


const users = {
    addUser: (req, res, next) => {
        bcrypt.hash(req.body.password, SALT, (err, hash) => {
            if (err) console.log(err)
            pool.query(`INSERT INTO users (name, email, password, type, status) 
                  VALUES ($1, $2, $3, $4, 'inactive') ON CONFLICT DO NOTHING RETURNING id`,
                [req.body.name, req.body.email, hash, req.params.type],
                (err, result) => {

                    if (req.params.type === 'store' && result.rowCount === 1) {

                        pool.query(`INSERT INTO store_info (store_id, phone, address, store_type, pfp_url, cover_url) VALUES ($1, $2, $3, $4, $5, $6)`,
                            [result.rows[0].id, req.body.phone, req.body.address, req.body.type, util.getDefaultStorePfp(), util.getDefaultStoreCover()], err => {
                                if (err) console.log(err)
                            })
                    }
                    if (result.rows.length > 0) {
                        req.newUserId = result.rows[0].id
                        req.newUserType = req.params.type
                    }
                    req.rowCount = result.rowCount
                    next()
                })
        })
    },
    getUser: (req, res, next) => {
        pool.query(`SELECT * FROM users WHERE email = $1`, [req.body.email], (err, result) => {

            if (err) console.log(err)

            if (result.rows.length > 0) {
                bcrypt.compare(req.body.password, result.rows[0].password, (err, response) => {
                    if (err) console.log(err)

                    if (response) {
                        const {password, ...rest} = result.rows[0]
                        req.user = rest
                    } else req.message = 'Netačna lozinka'
                    next()
                })
            } else {
                req.message = 'Korisnik ne postoji'
                next()
            }
        })
    },
    checkIfUserIsBlocked: (req, res, next) => {
        if (!req.user || req.user.status !== 'blocked')
            return next()

        pool.query(`SELECT is_permanent FROM blocked_users WHERE user_id = $1`, [req.user.id], (err, response) => {
            if (err) console.log(err)
            if (response.rows.length === 0)
                return next()
            if (response.rows[0].is_permanent) {
                req.user = null
                req.message = 'Profil vam je permanentno blokiran'
            } else {
                req.user = null
                req.message = 'Profil vam je blokiran na 15 dana'
            }
            next()
        })
    },
    unblockIfNecessary: (req, res, next) => {
        if (!req.user)
            return next()
        pool.query(`SELECT unblockUser($1)`, [req.user.id], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    getUserById: (req, res, next) => {
        pool.query(`SELECT * FROM users WHERE id = $1`, [req.params.id],
            (err, result) => {
                req.user = result.rows[0]
                next()
            })
    },
    restartPassword: (req, res, next) => {
        if (req.body.code === req.cookies.restartCode) {
            bcrypt.hash(req.body.newPwd, SALT, (err, hash) => {
                if (err) console.log(err)
                pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, req.params.id],
                    (err, result) => {
                        if (err) console.log(err)
                        req.updated = true
                        console.log(1)
                        next()
                    })
            })
        } else req.updated = false
        next()
    },
    checkIfUserExists: (req, res, next) => {
        pool.query(`SELECT * FROM users WHERE email = $1 OR id = $2`, [req.body.email, req.params.id],
            (err, result) => {
                req.user = result.rows[0]
                next()
            })
    },
    getAllInterests: (req, res, next) => {
        pool.query(`SELECT * FROM interests`, (err, result) => {
            if (err) console.log(err)
            req.interests = result.rows
            next()
        })
    },
    addNewUserInterests: (req, res, next) => {
        if (req.rowCount === 0)
            return next()
        if ((req.newUserId && req.newUserType === 'user') || req.updatedInfo) {
            let interests = req.body.interests
            let query = `INSERT INTO users_interests (user_id, interest_id) VALUES`
            if (!Array.isArray(interests))
                interests = [interests]
            interests.forEach((interest, i) => {
                query += ` (${req.newUserId || req.params.id}, $${i + 1}),`
            })
            query = query.slice(0, -1)
            pool.query(query, interests, (err, result) => {
                if (err) console.log(err)
                next()
            })
        }
        next()
    },
    getBuyerInfo: (req, res, next) => {
        pool.query(`SELECT * FROM users WHERE id = $1`, [req.params.id],
            (err, result) => {
                req.buyerInfo = result.rows[0]
                next()
            })
    },
    getStoreInfo: (req, res, next) => {
        let id
        if (req.product)
            id = req.product.store_id
        else id = req.params.storeId
        pool.query(`SELECT * FROM users 
                    INNER JOIN store_info si on users.id = si.store_id
                    WHERE id = $1`, [id],
            (err, result) => {
                if (err) console.log(err)
                req.storeInfo = result.rows[0]
                next()
            })
    },
    getAllUserInterestsById: (req, res, next) => {
        pool.query(`SELECT interest, id FROM interests 
                    INNER JOIN users_interests ui on interests.id = ui.interest_id
                    WHERE user_id = $1`, [req.params.id],
            (err, result) => {
                req.userInterests = result.rows
                next()
            })
    },
    updateUserInfo: (req, res, next) => {
        pool.query(`SELECT updateUserInfo($1, $2)`, [req.params.id, req.body.name],
            (err, result) => {
                if (err) console.log(err)
                req.updatedInfo = true
                next()
            })
    },
    updateUserPassword: (req, res, next) => {
        bcrypt.compare(req.body.currentPassword, req.user.password, (error, response) => {
            if (error) console.log(error)
            if (response) {
                bcrypt.hash(req.body.newPassword, SALT, (err, hash) => {
                    if (err) console.log(err)

                    pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, req.params.id],
                        (err, result) => {
                            console.log(result)
                            if (err) console.log(err)
                            req.updated = true
                            return next()
                        })
                })
            } else {
                req.updated = false
                next()
            }
        })
    },
    getStore: (req, res, next) => {
        pool.query(`SELECT * FROM users 
                    INNER JOIN store_info si on users.id = si.store_id
                    WHERE id = $1`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            req.storeInfo = result.rows[0]
            next()
        })
    },
    updateStoreInfo: (req, res, next) => {
        pool.query(`SELECT updateStoreInfo($1, $2, $3, $4)`, [req.params.id, req.body.name, req.body.phone, req.body.address],
            (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    updateStorePhotos: async (req, res, next) => {
        if (!req.files) {
            req.message = 'Niste odabrali sliku'
            return next()
        }
        let query = `UPDATE store_info SET `
        if (req.files.pfp_img) {
            const newPfp = await upload(util.dataUri(req.files.pfp_img.name, req.files.pfp_img.data))
            query += `pfp_url = '${newPfp.secure_url}'`
        }
        if (req.files.cover_img) {
            if (req.files.pfp_img) query += ', '
            const newCover = await upload(util.dataUri(req.files.cover_img.name, req.files.cover_img.data))
            query += `cover_url = '${newCover.secure_url}'`
        }
        query += ` WHERE store_id = $1`
        pool.query(query, [req.params.id], (err, result) => {
            if (err) console.log(err)
            req.message = 'Promjene spašene'
            next()
        })
    },
    addStoreOutlets: (req, res, next) => {
        pool.query(`INSERT INTO store_outlets (store_id, address, phone) VALUES ($1, $2, $3)`,
            [req.params.id, req.body.address, req.body.phone], (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    getStoreOutlets: (req, res, next) => {
        const id = req.params.id || req.params.storeId
        pool.query(`SELECT * FROM store_outlets WHERE store_id = $1`, [id], (err, result) => {
            if (err) console.log(err)
            req.storeOutlets = result.rows
            next()
        })
    },
    getStoreReviews: (req, res, next) => {
        pool.query(`SELECT *, date_time::date as date, date_time::time as time FROM store_reviews 
                    INNER JOIN users u on store_reviews.user_id = u.id WHERE store_id = $1`,
            [req.params.storeId], (err, result) => {
                if (err) console.log(err)
                req.reviews = result.rows
                next()
            })
    },
    addNewStoreReview: (req, res, next) => {
        pool.query(`INSERT INTO store_reviews (store_id, user_id, rating, comment, date_time) VALUES ($1, $2, $3, $4, NOW())`,
            [req.params.storeId, req.params.userId, req.body.rating, req.body.comment], (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    getStoreProductsCount: (req, res, next) => {
        pool.query(`SELECT COUNT(*) FROM products WHERE store_id = $1`, [req.storeInfo.store_id], (err, result) => {
            if (err) console.log(err)
            req.productsCount = result.rows[0].count
            console.log(req.productsCount)
            next()
        })
    },
    getStoreRevenue: (req, res, next) => {
        pool.query(`SELECT SUM(price) FROM orders 
                    INNER JOIN order_items oi on orders.id = oi.order_id 
                    WHERE store_id = $1`, [req.params.id],
            (err, result) => {
                if (err) console.log(err)
                req.revenue = result.rows[0]
                console.log(req.revenue)
                next()
            })
    },
    setStatusToActive: (req, res, next) => {
        if (!req.user)
            return next()
        pool.query(`UPDATE users SET status = 'active' WHERE id = $1`, [req.user.id], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    setStatusToInactive: (req, res, next) => {
        pool.query(`UPDATE users SET status = 'inactive' WHERE id = $1`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    getAllStores: (req, res, next) => {
        pool.query(`SELECT * FROM users INNER JOIN store_info si ON users.id = si.store_id`, (err, result) => {
            if (err) console.log(err)
            req.stores = result.rows
            next()
        })
    },
    getAdminId: (req, res, next) => {
        pool.query(`SELECT id FROM users WHERE type = 'admin'`, (err, result) => {
            if (err) console.log()
            req.adminId = result.rows[0].id
            next()
        })
    },
    getStoreNotifications: (req, res, next) => {
        pool.query(`SELECT * FROM store_notifications WHERE store_id = $1 ORDER BY timestamp DESC`, [req.params.id],
            (err, result) => {
                if (err) console.log(err)
                req.notifications = result.rows
                next()
        })
    },
    deleteStoreNotification: (req, res, next) => {
        pool.query(`DELETE FROM store_notifications WHERE id = $1`, [req.params.notificationId], (err, result) => {
            if (err) console.log(err)
            next()
        })
    }
}

module.exports = users