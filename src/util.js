function convertToSek(value) {
  return Math.round((value * USD_SEK_CURRENCY_RATE) * 100) / 100
}

function getEbayQuery(minPrice, maxPrice, searchWord) {
  var query = searchQuery.replace('{minPrice}', minPrice)
                           .replace('{maxPrice}', convertToSek(maxPrice))
                           .replace('{searchWord}', searchWord);
  return query;
}

function logToFile (filename, msg) {
  var date = getCurrentDate();
  try {
    var file = LOG_PATH + date + "_" + filename + ".txt";

    if (!fs.exists(file)) {
      fs.touch(file)
    }
    fs.write(file, msg, 'a');
  }
  catch(e) {
    console.log('error: ' + e);
  }
}

function getCurrentDate () {
  var currentdate = new Date();

  var date = currentdate.getFullYear() + '-'
                  + (currentdate.getMonth()+1) + '-'
                  + currentdate.getDate();

  return date;
}

module.exports = {
    convertToSek: convertToSek,
    getEbayQuery: getEbayQuery,
    logToFile: logToFile,
    getCurrentDate: getCurrentDate
};
