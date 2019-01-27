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

app.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  const url = `https://orion8.herokuapp.com/${slug}`;
  
  ram.get(slug, (ramErr, ramResponse) => {
    axios.get(url).then(apiResponse => {
      if (ramErr || !ramResponse && apiResponse.data) {
        ram.set(slug, JSON.stringify(apiResponse.data), (error, _r)=> error && console.log(error));
        return res.json(apiResponse.data);
      }
      else if (ramResponse && apiResponse) {
        let olderChain = JSON.parse(ramResponse);
        let newChain = apiResponse.data;
        if (newChain.length > olderChain.length) {
          ram.set(slug, JSON.stringify(apiResponse.data), (error, _r)=> error && console.log(error));
        }
        return res.json(JSON.parse(ramResponse));
      }
      else {
        return res.json({no: "data"});
      }
    }).catch(error => {
      return res.json(JSON.parse(ramResponse));
    });
  })

});

app.set('port', (process.env.PORT || 5000))

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
