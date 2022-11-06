if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const { response } = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const cookieParser = require('cookie-parser')

app.use(cookieParser())

app.set('view engine', 'ejs')
app.set('views',path.join(__dirname, '/views'))
app.set('layout', 'layouts/layout')

app.use(express.static(path.join(__dirname, '../../../')));
app.set('views',path.join(__dirname, '../../', '/views'))

app.use(expressLayouts)
const bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(bodyParser.text({ limit: '200mb' }));
app.use(express.json())

const mongoose = require('mongoose')
mongoose.connect(process.env.DATEBASE_URL, {
	
})
const connection = mongoose.connection;

connection.once("open", function(res) {
	console.log("Connected to Mongoose!")
	connectedToDB = true
}); 

const User = require('../../models/user')

// Document routes
app.get('/', (req,res) => {
  try {
    let token = req.cookies.token;
    let user_token;
    try {
      user_token = jwt.verify(token, JWT_SECRET);
    } catch(err) {
      res.redirect('/login')
    }

    if (user_token) {
      User.findById(user_token.id, (err, user) => {
        if (err || !user) {
          res.redirect('/login')
        } else {
          let items = user.items;
          res.render('home.ejs');
        }
      })
    } else {
      console.log('no token')
      res.redirect('/login')
    }
  } catch(err) {
    console.log(err)
    res.redirect('/login')
  }


})
app.get('/login', (req,res) => {
  res.render('login.ejs')
})

// Login routes
app.post('/api/auth/login', async (req,res) => {
  let body = JSON.parse(req.body)
  let user = await User.findOne({name: body.name, email: body.email});
  if (user) {
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name
      },
      JWT_SECRET, { expiresIn: "30days"}
    )

    res.cookie("token", token, {
        httpOnly: true
    })
      
    return res.json({ status: 'ok', success: true, code: 200, data: token })
  } else {
    // new user, check, and create the account
    // check if the string is only letters
    let regex = /^[A-Za-z]+$/;
    if (body.name.match(regex)) {
      console.log("name passes regex")
      user = await User.create({
        name: body.name,
        email: body.email,
        items: []
      });
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name
        },
        JWT_SECRET, { expiresIn: "30days"}
      )
  
      res.cookie("token", token, {
          httpOnly: true
      })
        
      return res.json({ status: 'ok', success: true, code: 200, data: token, email: body.email })
    } else {
      console.log("name fails regex")
      return res.json({ status: 'ok', success: false, code: 200, data: "name fails regex" })
    }

  };
});

app.post('/api/auth/logout', (req,res) => {
  res.cookie('token', '', { maxAge: 1 })
	res.redirect('/')
})

