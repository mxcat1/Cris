const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

//Modelo usuario

const User = sequelize.define("User",{
    id_user:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true,
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:false,
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,
    },
    password:{
        type: DataTypes.STRING,
        allowNull:false,
    },
    id_role:{
        type: DataTypes.INTEGER,
        allowNull:true,
        defaultValue:3,
        references:{
            model:'roles',
            key:'id_role'
        },
        onDelete:'CASCADE',

    },

});

module.exports = User;