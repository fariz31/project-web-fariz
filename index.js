const express = require ('express')
const bcrypt = require ('bcrypt')
const flash = require ('express-flash')
const session = require ('express-session')
const db = require('./connection/db')
const upload = require('./middlewares/uploadFile')
const app = express()
const port = 5001




app.set('view engine', 'hbs')
app.use('/public', express.static(__dirname + '/public'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.urlencoded({ extended: false }))
app.use(flash())

app.use(
    session({
        cookie: {
            maxAge: 1000 * 60 * 60 * 2,
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: "secretValue"
    })
)


const month = [
    'January',
    'Februari',
   'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember']







app.get('/', function (req, res) {
    res.render('index')
})

app.get('/home', function (req, res) {


    res.render('index', {
        isLogin: req.session.isLogin,
        user: req.session.user,
    })
})



//atas//switch code server-database
////// Endpoint-Project
///// ADD DATA PROJECT
app.get('/project', function (req, res) {
    
    let query = `SELECT tb_user.name, image, tb_projects.id, tb_projects.name, description, post_at FROM tb_projects
                LEFT JOIN tb_user ON tb_user.id = tb_projects.author_id 
                ORDER BY id DESC`
    
    db.connect(function(err, client, done) {
        if (err) throw err

        client.query(query, function(err, result) {
            done()

            if (err) throw err

            let data = result.rows
            
            data = data.map((project) => {
                return {
                    ...project,
                    post_at: getFullTime(project.post_at),
                    post_age: getDistanceTime(project.post_at),
                    isLogin: req.session.isLogin
                }
            })

            res.render('project', 
                {isLogin: req.session.isLogin,
                user: req.session.user,
                projects: data
            })

        })
    })

})

//bawah
// GET PROJECT POST FORM DATA USING POST ROUTING
// CREATING BLOG POST WITH ARRAY PUSH
// REFETCH BLOG DATA
app.post('/project', upload.single('image') , function (req,res) {
    let projectname = req.body.projectname
    let startdate = req.body.startdate
    let enddate = req.body.enddate
    let description = req.body.description
    let technology = req.body.skill
    let image = req.body.image

    let project = {
        projectname: projectname,
        startdate: startdate,
        enddate: enddate,
        description: description,
        technology: technology,
        image: req.file.filename,
        author_id: req.session.user.id
    }
    
    db.connect((err, client, done) => {
        query = `INSERT INTO tb_projects (name, description, image, start_date, end_date, author_id)
                VALUES ('${project.projectname}', '${project.description}', '${project.image}', '${project.startdate}', '${project.enddate}', '${project.author_id}')`

        if (err) throw err

        client.query(query, (err, result) => {
            done()
            if (err) throw err
            res.redirect('/project')
        })
    })
    

})

app.get('/project-detail', function (req, res) {
    res.render('project-detail')
})

//  QUERY STRING FOR BLOG DETAIL
app.get('/project/:id', function (req,res) {
    let id = req.params.id
     let query = `SELECT * FROM tb_projects WHERE id = ${id}`
     db.connect((err, client, done) => {
         if (err) throw err

         client.query(query, (err, result) => {
             done()
             if (err) throw err
             result = result.rows[0]
             
             res.render('project-detail', { project: result})
         })
     })
    
    
})

// DELETE BLOG POST DATA ARRAY OF OBJECT WITH SPLICE
app.get('/delete-project/:id', function (req,res) {
    let { id } = req.params
    
    let query = `DELETE FROM tb_projects WHERE id = ${id}`

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(query, (err, result) => {
            done()
            if (err) throw err

            res.redirect('/project')
        })
    })

})

app.get('/update-project/:id', function (req, res) {

    let { id } = req.params
    
    let query = `SELECT FROM tb_projects WHERE id = ${id}`

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(query, (err, result) => {
            done()
            if (err) throw err

            result = result.rows[0]

            res.render('update-project', {project: result})
        })
    })

    
})

app.post('/update-project/:id', function (req,res) {
    let { id } = req.params
    let {projectname, startdate, enddate, description} = req.body

    let query = `UPDATE tb_projects SET name='${projectname}', start_date='${startdate}',
                end_date='${enddate}', description='${description}' WHERE id=${id}`

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(query, (err, result) => {
            done()
            if (err) throw err
            res.redirect('/project')
        })
    })
})

app.get('/add-project', function (req, res) {

    if (!req.session.isLogin) {
        res.redirect('/home')
    }
    res.render('form-project')
})

app.get('/contact-me', function (req, res){
    res.render('contact')
})

app.get('/register', function (req, res) {
    res.render('register')
})

app.post('/register', function (req, res) {
    let { name, email, password} = req.body

    const hashPassword = bcrypt.hashSync(password, 10)

    db.connect((err, client, done) => {
        if (err) throw err

        let query = `INSERT INTO tb_user(name, email, password) VALUES
                        ('${name}','${email}','${hashPassword}')`

        client.query(query, (err, result) => {
            done()
            if (err) throw err

            req.flash('success', 'registration success')
            res.redirect('/login')
        })
    })
    
})

app.get('/login', function (req, res) {
    res.render('login')
})

app.post('/login', function (req, res) {
    let { email, password } = req.body

    db.connect((err, client, done) => {
        if (err) throw err
        let query = `SELECT * FROM tb_user WHERE email='${email}'`

        client.query(query, (err, result) => {
            done()
            if (err) throw err

            if (result.rowCount == 0) {
                req.flash('danger', 'email and password doesnt match')
                return res.redirect('/login')
            }

            let isMatch = bcrypt.compareSync(password, result.rows[0].password)

            if (isMatch) {
                req.session.isLogin = true
                req.session.user = {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    name: result.rows[0].name
                }

                console.log(req.session.user);

                req.flash('success', 'Login Success')
                res.redirect('/project')
            } else {
                req.flash('danger', 'email and password doesnt match')
                res.redirect('/login')
            }
        })
    })


})

app.get('/logout', function (req, res) {
    req.session.destroy()
    res.redirect('/home')
})








app.listen(port, function() {
    console.log(`app berjalan di port: ${port}`)
})

function getFullTime(time) {
    const date = time.getDate()
    const monthIndex = time.getMonth()
    const year = time.getFullYear()
    let hours = time.getHours()
    let minutes = time.getMinutes()
  
   if ( hours < 10) {
       hours = `0${hours}`
   }

   if ( minutes < 10) {
       minutes = `0${minutes}`
   }

    return `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`
  }

  function getDistanceTime(time) {
    const distance = new Date() - new Date(time)
  
    const milisecond = 1000
    const secondInMinute = 60
    const minutesInHour = 60
    const secondsInHour = secondInMinute * minutesInHour
    const hoursInDay = 23
  
    let dayDistance =distance / (milisecond * secondsInHour * hoursInDay)
  
    if (dayDistance >= 1) {
      const time = Math.floor(dayDistance) + ' day ago'
      return time}
      else {
      //convert to hour
      let hourDistance = Math.floor(distance/ (milisecond * secondsInHour))
  
      if (hourDistance > 0) {
        return hourDistance + ' hour ago'
      } else {
        //convert to minute
        const minuteDistance = Math.floor(distance/ (milisecond * secondInMinute))
        return minuteDistance + ' minute ago'
      }
    }
  
    
  }