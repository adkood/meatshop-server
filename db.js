const mongoose = require('mongoose');

const db = async () => {
    try {
        console.log(process.env.DB_KEY);
        await mongoose.connect(process.env.DB_KEY.replace('<password>', process.env.DB_PASSWORD))
        console.log('connected to mongoDb');
    } catch(err) {
        console.log(err);
    }

}

module.exports = db;