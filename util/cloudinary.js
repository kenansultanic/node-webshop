const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: 'dotbacugu',
    api_key: '626817565272597',
    api_secret: 'zP0OVp60aTGqjVNcwh3ri3K5VCE'
})

const upload = async file => {
    return await cloudinary.uploader.upload(file, {
        folder: 'products',
        //width: 300,
        //crop: 'scale'
    })
}

module.exports = upload