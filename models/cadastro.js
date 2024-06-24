const db = require('./db');


const Cadastro = db.sequelize.define('cadastros', {
    usuario: {
        type: db.Sequelize.STRING
    },
    senha: {
        type: db.Sequelize.STRING
    }
});

module.exports = Cadastro;
