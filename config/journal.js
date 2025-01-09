const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Journal = sequelize.define('Journal', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    issn: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Add unique constraint
    },
    publisher: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ranking: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    discipline: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    journalHome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'journals',
});

module.exports = Journal;