const stringSimilarity = require("string-similarity")

const search = {
    searchForStoreProducts: (searchQuery, products) => {
        const result = []
        products.forEach(product => {
            const categories = product.categories.map(category => category.category)
            const nameSimilarity = stringSimilarity.compareTwoStrings(searchQuery, product.name)
            const mostSimilarKeyword = stringSimilarity.findBestMatch(searchQuery, product.keywords.split(',')).bestMatch
            const mostSimilarCategory = stringSimilarity.findBestMatch(searchQuery, categories).bestMatch
            const bestMatch = Math.max(nameSimilarity, mostSimilarKeyword.rating, mostSimilarCategory.rating)
            result.push({rating: bestMatch, product: product})
            result.sort((a, b) => b.rating - a.rating)
            return result.map(obj => obj.product)
        })
    }
}

module.exports = search