// Logic routes
app.post('/api/item/create', async (req,res) => {
  let body = (req.body)
  let token = req.cookies.token;
  let user_token = jwt.verify(token, JWT_SECRET);
  console.log(user_token)
  
  // check if link is legit
  var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
  var regex = new RegExp(expression);
  if (!body.link.match(regex)) {
    body.link = ""
  }

  // check if name is legit
  if (body.name.length < 1  || body.name.length > 50) {
    return res.json({success: false, code: 400, message: "Name must be between 1 and 50 characters"})
  }

  try {
    let user = await User.findById(user_token.id);
    if (user) {
      user.items.push({
        name: body.name,
        link: body.link,
        purchased_by:"",
      });
      await user.save();
      // await setHistory(user.items[user.items.length-1].id, body.token, "created", "item", body.token);
      res.json({
        success: true,
        item: user.items[user.items.length - 1]
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }
  
});

app.get('/api/items/get', async (req,res) => {
  try {
    let token = req.cookies.token;
    let user_token = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(user_token.id);

    let items_array = [];
    let scrubbed_items = [];
    for (let i=0; i<user.items.length; i++) {
      scrubbed_items.push(user.items[i])
      scrubbed_items[i].purchased_by = "";
    }
    items_array.push([user_token.name, user.items, true, user_token.id]);
    user.friends = uniq_fast(user.friends)
    await user.save();

    for (let i = 0;i < user.friends.length;i++) {
      let friend = await User.findById(user.friends[i]);
      if (friend) {
        items_array.push([friend.name, friend.items, false, friend.id]);
        friend.friends = uniq_fast(friend.friends)
        await friend.save();
      } else {
        console.log("friend not found")
        user.friends.splice(i, 1);
        await user.save();
      }

    }

    if (user) {
      res.json({
        success: true,
        items: items_array, 
        your_email: user.email
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }
  
})

app.post('/api/item/delete', async (req,res) => {
  let body = JSON.parse(req.body)
  try {
    let token = req.cookies.token;
    let user_token = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(user_token.id);
    if (user) {
      user.items = user.items.filter(item => item.id != body.item_id);
      await user.save();
      // await setHistory(body.id, body.token, "deleted", "item", body.token);
      res.json({
        success: true,
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }
  
});

app.post('/api/item/purchase', async (req,res) => {
  let body = JSON.parse(req.body)
  // user_id, item_id
  try {
    let token = req.cookies.token;
    let user_token = jwt.verify(token, JWT_SECRET);
    let buyer = await User.findById(user_token.id);
    if (buyer) {
      let user = await User.findById(body.user_id);
      if (user) {
        for (let i=0; i<user.items.length; i++) {
          if (user.items[i].id == body.item_id) {
            user.items[i].purchased_by = buyer.email;
            await user.save();
            
            res.json({
              success: true,
            });
          }
        }
      } else {
        // user not found
      }
    } else {
      // buyer not found
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }

});

function uniq_fast(a) {
  var seen = {};
  var out = [];
  var len = a.length;
  var j = 0;
  for(var i = 0; i < len; i++) {
       var item = a[i];
       if(seen[item] !== 1) {
             seen[item] = 1;
             out[j++] = item;
       }
  }
  return out;
}

app.post('/api/friend/add', async(req,res) => {
  let body = JSON.parse(req.body)
  let token = req.cookies.token;
  let user_token = jwt.verify(token, JWT_SECRET);

  try {
    let user = await User.findById(user_token.id);
    let new_friend = await User.findOne({email:body.email});

    if (user.id == new_friend.id) {
      return res.json({success: false, code: 400, msg: "You can't add yourself as a friend"})
    } 
    else if (user.friends.includes(new_friend.id)) {
      return res.json({success: false, code: 400, msg: "You are already friends with this user"})
    }
    else if (!new_friend) {
      return res.json({success: false, code: 400, msg: "Your friend has to sign up first"})
    }
    else {
      user.friends.push(new_friend.id);
      user.friends = uniq_fast(user.friends)
      await user.save();

      new_friend.friends.push(user_token.id);
      new_friend.friends = uniq_fast(new_friend.friends)
      await new_friend.save();

      res.json({
        success: true,
      });
    }


  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
        msg:JSON.stringify(err)
      });
    }
  }
  
})

app.post('/api/friend/remove', async(req,res) => {
  let body = JSON.parse(req.body)
  let token = req.cookies.token;
  let user_token = jwt.verify(token, JWT_SECRET);

  try {
    let user = await User.findById(user_token.id);
    let friend = await User.findById(body.id);
    if (user && friend) {
      if (user.friends.includes(friend.id)) {
        user.friends = user.friends.filter(friend => friend != body.id)
        user.friends = uniq_fast(user.friends)
        await user.save();

        friend.friends = friend.friends.filter(friend => friend != user.id)
        friend.friends = uniq_fast(friend.friends)
        await friend.save();

        res.json({
          success: true,
        });

      } else {
        res.json({
          success: false,
          message: "Not friends"
        });
      }
    } else {
      res.json({
        success: false,
        msg: "Your friend has to sign up first"
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
        msg:JSON.stringify(err)
      });
    }
  }
});

async function setHistory(item_id, user_id, action, part, by) {
  let user = await User.findById(user_id);
  if (user) {
    for (let i=0;i<user.items.length;i++) {
      if (user.items[i].id == item_id) {
        user.items[i].history.push({
          user: by,
          action: action,
          part: part,
          date: new Date()
        })
        user.save();
      } else {

      }
    }
  }
}

app.get("*", (req,res) => {
    res.redirect('/')
})

 
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Listening on port', port);
});
