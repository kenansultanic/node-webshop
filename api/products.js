const pool = require("../database/database")
const upload = require("../util/cloudinary")
const util = require("../util/util-functions")
const email = require('../util/email')

const products = {
    getCategories: (req, res, next) => {
        pool.query(`SELECT * FROM categories`, (err, result) => {
            req.allCategories = result.rows
            next()
        })
    },
    addProduct: (req, res, next) => {
        pool.query(`SELECT addNewProduct2($1, $2, $3, $4, $5)`,
            [req.params.id, req.body.name, req.body.description, req.body.quantity || null, req.body.price],
            (err, result) => {
                if (err) console.log(err)
                req.product_id = result.rows[0].addnewproduct2
                next()
            })
    },
    addProductImages: async (req, res, next) => {
        let result = await upload(util.dataUri(req.files.img1.name, req.files.img1.data))
        let query = `INSERT INTO product_images (product_id, img_name, img_url, img_number) VALUES ($1, $2, $3, 1)`
        const params = [req.product_id, req.files.img1.name, result.secure_url]

        if (req.files.img2) {
            query += `, ($1, $4, $5, 2)`
            result = await upload(util.dataUri(req.files.img2.name, req.files.img2.data))
            params.push(req.files.img2.name, result.secure_url)
        }
        if (req.files.img3) {
            if (!req.files.img2)
                query += `, ($1, $4, $5, 2)`
            else query += `, ($1, $6, $7, 3)`
            result = await upload(util.dataUri(req.files.img3.name, req.files.img3.data))
            params.push(req.files.img3.name, result.secure_url)
        }
        pool.query(query, params, (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    addProductCategories: (req, res, next) => {
        let categories = req.body.categories
        let query = `INSERT INTO products_categories (product_id, category_id) VALUES`
        if (!Array.isArray(categories))
            categories = [categories]
        categories.forEach((category, i) => {
            query += ` (${req.product_id || req.params.id}, $${i + 1}),`
        })
        pool.query(query.slice(0, -1), categories, (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    addProductKeywords: (req, res, next) => {
        let keywords = req.body.keywords.split(',')
        keywords = keywords.map(keyword => keyword.trim())
        let query = `INSERT INTO keywords (product_id, keyword) VALUES `
        keywords.forEach((keyword, i) => {
            query += ` (${req.product_id || req.params.id}, $${i + 1}),`
        })
        pool.query(query.slice(0, -1), keywords, (err, result) => {
            if (err) console.log(err)
            next()
        })
    },
    getAllProductsByStoreId: (req, res, next) => {
        pool.query(`SELECT * FROM products WHERE store_id = $1`, [req.params.id], (err, result) => {
            req.products = result.rows
            next()
        })
    },
    getAllProductImagesByStoreId: (req, res, next) => {
        pool.query(`SELECT * FROM product_images
                    INNER JOIN products p on p.id = product_images.product_id
                    WHERE p.store_id = $1`, [req.params.id], (err, result) => {
            req.images = result.rows
            next()
        })
    },
    getAllProductCategoriesByStoreId: (req, res, next) => {
        pool.query(`SELECT category, product_id, category_id FROM categories
                    INNER JOIN products_categories pc on categories.id = pc.category_id
                    INNER JOIN products p on p.id = pc.product_id
                    WHERE store_id = $1`, [req.params.id], (err, result) => {
            req.categories = result.rows
            next()
        })
    },
    getProductById: (req, res, next) => {
        pool.query(`SELECT * FROM products WHERE id = $1`, [req.params.id], (err, result) => {
            req.product = result.rows[0]
            req.product.quantity = req.body.quantity
            next()
        })
    },
    getProductCategoriesById: (req, res, next) => {
        pool.query(`SELECT c.id, category from categories c
                    INNER JOIN products_categories pc on c.id = pc.category_id
                    WHERE pc.product_id = $1`, [req.params.id], (err, result) => {
            req.categories = result.rows
            next()
        })
    },
    getProductImagesById: (req, res, next) => {
        pool.query(`SELECT * FROM product_images WHERE product_id = $1`, [req.params.id], (err, result) => {
            req.images = result.rows
            next()
        })
    },
    getProductKeywordsById: (req, res, next) => {
        pool.query(`SELECT * FROM keywords WHERE product_id = $1`, [req.params.id], (err, result) => {
            let keywords = ''
            result.rows.forEach(row => keywords += `${row.keyword}, `)
            req.keywords = keywords.slice(0, -2)
            next()
        })
    },
    updateProduct: (req, res, next) => {
        pool.query(`SELECT updateProduct($1, $2, $3, $4, $5)`,
            [req.params.id, req.body.name, req.body.description, req.body.quantity || null, req.body.price],
            (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    getAllProducts: (req, res, next) => {
        pool.query(`SELECT * FROM products ORDER BY RANDOM()`, (err, result) => {
            req.products = result.rows
            next()
        })
    },
    getAllProductImages: (req, res, next) => {
        pool.query(`SELECT * FROM product_images
                    INNER JOIN products p on p.id = product_images.product_id`, (err, result) => {
            req.images = result.rows
            next()
        })
    },
    getAllProductCategories: (req, res, next) => {
        pool.query(`SELECT c.id, category from categories c
                    INNER JOIN products_categories pc on c.id = pc.category_id`,
            (err, result) => {
                req.categories = result.rows
                next()
            })
    },
    getRecommendedProducts: (req, res, next) => {
        pool.query(`SELECT * FROM recommendedProducts($1)`, [req.params.id], (err, result) => {
            if (err) console.log(err)
            req.recommendedProducts = result.rows
            req.recommendedProductsIDs = result.rows.map(product => product.id)
            next()
        })
    },
    getRecommendedProductsImages: (req, res, next) => {
        let productIDs = ``
        req.recommendedProductsIDs.forEach(id => productIDs += `${id},`)
        productIDs = productIDs.slice(0, -1)
        if (productIDs === '') productIDs = 0
        pool.query(`SELECT * FROM product_images WHERE product_id in (${productIDs})`, (err, result) => {
            if (err) console.log(err)
            req.recommendedImages = result.rows
            next()
        })
    },
    deleteProduct: (req, res, next) => {
        pool.query(`SELECT deleteProduct($1)`, [req.params.productId], (err, response) => {
            if (err) console.log(err)
            next()
        })
    },
    updateProductImages: async (req, res, next) => {
        let img1 = null, img2 = null, img3 = null
        if (!req.files) {
            req.message = 'Niste odabrali sliku'
            return next()
        }
        if (req.files.img1) {
            img1 = await upload(util.dataUri(req.files.img1.name, req.files.img1.data))
            img1 = img1.secure_url
        }
        if (req.files.img2) {
            img2 = await upload(util.dataUri(req.files.img2.name, req.files.img2.data))
            img2 = img2.secure_url
        }
        if (req.files.img3) {
            img3 = await upload(util.dataUri(req.files.img3.name, req.files.img3.data))
            img3 = img3.secure_url
        }
        pool.query(`SELECT updateProductImages($1, $2, $3, $4)`, [req.params.productId, img1, img2, img3],
            (err, result) => {
                if (err) console.log(err)
                req.message = 'Promjene spašene'
                next()
            })
    },
    addNewProductReview: (req, res, next) => {
        pool.query(`INSERT INTO product_reviews (store_id, product_id, user_id, rating, comment, date_time) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [req.params.storeId, req.params.productId, req.params.userId, req.body.rating, req.body.comment], (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    getProductReviews: (req, res, next) => {
        pool.query(`SELECT * FROM product_reviews
        INNER JOIN users u on u.id = product_reviews.user_id
        WHERE product_id = $1`, [req.params.productId], (err, result) => {
            if (err) console.log(err)
            req.reviews = result.rows
            next()
        })
    },
    getPopularProducts: (req, res, next) => {
        pool.query(`SELECT * FROM getProductsByPopularity()`, (err, result) => {
            if (err) console.log(err)
            req.popularProducts = result.rows
            req.popularProductsIDs = result.rows.map(product => product.id)
            next()
        })
    },
    getPopularProductsImages: (req, res, next) => {
        let productIDs = ``
        req.popularProductsIDs.forEach(id => productIDs += `${id},`)
        productIDs = productIDs.slice(0, -1)
        if (productIDs === '') productIDs = 0
        pool.query(`SELECT * FROM product_images WHERE product_id in (${productIDs})`, (err, result) => {
            if (err) console.log(err)
            req.popularImages = result.rows
            next()
        })
    },
    checkIfCouponExists: (req, res, next) => {
        pool.query(`SELECT * FROM coupons WHERE coupon = $1`, [req.params.coupon], (err, result) => {
            if (err) console.log(err)
            req.coupon = result.rows[0]
            next()
        })
    },
    getCoupons: (req, res, next) => {
        pool.query(`SELECT * FROM coupons`, (err, result) => {
            if (err) console.log(err)
            req.coupons = result.rows
            next()
        })
    },
    followProduct: (req, res, next) => {
        pool.query(`INSERT INTO product_follows (user_id, product_id) VALUES ($1, $2)`,
            [req.params.userId, req.params.productId], (err, result) => {
                if (err) console.log(err)
                next()
            })
    },
    notifyChanges: (req, res, next) => {
        pool.query(`SELECT * FROM didProductChangePrice($1, $2) AS res`, [req.params.id, req.body.price], (err, result) => {
            if (err) console.log(err)
            if (result.rows[0].res) {
                pool.query(`SELECT pf.user_id, u.name u_name, u.email, pf.product_id, p.name p_name, p.price FROM product_follows pf 
                            INNER JOIN users u ON u.id = pf.user_id
                            INNER JOIN products p ON p.id = pf.product_id
                            WHERE product_id =  $1`, [req.params.id], (err, result) => {
                    if (err) console.log(err)
                    const users = result.rows
                    users.forEach(user => {
                        email.productPriceChanged(user.email, user.user_id, user.product_id, user.p_name, user.price, req.body.price)
                    })
                })
            }
            next()
        })
    },
    unsubscribeFromProduct: (req, res, next) => {
        pool.query(`DELETE FROM product_follows WHERE product_id = $1 AND user_id = $2`,
            [req.params.productId, req.params.userId], (err, result) => {
                if (err) console.log(err)
                next()
            })
    }
}

module.exports = products