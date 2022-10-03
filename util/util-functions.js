const DatauriParser = require('datauri/parser')

const containsCartProducts = (products, id) => {
    let contains = false
    products.forEach(product => {
        if (product.id === id)
            contains = true
    })
    return contains
}

const utilFunctions = {
    randomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    getDefaultStorePfp: () => 'https://res.cloudinary.com/dotbacugu/image/upload/v1661114042/products/udihwliwynzygblrj7fz.jpg',
    getDefaultStoreCover: () => 'https://res.cloudinary.com/dotbacugu/image/upload/v1660306615/products/v56tztfzpdxxfdg0jkki.jpg',
    getDefaultUserPfp: () => 'https://res.cloudinary.com/dotbacugu/image/upload/v1661284483/products/mmznbkckmtx0iighvwpb.jpg',
    parseProducts: (products, images, categories) => {
        const allProducts = []
        products.forEach(product => {
            const tempCategories = categories.filter(category => category.product_id === product.id)
            const tempImages = images.filter(image => image.product_id === product.id)
            allProducts.push({...product, categories: tempCategories, images: tempImages})
        })
        return allProducts
    },
    dataUri: (name, file) => {
        const parser = new DatauriParser()
        return parser.format(name.slice(-4), file).content
    },
    deleteFromCart: (products, id) => products.filter(product => product.id !== id),
    calculateCartPrice: products => {
        let price = 0
        if (!products) return price
        products.forEach(product => {
            price += product.quantity * product.price
        })
        return {price: price, shipping: price >= 100 ? 0 : 5 + products.length}
    },
    addToCart: (cart, product) => {
        if (containsCartProducts(cart, product.id)) {
            cart.map(item => {
                if (item.id === product.id)
                    if (item.size === product.size) {
                        item.price += product.price
                        item.quantity += product.quantity
                        return item
                    }
                return item
            })
        } else cart.push(product)
        return cart
    },
    sortProducts: (products, sortBy) => {
        if (!sortBy)
            return products
        let sorted
        switch (sortBy) {
            case '1':
                sorted = products.sort((a, b) => b.price - a.price)
                break
            case '2':
                sorted = products.sort((a, b) => a.price - b.price)
                break
            default:
                sorted = []
        }
        return sorted
    },
    filterProducts: (products, minPrice, maxPrice) => {
        let min = minPrice, max = maxPrice
        if (!min && !max)
            return products
        if (!min) min = 0
        if (!max) max = Number.MAX_SAFE_INTEGER
        return products.filter(product => product.price >= min && product.price <= max)
    },
    calculateAverageStoreRating: reviews => {
        if (reviews.length === 0) return 0
        let average = 0
        reviews.forEach(review => average += review.rating)
        return average / reviews.length
    },
    orderStores: (stores, orderBy) => {
        if (orderBy === 1)
            return stores.sort((s1, s2) => s1.localeCompare(s2))
        if (orderBy === 2)
            return stores.sort((s1, s2) => -s1.localeCompare(s2))
        return stores
    },
    parseChatUsers: (users, images) => {
        const result = []
        users.forEach(user => {
            const pfpUrl = images.find(image => image.store_id === user.id)
            if (pfpUrl)
                result.push({...user, pfp_url: pfpUrl})
            else result.push({
                ...user,
                pfp_url: 'https://res.cloudinary.com/dotbacugu/image/upload/v1661284483/products/mmznbkckmtx0iighvwpb.jpg'
            })
        })
        return result
    }
}


module.exports = utilFunctions