module.exports = {
    mongoURI: 'mongodb://kaushik:K123456@ds163354.mlab.com:63354/devsocial',
    secretOrKey: 'secret'
}

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./keys_prod')
} else {
    module.exports = require('./keys_dev')
}