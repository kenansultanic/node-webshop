const pool = require("../database/database")

const admin = {
    getNumberOfStores: (req, res, next) => {
        pool.query(`SELECT COUNT(*) FROM users WHERE type = 'store'`, (err, result) => {
            req.numberOfStores = result.rows[0].count
            next()
        })
    },
    getNumberOfUsers: (req, res, next) => {
        pool.query(`SELECT COUNT(*) FROM users WHERE type = 'user'`, (err, result) => {
            req.numberOfUsers = result.rows[0].count
            next()
        })
    },
    getNumberOfProducts: (req, res, next) => {
        pool.query(`SELECT COUNT(*) FROM products`, (err, result) => {
            req.numberOfProducts = result.rows[0].count
            next()
        })
    },
    getNumberOfOrders: (req, res, next) => {
        pool.query(`SELECT COUNT(*) FROM orders`, (err, result) => {
            req.numberOfOrders = result.rows[0].count
            next()
        })
    },
    getAverageNumberOfOrderItems: (req, res, next) => {
        pool.query(`SELECT AVG(n_of_items) FROM
                    (SELECT COUNT(*) AS n_of_items FROM order_items GROUP BY order_id) AS t`,
            (err, result) => {
                req.avgNumOfOrderItems = result.rows[0].avg
                next()
            })
    },
    getAveragePriceOfOrder: (req, res, next) => {
        pool.query(`SELECT AVG(sum_of_price) FROM
                    (SELECT SUM(price) AS sum_of_price FROM order_items GROUP BY order_id) AS t`,
            (err, result) => {
                req.avgPriceOfOrder = result.rows[0].avg
                next()
            })
    },
    getAveragePriceOfProducts: (req, res, next) => {
        pool.query(`SELECT AVG(price) FROM products`, (err, result) => {
            req.avgPriceOfProducts = result.rows[0].avg
            next()
        })
    },
    getAllUsers: (req, res, next) => {
        pool.query(`SELECT * FROM users WHERE type = 'store' OR type = 'user'`, (err, result) => {
            req.users = result.rows
            next()
        })
    },
    blockUser: (req, res, next) => {
        let isPermanent = false
        if (req.params.duration === 'permanently')
            isPermanent = true
        pool.query(`SELECT blockUser($1, $2)`, [req.params.userId, isPermanent], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    unblockUser: (req, res, next) => {
        pool.query(`UPDATE users SET status = 'inactive' WHERE id = $1`, [req.params.userId], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    addInterest: (req, res, next) => {
        pool.query(`INSERT INTO interests (interest) VALUES ($1)`, [req.body.interest], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    addCategory: (req, res, next) => {
        pool.query(`INSERT INTO categories (category) VALUES ($1)`, [req.body.category], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    deleteCategory: (req, res, next) => {
        pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    deleteInterest: (req, res, next) => {
        pool.query(`DELETE FROM interests WHERE id = $1`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    updateCategory: (req, res, next) => {
        pool.query(`UPDATE categories SET category = $1 WHERE id = $2`, [req.body.value, req.params.id],
            (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    updateInterest: (req, res, next) => {
        pool.query(`UPDATE interests SET interest = $1 WHERE id = $2`, [req.body.value, req.params.id],
            (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    addCoupon: (req, res, next) => {
        pool.query(`INSERT INTO coupons (coupon, discount, number_of_uses) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING`,
            [req.body.coupon, req.body.discount], (err, result) => {
                if (err) console.log(err)
                req.rowCount = result.rowCount
                next()
            })
    },
    deleteCoupon: (req, res, next) => {
        pool.query(`DELETE FROM coupons WHERE id = $1`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            next()
        })
    }
}

module.exports = admin