const mongoose = require('mongoose')

const PlanSchema = new mongoose.Schema({
    plan_name: String,
    plan_description: String,
    image: String,
    gender_category: {
        type: String,
        enum: ['Male', 'Female', 'Both']
    },
    plan_author: String,
    plan_author_email: String,
    routines: {
        type: Array,
        default: []
    },
    number_of_routines: Number
})

module.exports = mongoose.model('Plan', PlanSchema)