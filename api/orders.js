const pool = require("../database/database")
const email = require("../util/email")

const orders = {
    placeNewOrder: (req, res, next) => {
        req.cart = req.body.cart
        pool.query(`SELECT placeNewOrder($1, $2, $3, $4, $5, $6)`,
            [req.cart[0].store_id, req.params.id, req.body.address, req.body.phone, req.body.city, req.body.zip],
            (err, result) => {
                if (err) console.log(err)
                req.order_id = result.rows[0].placeneworder
                next()
            })
    },
    addOrderItems: (req, res, next) => {
        let query = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES `
        const params = [req.order_id,]
        let counter = 1
        req.cart.forEach(item => {
            params.push(item.id, item.quantity, item.price)
            query += `($1, $${++counter}, $${++counter}, $${++counter}),`
        })
        pool.query(query.slice(0, -1), params, (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    getUserOrders: (req, res, next) => {
        pool.query(`SELECT *, order_date::date as date FROM orders WHERE user_id = $1`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            req.orders = result.rows
            next()
        })
    },
    cancelUserOrder: (req, res, next) => {
        pool.query(`SELECT cancelOrder($1)`, [req.params.orderId], (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    updateStatus: (req, res, next) => {
        pool.query(`SELECT updateOrderStatus($1, $2)`, [req.params.orderId, req.params.status], (err, result) => {
            if (err) console.log(err)
            email.userOrderStatusUpdated(req.buyerEmail, req.params.order_id, req.params.status)
            next()
        })
    },
    getStoreOrders: (req, res, next) => {
        pool.query(`SELECT *, order_date::date as date FROM orders WHERE store_id = $1`, [req.params.id],
            (err, result) => {
                if (err) console.log(err)
                req.orders = result.rows
                next()
            })
    },
    getBuyerEmailByOrderId: (req, res, next) => {
        pool.query(`SELECT email FROM orders
                    INNER JOIN users u on u.id = orders.user_id
                    WHERE orders.id = $1`, [req.params.orderId], (err, result) => {
            if (err) console.log(err)
            req.buyerEmail = result.rows[0]
            next()
        })
    }
}

module.exports = orders