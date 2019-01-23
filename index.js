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
  const url = "https://orion8.herokuapp.com/chain";
  const chainKey = "chain";
  
  ram.get(chainKey, (ramErr, ramResponse) => {
    axios.get(url).then(apiResponse => {
      if (ramErr || !ramResponse && apiResponse.data) {
        console.log("1")
        ram.set(chainKey, JSON.stringify(apiResponse.data), (error, _r)=> error && console.log(error));
        return res.json(apiResponse.data);
      }
      else if (ramResponse && apiResponse) {
        console.log("2")
        ram.set(chainKey, JSON.stringify(apiResponse.data), (error, _r)=> error && console.log(error));
        console.log("ramResponse", ramResponse)
        return res.json(JSON.parse(ramResponse));
      }
      else {
        return res.json({no: "data"});
      }
    }).catch(error => {
      console.log("3")
      return res.json({something: "wrong"});
    });
  })

});

app.set('port', (process.env.PORT || 5000))

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
