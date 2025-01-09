const { Sequelize } = require('sequelize');
const dbConfig = require('./dbConfig');

const sequelize = new Sequelize(dbConfig.DATABASE, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.DIALECT,
});

module.exports = sequelize;