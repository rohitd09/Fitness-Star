const express        = require("express")
const routine = require("./models/routine")
      bodyParser     = require("body-parser")
      mongoose       = require("mongoose")
      flash          = require("connect-flash")
      passport       = require("passport")
      LocalStrategy  = require("passport-local")
      methodOverride = require("method-override")
      multer         = require("multer")
      path           = require("path")
      
      app            = express()

      User           = require('./models/users')
      Routine        = require('./models/routine')
      Plan          = require('./models/plan')

      middleware    = require('./middleware')

      storage        = multer.diskStorage({
          destination: './public/uploads',
          filename: (req, file, cb)=>{
              cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname))
          }
      })

      upload        = multer({
          storage: storage
      }).single('image')

mongoose.connect('mongodb://localhost/fitness_star', {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('useCreateIndex', true)
mongoose.set('useFindAndModify', false)

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'))
app.use(methodOverride('_method'))
app.use(flash())

app.use(require('express-session')({
    secret: 'Option',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next)=>{
  res.locals.currentUser = req.user
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  if(req.query._method == 'DELETE'){
    req.method = "DELETE"
    req.url = req.path
  } else if(req.query._method == 'PUT'){
    req.method = "PUT"
    req.url = req.path
  }
  next()
})

app.get("/", (req, res)=>{
  Plan.find({}, (err, plans)=>{
    res.render('index', {plans: plans})
  })
})

app.get("/all_plans", (req, res)=>{
  Plan.find({}, (err, plans)=>{
    if(err){
      console.log(err);
      res.render("/")
    } else {
      res.render("plan_lists/all_plans", {plans: plans})
    }
  })
})

app.get("/start_plan/:id", middleware.isLoggedIn, (req, res)=>{
  Plan.findById(req.params.id, (err, plans)=>{
    if(err){
      console.log(err);
      req.flash("error", "Something went wrong, please try again later")
      res.redirect("/all_plans")
    } else {
      first_routine = plans.routines[0]
      res.redirect("/start_plan/" + req.params.id + "/routine/" + first_routine)
    }
  })
})

app.get("/start_plan/:plan/routine/:routine", middleware.isLoggedIn, (req, res)=>{
  Plan.findById(req.params.plan, (err, plans)=>{
    if(err){
      console.log(err);
      res.redirect("/plan/" + req.params.plan)
    } else {
      Routine.findById(req.params.routine, (err, routine)=>{
        if(err){
          console.log(err);
          res.redirect("/plan" + req.params.plan)
        } else {
          currentRoutine = req.params.routine
          res.render("plan_lists/start_plan", {plans: plans, routine: routine, currentRoutine: currentRoutine})
        }
      })
    }
  })
})

app.get("/plan/:id", (req, res)=>{
  Plan.findById(req.params.id, (err, plans)=>{
    if(err){
      console.log(err);
      res.redirect("/all_plans")
    } else {
      res.render("plan_lists/plan_page", {plans: plans})
    }
  })
})

app.get("/preview/:id", middleware.isLoggedIn, (req, res)=>{
  Routine.findById(req.params.id, (err, preview)=>{
    if(err){
      console.log(err);
      req.flash("error", "Preview could not be played, please try again")
      res.redirect("/trainer_room")
    } else {
      res.render("preview/preview", {preview: preview})
    }
  })
})

app.get("/trainer_room", middleware.isTrainer, (req, res)=>{
  Plan.find({"plan_author_email": req.user.username}, (err, plans)=>{
    if(err){
      console.log(err);
      req.flash("error", "There was an error, please refresh the page and try again!!")
      res.redirect("/trainer_room")
    } else {
      Routine.find({"routine_author_email": req.user.username}, (err, routines)=>{
        if(err){
          console.log(err);
          req.flash("error", "There was an error, please refresh the page and try again!!")
          res.redirect("/")
        } else {
          res.render("trainer_room/track_plans", {plans: plans, routines: routines})
        }
      })
    }
  })
})

app.get("/trainer_room/add_plans", middleware.isTrainer, (req, res)=>{
  res.render("trainer_room/add_plans")
})

app.post("/trainer_room/add_plans", middleware.isTrainer, (req, res)=>{
  upload(req, res, (err)=>{
    if(err){
      req.flash("error", "Oops! Something went wrong!!")
      return res.redirect("/trainer_room/add_plans")
    } else {
      var addPlan = new Plan({
        plan_name: req.body.plan_name,
        gender_category: req.body.gender_category,
        plan_author: req.body.author_name,
        plan_author_email: req.body.author_email,
        plan_description: req.body.plan_description,
        number_of_routines: 0,
        image: req.file.filename
      })

      Plan.create(addPlan, (err, newPlanAdded)=>{
        if(err){
          console.log(err);
          req.flash("error", "Data not inserted in Database, please try again")
          return res.redirect("/trainer_room")
        } else {
          req.flash("success", "Plan added Successfully")
          return res.redirect("/trainer_room")
        }
      })
    }
  })
})

app.get("/trainer_room/add_routine", middleware.isTrainer, (req, res)=>{
  res.render("trainer_room/add_routines")
})

app.post("/trainer_room/add_routine", middleware.isTrainer, (req, res)=>{
  upload(req, res, (err)=>{
    if(err){
      req.flash("error", "Oops! Something went wrong!!")
      return res.redirect("/trainer_room/add_routine")
    } else {
      var addRoutine = new Routine({
        routine_name: req.body.routine_name,
        routine_author_name: req.body.author_name,
        routine_author_email: req.body.author_email,
        video: req.file.filename
      })

      Routine.create(addRoutine, (err, newRoutineAdded)=>{
        if(err){
          console.log(err);
          req.flash("error", "Data not inserted in Database, please try again")
          return res.redirect("/trainer_room")
        } else {
          req.flash("success", "Routine Added Successfully")
          return res.redirect("/trainer_room")
        }
      })
    }
  })
})

app.get("/trainer_room/:id", middleware.isTrainer, (req, res)=>{
  Plan.findById({"_id": req.params.id}, (err, plans)=>{
    if(err){
      console.log(err);
      req.flash("error", "Something went wrong, please try again later")
      res.redirect("/trainer_room")
    } else {
      Routine.find({}, (err, allRoutine)=>{
        if(err){
          console.log(err);
          req.flash("error", "Something went wrong, please try again later")
          res.redirect("/trainer_room")
        } else {
          res.render("trainer_room/edit_plans", {plans: plans, allRoutine: allRoutine})
        }
      })
    }
  })
})

app.delete("/trainer_room/:id", middleware.isTrainer, (req, res)=>{
  Plan.deleteOne({"_id": req.params.id}, (err, deleted)=>{
    if(err){
      console.log(err);
      req.flash("error", "Plan could not be deleted, please try again later")
      res.redirect("/trainer_room")
    } else {
      req.flash("success", "Plan Deleted Successfully")
      res.redirect("/trainer_room")
    }
  })
})

app.put("/trainer_room/:id", middleware.isTrainer, (req, res)=>{
  var plan_name         = req.body.plan_name
      gender_category   = req.body.gender_category
      plan_author       = req.body.plan_author
      plan_author_email = req.body.plan_author_email
      plan_description  = req.body.plan_description
  Plan.findOneAndUpdate({"_id": req.params.id}, {$set: {plan_name: plan_name, gender_category: gender_category, plan_author: plan_author, plan_author_email: plan_author_email, plan_description: plan_description}}, (err, updated)=>{
    if(err){
      console.log(err);
      req.flash("error", "Plan could not be edited, please try again later")
      return res.redirect("/trainer_room")
    } else {
      req.flash("success", "Plan updated successfully")
      return res.redirect("/trainer_room")
    }
  })
})

app.put("/trainer_room/:plan/adding_routine/:routine", middleware.isTrainer, (req, res)=>{
  Routine.findById({"_id": req.params.routine}, (err, routine)=>{
    if(err){
      console.log(err);
      req.flash("error", "Routine was not added in the Plan, please try again later")
      res.redirect("/trainer_room")
    } else {
      Plan.findOneAndUpdate({"_id": req.params.plan}, {$push: {routines: routine._id}}, (err, updated)=>{
        if(err){
          console.log(err);
          req.flash("error", "Routine was not added in the Plan, please try again later")
          res.redirect("/trainer_room")
        } else {
          Plan.findOneAndUpdate({"_id": req.params.plan}, {$inc: {number_of_routines: 1}}, (err, incremented)=>{
            req.flash("success", "Routine Added to Plan")
            res.redirect("/trainer_room")
          })
        }
      })
    }
  })
})

app.delete("/routine_delete/:routine", middleware.isTrainer, (req, res)=>{
  Routine.deleteOne({"_id": req.params.routine}, (err, deleted)=>{
    if(err){
      console.log(err);
      req.flash("error", "Routine could not be deleted please, try again later.")
      res.redirect("/trainer_room")
    } else {
      req.flash("success", "Routine Deleted succesfully")
      res.redirect("/trainer_room")
    }
  })
})

app.delete("/trainer_room/:plan/removing_routine/:routine", middleware.isTrainer, (req, res)=>{
  Routine.findById({"_id": req.params.routine}, (err, routine)=>{
    if(err){
      console.log(err);
      req.flash("error", "Routine could not be removed from Plan, please try again later")
      res.redirect("/trainer_room")
    } else {
      Plan.findOneAndUpdate({"_id": req.params.plan}, {$pull: {routines: routine._id}}, (err, updated)=>{
        if(err){
          console.log(err);
          req.flash("error", "Routine could not be removed from Plan, please try again later")
          res.redirect("/trainer_room")
        } else {
          console.log(updated);
          Plan.findOneAndUpdate({"_id": req.params.plan}, {$inc: {number_of_routines: -1}}, (err, decremented)=>{
            req.flash("success", "Routine removed from Plan")
            res.redirect("/trainer_room")
          })
        }
      })      
    }
  })
})

app.get("/admin", middleware.isAdmin, (req, res)=>{
  User.find({}).count().exec((err, usersCount)=>{
    if(err){
      console.log(err);
    } else {
      User.find({'role': 'trainer'}).count().exec((err, trainerCount)=>{
        if(err){
          console.log(err);
        } else {
          User.find({$or: [{'role': 'user'}, {'role': 'trainer'}]}, (err, users)=>{
            if(err){
              console.log(err);
            } else {
              Plan.find({}).count().exec((err, plansCount)=>{
                if(err){
                  console.log(err);
                } else {
                  generalUsersCount = usersCount - trainerCount - 1
                  res.render('admin/admin', {plansCount: plansCount, usersCount: usersCount, trainerCount: trainerCount, generalUsersCount: generalUsersCount, users: users})
                }
              })
            }
          })
        }
      })
    }
  })
})

app.put("/admin/:id", (req, res)=>{
  User.findById(req.params.id, (err, users)=>{
    if(err){
      console.log(err);
    } else {
      if(users.role == "user"){
        User.findOneAndUpdate({"_id": req.params.id}, {$set: {"role": "trainer"}}, (err, update)=>{
          if(err){
            console.log(err);
          } else {
            req.flash("success", "User changed to Trainer Successfully")
            res.redirect("/admin")
          }
        })
      } else {
        User.findOneAndUpdate({"_id": req.params.id}, {$set: {"role": "user"}}, (err, update)=>{
          if(err){
            console.log(err);
          } else {
            req.flash("success", "Trainer changed to User Successfully")
            res.redirect("/admin")
          }
        })
      }
    }
  })
})

app.get("/login", (req, res)=>{
    res.render('login')
})

app.post("/login", passport.authenticate("local", {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}), (req, res)=>{})

app.get("/register", (req, res)=>{
    res.render('register')
})

app.post("/register", (req, res)=>{
  var username = req.body.username;
  var password = req.body.password;
  var re_password = req.body.re_password;
  var pattern = (/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/);
  var email_pattern = (/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/);

  if(!email_pattern.test(username)){
    console.log("Invalid Email");
    req.flash("error", "Invalid Email");
    return res.redirect("/register");
  } else if(password != re_password) {
    console.log("Password match");
    req.flash("error", "Password does not match");
    return res.redirect("/register");
  } else if (!pattern.test(password)) {
    console.log("Invalid Password");
    req.flash("error", "Password must contain minimum 8 characters long, atleast one Upper Case, one Lower Case, one Number, and one Special Character");
    return res.redirect("/register");
  } else {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
      if(err){
        console.log(err);
        req.flash("error", err.message);
        return res.redirect("/register");
      }
      passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/register",
        failureFlash: true
      })(req, res);
    });
  }
})

app.get("/logout", (req, res)=>{
    req.logout()
    res.redirect("/")
})

app.listen(3000, ()=>{
    console.log("Server started at Port 3000");
})