const mongoose              = require("mongoose")
      passport              = require("passport")
      passportLocalMongoose = require("passport-local-mongoose")

      UserSchema = new mongoose.Schema({
          username: String,
          password: String,
          role: {
              type: String,
              enum: ['admin', 'user', 'trainer'],
              default: 'user'
          },
          resetPasswordToken: String,
          resetPasswordExpires: Date
      })

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', UserSchema)