const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dws.webshop@gmail.com',
        pass: 'jszoaanxkrgvxtlj'
    }
})

const email = {
    passwordRestart: (code, email) => {
        const mailOptions = {
            from: 'dws.webshop@gmail.com',
            to: email,
            subject: 'Promjena lozinke',
            text: `Vaš kod za promjenu lozinke je ${code}`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log(error)
        })
    },
    userOrderCreated: (email, orderId) => {
        const mailOptions = {
            from: 'dws.webshop@gmail.com',
            to: email,
            subject: 'Nova narudžba',
            text: `Kreirana nova narudžba u vaše ime, redni broj narudžbe je ${orderId}`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log(error)
        })
    },
    userOrderStatusUpdated: (email, orderId, status) => {
        let orderStatus
        if (status === 'accepted')
            orderStatus = 'Vaša narudžba je prihvaćena'
        else if (status === 'denied')
            orderStatus = 'Vaša narudžba je odbijena'
        else orderStatus = 'Vaša narudžba je isporučena'
        const mailOptions = {
            from: 'dws.webshop@gmail.com',
            to: email,
            subject: 'Promjena statusa narudžbe',
            text: `Promjena statusa narudžbe pod rednim brojem ${orderId}. ${orderStatus}.`
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log(error)
        })
    },
    productPriceChanged: (email, userId, productId, productName, oldPrice, newPrice) => {
        const mailOptions = {
            from: 'dws.webshop@gmail.com',
            to: email,
            subject: 'Promjena cijene proizvoda',
            text: `Promjena cijene proizvoda ${productName} sa ${oldPrice}€ na ${newPrice}€.
            \nAko više ne želite da primate obaviještenja o promjeni cijene ovog proizvoda, kliknite na sljedeći link:
            \nhttp://localhost:3000/user/unsubscribe-from-product/${productId}/${userId}`
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log(error)
        })
    }
}

module.exports = email