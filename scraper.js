const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const Clue = require('./Clue');
const Puzzle = require('./Puzzle');
mongoose.connect('mongodb://localhost/etyScrape', (err, res) => {
  if (err){console.log('DB CONNECTION FAILED: '+err)}
  else{console.log('DB CONNECTION SUCCESS')}
  scrape()
});

function scrape() {
  axios.get(`https://www.xwordinfo.com/PS?date=2/15/1942`)
  .then(res => {

  })

}

//@TODO GRAB RELATED ENTRIES