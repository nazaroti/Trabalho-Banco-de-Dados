const db = require('./db');

const Post = db.sequelize.define('estoqueCerveja', {
    nome: {
        type: db.Sequelize.STRING
    },
    quantidade: {
        type: db.Sequelize.DECIMAL
    },
    Marca_ID:{
        type: db.Sequelize.INTEGER
    }

});


module.exports = Post;
