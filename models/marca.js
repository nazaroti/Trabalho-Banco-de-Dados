const db = require('./db');


const Marca = db.sequelize.define('marcas', {
    ID: {
        type: db.Sequelize.INTEGER
    },
    Nome: {
        type: db.Sequelize.STRING
    }
});

module.exports = Marca;
