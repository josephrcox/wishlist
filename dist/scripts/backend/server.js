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
  //localhost:8080/?user=6368652eb2313ecb34ef649b
  if (req._parsedOriginalUrl.search == null || !req._parsedOriginalUrl.search.includes("?user=")) {
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
        
      }
    } catch(err) {
      console.log(err)
      res.redirect('/login')
    }
  } else {
    // specific user page
    res.render('home.ejs');
  }
  


})

app.get('/login', (req,res) => {
  res.render('login.ejs')
})

// Login routes
app.post('/api/auth/login', async (req,res) => {
  let body = JSON.parse(req.body)
  let user = await User.findOne({name: body.name, email: body.email});
  console.log(user)
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
    let u = await User.findOne({email: body.email});
    console.log(u)
    if (u != null) {
      return res.json({ status: 'ok', success: false, code: 200, data: "Email taken, or password/name combo is incorrect" })
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
  if (body.name.length < 1  || body.name.length > 101) {
    return res.json({success: false, code: 400, message: "Name must be between 1 and 50 characters"})
  }

  try {
    let user = await User.findById(user_token.id);
    if (user) {
      user.items.push({
        name: body.name,
        link: body.link,
        price: body.price,
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

app.get('/api/items/get/:specific_user', async (req,res) => {
  const specific_user_id = req.params.specific_user
  let specific_user = null
  if (specific_user_id != "null") {
    specific_user = await User.findById(specific_user_id)
  }

  try {
    if (specific_user) {
      res.json({
        success: true,
        items: [[
          specific_user.name,
          specific_user.items,
          false,
          specific_user_id
        ]]
      });
    } else {
      let token = req.cookies.token;
      let user_token = jwt.verify(token, JWT_SECRET);
      let user = await User.findById(user_token.id);

      user.friends = uniq_fast(user.friends)
      await user.save();

      let items_array = [];
      let scrubbed_items = [];
      for (let i=0; i<user.items.length; i++) {
        scrubbed_items.push(user.items[i])
        scrubbed_items[i].purchased_by = "";
      }
      items_array.push([user_token.name, scrubbed_items, true, user_token.id]);

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
    
  }} catch(err) {
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
      let item_to_be_deleted = user.items.id(body.item_id);
      console.log(item_to_be_deleted)
      let notifyMSG = `${user_token.name} deleted ${item_to_be_deleted.name}, which you marked as purchased. This was their reasoning for deletion: ${body.message}`
      notify(item_to_be_deleted.purchased_by, notifyMSG)

      user.items = user.items.filter(item => item.id != body.item_id);
      await user.save();
      
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

app.post('/api/item/edit', async (req,res) => {
  let body = JSON.parse(req.body)
  console.log(body)
  try {
    let token = req.cookies.token;
    let user_token = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(user_token.id);
    if (user) {
      let item_to_be_edited = user.items.id(body.item_id);
      item_to_be_edited.name = body.name;

      // check if price is legit
      let price_regex = /^(?:0|[1-9]\d+|)?(?:.?\d{0,2})?$/;
      if (!body.price.match(price_regex)) {
        body.price = 0;
      }

      item_to_be_edited.price = body.price;
      item_to_be_edited.link = body.link;
      await user.save();
      
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
  let token = null
  let user_token = null
  // user_id, item_id
  try {
    let buyer = null;
    console.log(req)
    if (body.anon_buyer_name != undefined) {
      buyer = {
        id: -1,
        email: body.anon_buyer_name + "@guest.account",
      }
    } else {
      token = req.cookies.token;
      user_token = jwt.verify(token, JWT_SECRET);
      buyer = await User.findById(user_token.id);
    }


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

app.get('/api/notifications/get', async(req,res) => {
  try {
    let token = req.cookies.token;
    let user_token = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(user_token.id);
    if (user) {
      res.json({
        success: true,
        notifications: user.notifications
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    if (err) {
      res.json({
        success: false,
        msg:JSON.stringify(err)
      });
    }
  }
  
});

app.post('/api/notifications/clear', async(req,res) => {
  let body = JSON.parse(req.body)
  console.log(req.body)
  let token = req.cookies.token;
  let user_token = jwt.verify(token, JWT_SECRET);

  try {
    let user = await User.findById(user_token.id);
    if (user) {
      user.notifications = user.notifications.filter(notif => notif.message != body.message)
      user.notifications = [];
      await user.save();
      res.json({
        success: true,
        notifications:user.notifications
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
        msg:JSON.stringify(err)
      });
    }
  }
  
});

app.get('/add_friend/:email', async(req,res) => {
  let new_friend_email = req.params.email;

  try {
    let token = req.cookies.token;
    let user_token = jwt.verify(token, JWT_SECRET);

    let user = await User.findById(user_token.id);
    let new_friend = await User.findOne({email:new_friend_email});

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

      res.redirect('/')
    }

  } catch(err) {
    res.redirect('/login');
  }


});

app.get('/notifications', (req,res) => {
  res.render('notifications')
});

app.get("*", (req,res) => {
    res.redirect('/')
})
 
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Listening on port', port);
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

async function notify(to, message) {
  let user = await User.findOne({email:to});
  if (user) {
    user.notifications.push({
      message: message,
    });

    await user.save();
  } else {
    console.log("No user found to notify")
  }
}