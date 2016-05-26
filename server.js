'use strict'

const app = require('./config/setup')()
require('./config/db') // delcares User schema
require('./config/session')(app)
const User = require('mongoose').model('User')

const wunderlist = require('./wunderlist')
// const request = require('request-promise')
const urlLib = require('url')

function title_maker (s) {
  return `${s} - Publists`
}

// ROUTES
app.get('/', (req, res) => {
  res.render('index', {title: title_maker('Index')})
})

app.get('/faq', (req, res) => {
  res.render('faq', {title: title_maker('FAQs')})
})

app.get('/login', (req, res) => {
  let url = urlLib.format({
    protocol: 'https',
    host: 'www.wunderlist.com/oauth/authorize',
    query: {
      client_id: process.env.WUNDERLIST_CLIENT_ID,
      redirect_uri: 'https://51b21747.ngrok.io/callback',
      state: 'california' // i'm funny this'll either be a secret or uid or something?
    }
  })
  res.redirect(url)
})

app.get('/logout', (req, res) => {
  req.session.user = undefined
  res.redirect('/')
})

app.get('/profile', (req, res) => {
  if (req.session.user) {
    res.redirect(`/user/${req.session.user.wid}/lists`)
  } else {
    // is there a way to pass on profile as destination?
    res.redirect('/login')
  }
})

app.get('/callback', (req, res) => {
  let code = req.query.code
  // console.log(code)
  if (req.query.state === 'california') {
    // console.log('in callback inner!')
    wunderlist.getAuthedUser(code).then((results) => {
      // console.log('posted for access', results)
      return User.login(results[0].access_token, results[1].id, results[1].name)
    }).then((user) => {
      req.session.user = user
      res.redirect('/')
    }).catch((err) => {
      // this could be a mongo or wunderlist error
      console.log('err', err)
      res.status(500).send({status: err.code, message: err.message})
    })
  } else {
    console.log('bad user?')
    res.sendStatus(500)
  }
})

app.post('/update', (req, res) => {
  if (!req.session.user) {
    res.status(401).send({message: 'No session exists'})
  } else {
    User.findOneAndUpdate({
      wid: req.session.user.wid
    }, {
      public_lists: req.body.public_lists
    }, {
      new: true,
      runValidators: true
    }).then((u) => {
      // console.log('postsave', u)
      req.session.user = u
      // console.log('saved!', req.session.user.public_lists)
      res.sendStatus(200)
    }).catch((err) => {
      console.log('err', err)
      res.status(500).send({message: err.toString()})
    })
  }
})

app.get('/user/:wid/lists', (req, res) => {
  User.findOne({wid: req.params.wid}).then((user) => {
    // console.log(user)
    // only need the promise array because i'm houisting the variable
    return Promise.all([user, wunderlist.fetch_lists(user.access_token)])
  }).then((results) => {
    // [user, lists]
    let public_lists = results[1].filter((list) => {
      return results[0].public_lists[list.id]
    })

    res.render('lists', {
      wid: req.params.wid,
      lists: public_lists,
      name: results[0].name,
      title: title_maker(`${results[0].name}'s lists`)
    })
  }).catch((err) => {
    if (err.statusCode === 404) {
      res.status(404).send('list not found or not public')
    } else {
      res.status(500).send({error: err.toString()})
    }
  })
})

app.get('/user/:wid/lists/:lid', (req, res) => {
  let u
  User.findOne({wid: req.params.wid}).then((user) => {
    if (user.public_lists[req.params.lid] === true) {
      // console.log('yeppin')
      u = user
      return wunderlist.fetch_tasks_with_items(req.params.lid, user.access_token)
    } else {
      return Promise.reject({code: 404})
    }
  }).then((results) => {
    res.render('list', {
      user: u,
      list: results[0],
      tasks: results[1],
      title: title_maker(results[0].title)
    })
  }).catch((err) => {
    if (err.code === 404) {
      res.status(404).send('list not found or not public')
    } else {
      console.log(err)
      res.status(500).send({error: err.toString()})
    }
  })
})

app.get('/api/lists', (req, res) => {
  // console.log('pre', req.session.user)
  if (!req.session.user) {
    res.status(401).send('Unauthenticated')
  } else {
    wunderlist.fetch_lists(req.session.user.access_token).then((lists) => {
      // console.log('post', req.session.user)
      res.send({
        lists: lists,
        public_lists: req.session.user.public_lists
      })
    }).catch((err) => {
      console.log(err.message)
      res.send(err)
    })
  }
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send(err)
})

app.use((req, res, next) => {
  res.status(404).send('url not found!')
})

const server = app.listen(app.get('port'), () => {
  console.log(`App listening on port ${server.address().port}`)
  console.log(`Production mode ${app.get('production') ? '' : 'not'} enabled.`)
})
