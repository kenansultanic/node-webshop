const pool = require("../database/database")

const search = {
    getProductsByStoreId: (req, res, next) => {
        const searchQuery = req.body.search || ''
        const priceFrom = req.body.priceFrom || null
        const priceTo = req.body.priceTo || null
        const params = [req.params.storeId, searchQuery + '%']
        let query = `SELECT * FROM products WHERE store_id = $1 AND LOWER(name) LIKE LOWER($2)`
        let counter = 2

        if (priceFrom) {
            query += ` AND price >= $${++counter}`
            params.push(priceFrom)
        }
        if (priceTo) {
            query += ` AND price <= $${++counter}`
            params.push(priceTo)
        }

        pool.query(query, params, (err, result) => {
            if (err) console.log(err)
            req.productIDs = []
            result.rows.forEach(product => req.productIDs.push(product.id))
            req.products = result.rows
            next()
        })
    },
    getCategoriesById: (req, res, next) => {
        let productIDs = ''
        req.productIDs.forEach(id => productIDs += `${id},`)
        productIDs = productIDs.slice(0, -1)
        pool.query(`SELECT * FROM products_categories WHERE product_id IN (${productIDs})`, (err, result) => {
            if (err) console.log(err)
            if (result)
                req.categories = result.rows
            else req.categories = []
            next()
        })
    },
    getProductImagesById: (req, res, next) => {
        let productIDs = ''
        req.productIDs.forEach(id => productIDs += `${id},`)
        productIDs = productIDs.slice(0, -1)
        pool.query(`SELECT * FROM product_images WHERE product_id IN (${productIDs})`, (err, result) => {
            if (err) console.log(err)
            if (result)
                req.images = result.rows || []
            else req.images = []
            next()
        })
    },
    searchForProducts: (req, res, next) => {
        pool.query(`SELECT products.store_id,
                           products.id,
                           products.name,
                           products.description,
                           products.quantity,
                           products.price
                    FROM products
                             INNER JOIN products_categories pc ON products.id = pc.product_id
                             INNER JOIN categories c ON c.id = pc.category_id
                    WHERE SIMILARITY(category, $1) > .6
                       OR SIMILARITY(products.name, $1) > .3
                       OR product_id IN
                          (SELECT keywords.product_id FROM keywords WHERE SIMILARITY(keyword, $1) > .5)`, [req.body.search], (err, result) => {
            if (err) console.log(err)
            req.searchProducts = result.rows
            req.searchProductIDs = result.rows.map(product => product.id)
            next()
        })
    },
    searchForStores: (req, res, next) => {
        pool.query(`SELECT * FROM users u
                    INNER JOIN store_info si ON u.id = si.store_id
                    WHERE SIMILARITY(u.name, $1) > .5
                    OR SIMILARITY(store_type, $1) > .5`, [req.body.search], (err, result) => {
            if (err) console.log(err)
            req.stores = result.rows
            next()
        })
    },
    searchProductsImages: (req, res, next) => {
        let productIDs = ``
        req.searchProductIDs.forEach(id => productIDs += `${id},`)
        productIDs = productIDs.slice(0, -1)
        pool.query(`SELECT * FROM product_images WHERE product_id in (${productIDs})`, (err, result) => {
            if (err) console.log(err)
            req.searchImages = result.rows
            next()
        })
    }
}

module.exports = search