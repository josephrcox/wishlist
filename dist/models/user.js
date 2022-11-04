const mongoose = require('mongoose')

const historySchema = new mongoose.Schema({
    user: {type:String, required:true},
    action: {type: String, required: true},
    part: {type: String, required: true},
    date: {type: Date, default: Date.now}
});

const itemSchema = new mongoose.Schema({
    name: {type: String, required: true},
    link: {type: String, required: false},
    purchased_by: {type: String, required: false},
    history: {type: Array, required: false},
});

const userSchema = new mongoose.Schema(
    {
        name:{type:String, required:true},
        email:{type:String, required:true},
        items:[itemSchema]
    },
    { collection: 'users', timestamps:true}
)

const User = mongoose.model('userSchema', userSchema)

module.exports = User
