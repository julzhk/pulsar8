require('dotenv').config();

var express = require('express')
var app = express()
const path = require('path');
const axios = require('axios');
const redis = require('redis');

// connect to Redis
const REDISCLOUD_URL = process.env.REDISCLOUD_URL;
const ram = redis.createClient(REDISCLOUD_URL);
ram.on('connect', () => {
  console.log(`connected to redis`);
});
ram.on('error', err => {
  console.log(`Error: ${err}`);
});


app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: path.join(__dirname, 'views')
  });
});
app.get('/chain', (req, res) => {
  const url = `https://orion8.herokuapp.com/chain`;
  const chainKey = "chain";
  ram.get(chainKey, (ramErr, ramResponse) => {
    axios.get(url).then(apiResponse => {
      if(ramErr || !ramResponse){
        console.log("1")
        ram.set(chainKey, JSON.stringify(apiResponse.data), (error, _r)=> error && console.log(error));
        return res.json(apiResponse.data);
      }
      else if (ramResponse && apiResponse){
        console.log("2")
        ram.set(chainKey, JSON.stringify(apiResponse.data), (error, _r)=> error && console.log(error));
        return res.json(JSON.parse(ramResponse));
      }
    }).catch(error => {
      console.log("3")
      return res.json({something: "wrong"});
    });
  })

  // ram.get("chain", (err, response) => {
  //   // if (response) {
  //   //   return res.json(JSON.stringify(response));
  //   // }

  //   axios.get(url).then(response => {
  //     ram.set("chain", JSON.stringify(response.data), function(err, result) {
  //       if (err) console.log(err);
  //     });
  //   })

  // })

  // axios.get(url).then(response => {
  //   return res.json({ response: response.data });
  // }).catch(error => {
  //   console.log(error);
  // });
});

app.set('port', (process.env.PORT || 5000))

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
