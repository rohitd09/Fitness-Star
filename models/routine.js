const mongoose = require('mongoose')

const RoutineSchema = new mongoose.Schema({
    routine_name: String,
    routine_author_name: String,
    routine_author_email: String,
    video: String
})

module.exports = mongoose.model('Routine', RoutineSchema)