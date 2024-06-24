const Sequelize = require('sequelize');

// Conexão
const sequelize = new Sequelize('estoqueDa20','root', 'hsnj1308',{
    host: "localhost",
    dialect: 'mysql'
} );

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
};
