const pool = require('../database/database')
const util = require('../util/util-functions')

const chat = {
    getUserMessages: (req, res, next) => {
        pool.query(`SELECT m.sender, m.receiver, m.message, m.timestamp
                     FROM messages m
                     INNER JOIN users u ON u.id = m.receiver
                     WHERE (sender = $1 AND receiver = $2)
                        OR (sender = $2 AND receiver = $1)
                     ORDER BY m.timestamp`, [req.params.sender, req.params.receiver],
            (err, result) => {
                if (err) console.log(err)
                req.messages = result.rows
                next()
            })
    },
    getUserChats: (req, res, next) => {
      pool.query(`SELECT * FROM getUserChats($1)`, [req.params.sender], (err, result) => {
          if (err) console.log(err)
          req.chats = result.rows
          next()
      })
    },
    getChatUsersImages: (req, res, next) => {
        let IDs = ''
        req.chats.forEach(chat => {
            IDs += `${chat.contact_id},`
        })
        IDs = IDs.slice(0, -1)
        if (req.chats.length === 0)
            IDs = 0
        pool.query(`SELECT store_id, pfp_url FROM store_info WHERE store_id IN (${IDs})`, (err, result) => {
            if (err) console.log(err)
            req.images = result.rows
            next()
        })
    },
    getReceiverInfo: (req, res, next) => {
        pool.query(`SELECT *, (SELECT pfp_url FROM store_info WHERE store_id = $1) pfp_url FROM users WHERE id = $1`,
            [req.params.receiver], (err, result) => {
                if (err) console.log(err)
                req.receiver = result.rows[0]
                if (!req.receiver.pfp_url)
                    req.receiver.pfp_url = util.getDefaultUserPfp()
                req.receiver.cover_url = util.getDefaultStoreCover()
                next()
            })
    },
    saveMessage: (req, res, next) => {
        pool.query(`INSERT INTO messages (sender, receiver, message, timestamp) VALUES ($1, $2, $3, NOW())`,
            [req.params.sender, req.params.receiver, req.body.message], (err, result) => {
                if (err) console.log(err)
                next()
            })
    }
}

module.exports = chat