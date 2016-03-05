var fs = require('fs');
var util = require('./util');
var phetup = require('./phetup');
var colors = require('../vendor/colors.js/safe.js');

var conf_file = fs.read('../conf/ss.conf.json');
var conf = JSON.parse(conf_file);

var page = phetup.phantomPage();

var searchWord;
var loadInProgress = false;

var DEBUG = false;
var USD_SEK_CURRENCY_RATE;
var RERUNS = 10;
var BUDGET = DEBUG ? 5000 : 65; //50
var cashFlow = DEBUG ? 5000 : BUDGET;
var minPrice = 0;
var maxPrice = cashFlow;
var products = [];
var cartLink;

var USER = 'fred'; //lounge

var JQUERY = '../vendor/jquery.min.js';

var LOG_PATH = '../log/'
var IMAGE_PATH = '../images/';

var EBAY_PAYMENT_URL = 'http://cart.payments.ebay.com/';

var currencyUrl = 'http://currency-api.appspot.com/api/USD/SEK.json?key=ecb3735672609b5e388e0b0686e05aaa5603af87';
var wordnickUrl = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';
var searchQuery = 'http://www.ebay.com/sch/i.html?_from=R40&_sacat=0&LH_BIN=1&_mPrRngCbx=1&_udlo={minPrice}&_udhi={maxPrice}&_nkw={searchWord}&rt=nc&LH_FS=1';


phantom.onError = phetup.onPhantomError;
page.onError = phetup.onError;
page.onResourceError = phetup.onResourceError;
page.onConsoleMessage = phetup.onConsoleMessage;
page.onLoadStarted = phetup.onLoadStarted;
page.onLoadFinished = phetup.onLoadFinished;


function start () {


  // page.open("http://signin.ebay.com", function () {
  //   page.injectJs(JQUERY);
  //   page.evaluate(function() {
  //     $('a').click();
  //   });
// page.open("http://signin.ebay.com/ws/eBayISAPI.dll", { operation: 'GET' }, page.settings);
//     setTimeout(test, 10000);
  // });

  getCurrencyRate();

  if (!DEBUG) {
    setTimeout(getRandomWord, 5000);
  }

  setTimeout(openEbay, 10000);
}

function test() {
  console.log('test');
  page.render(IMAGE_PATH + "TEST.png");
}

function restart () {
  if (RERUNS > 0) {

    if (cashFlow <= 2) {
      RERUNS--;
    }

    console.log(colors.blue('== RESTART =='));
    console.log('Cash flow: ' + colors.white('$' + cashFlow));
    console.log('Max price: ' + colors.white('$' + maxPrice));
    console.log('Max price: ' + colors.white(util.convertToSek(maxPrice) + ' SEK'));
    console.log('Nr of Products: ' + colors.white(products.length));
    console.log('Reruns left: ' + colors.white(RERUNS));

    getRandomWord();

    setTimeout(search, 5000);
  }
  else {
    console.log(colors.yellow('Out of reruns.'));
    console.log('Current cash flow: ' + colors.white('$' + cashFlow));

    setTimeout(checkShoppingStatus(null, EBAY_PAYMENT_URL), 5000);
  }
}

function getCurrencyRate () {
  console.log(colors.blue('== Step 1a: Get currency rate =='));

  page.injectJs(JQUERY);
  page.open(currencyUrl, function() {
    var jsonSource = page.plainText;
    var rate = page.evaluate(function(source) {
      var resultObject = JSON.parse(source);
      return resultObject.rate;
    }, jsonSource);

    page.render(IMAGE_PATH + "1a.png", { format: 'png', quality: 100 });

    USD_SEK_CURRENCY_RATE = rate;

    console.log('Currency $/SEK: ' + colors.white(USD_SEK_CURRENCY_RATE));
    console.log('Budget: ' + colors.white('$' + BUDGET));
    console.log('Cash flow: ' + colors.white('$' + cashFlow));
    console.log('Max price: ' + colors.white('$' + maxPrice));
    console.log('Max price: ' + colors.white(util.convertToSek(maxPrice) + ' SEK'));
  });
}

function getRandomWord () {
    console.log(colors.blue('== Step 1b: Get random word =='));
    page.open(wordnickUrl, function() {
      var jsonSource = page.plainText;
        var word = page.evaluate(function(data) {
          var resultObject = JSON.parse(data.source);

          return resultObject.word;

        }, { source: jsonSource, searchWord: searchWord });

        searchWord = word;
         console.log('Search word: ' + colors.white(searchWord));
        page.render(IMAGE_PATH + "1b.png", { format: 'png', quality: 100 });
    });

    console.log(colors.green('- Done'));
}

function openEbay () {
  console.log(colors.blue('== Step 2: Open Ebay =='));

  page.open("https://signin.ebay.com/ws/eBayISAPI.dll?SignIn", { operation: 'GET' }, page.settings);

  setTimeout(enterCredentials, 5000);

  console.log(colors.green('- Done'));
}

function enterCredentials () {
  console.log(colors.blue('== Step 3: Enter Credentials =='));

  page.render(IMAGE_PATH + "2.png");

  page.injectJs(JQUERY);
  page.evaluate(function(data) {
    $('#userid').val(data.username);
    $('#pass').val(data.password);
  }, { username: conf.ebay.username, password: conf.ebay.password });

  setTimeout(login, 5000);

  console.log(colors.green('- Done'));
}

function login () {
  console.log(colors.blue('== Step 4: Login =='));



  page.render(IMAGE_PATH + "3.png");

  page.evaluate(function() {
    console.log(window.location);
    $('#sgnBt').click();
  });

  setTimeout(checkLoginStatus, 5000);

  console.log(colors.green('- Done'));
}

function checkLoginStatus() {
  console.log(colors.blue('== Step 5: Check login status =='));

  page.render(IMAGE_PATH + "4.png");

  page.injectJs(JQUERY);
  var status = page.evaluate(function(colors) {
    if ($('#gh-ug b').text() == 'Fred') {
      return true;
    }
    return false;
  });

   console.log('Login status: ' + colors.white((status ? 'Logged in' : 'Logged out')));

  if (!status){
    console.log(colors.red('Cant validate login, stop execution.'));
    phantom.exit();
    return;
  }

  if (DEBUG) {
    console.log(colors.white('DEBUG: Goto -> Check shopping status.'));
    setTimeout(checkShoppingStatus(null, EBAY_PAYMENT_URL));
  } else {
    setTimeout(search, 5000);
  }

  console.log(colors.green('- Done'));
}

function search () {
  console.log(colors.blue('== Step 6: Search =='));

  var query = util.getEbayQuery(minPrice, maxPrice, searchWord);

   console.log('search query: ' + colors.white(query));

  page.openUrl(query, { operation: 'GET' }, page.settings);

  setTimeout(queryProducts, 10000);

  console.log(colors.green('- Done'));
}

function queryProducts() {
  console.log(colors.blue('== Step 7: Query products =='));

  page.injectJs(JQUERY);
  var itemsFound = page.evaluate(function() {
    var items = $('#ListViewInner').find('li.sresult');

     console.log('Top result: ' + items.length);

    return items.length;
  });

  page.render(IMAGE_PATH + "5.png");

  if (itemsFound > 0) {
    console.log(colors.green('- Done'));
    setTimeout(selectProduct, 5000);
  }
  else {
    console.log(colors.yellow('No items found, starting over.'));
    return restart();
  }
}

function selectProduct () {
  console.log(colors.blue('== Step 8: Select product =='));

  page.injectJs(JQUERY);
  var product = page.evaluate(function(cashFlow) {
    var items = $('#ListViewInner').find('li.sresult');

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var name = $(item).find('h3 a').text();
      var priceArray = $(item).find('.lvprices .lvprice span.g-b').text().split('$');
      var url = $(item).find('h3.lvtitle a').attr('href');

      if(priceArray.length > 2) {
        continue;
      }

      var parsedPrice = parseFloat(priceArray[1].trim());
      if (parsedPrice < cashFlow) {
        var prd = { name: name, price: parsedPrice, url: url };
        return prd;
        break;
      }
    }
  }, cashFlow);

  if (product.url == null) {
    console.log(colors.yellow('Did not find a product in the right price range, starting over.'))
    return restart();
  }
  else {
    console.log(colors.green('- Done'));
    setTimeout(validateProduct(product), 10000);
  }
}

function validateProduct (product) {
  console.log(colors.blue('== Step 9: Validate product =='));

    page.injectJs(JQUERY);
    page.open(product.url, function () {
      var validation = page.evaluate(function () {
        var payPal = $('#paymentsPlaceHolderId').next().find('img[alt="PayPal"]').length === 1;
        var priceArray = $('#prcIsum').text().split(' ');
        var isUsDollars = priceArray[0] === 'US';
        var price = isUsDollars ? priceArray[1].replace('$', '') : null;

        return { price: price, payPal: payPal, isUsDollar: isUsDollars };
      });

      page.render(IMAGE_PATH + "6.png");


      if (product.price == null || !validation.payPal) { // || !validation.isUsDollar || validation.price != product.price) {
        console.log(colors.yellow('Cant validate price/currency or does not accept PayPal, starting over.'));
        return restart();
      }

      if (cashFlow > product.price) { //&& validation.price == product.price) {
        console.log(colors.green('- Done'));
        setTimeout(addToCart(product), 10000);
      }
      else {
        console.log(colors.yellow('Not enough money left. Cash flow is at: $' + cashFlow + ' proceed to checkout.'));
        setTimeout(checkShoppingStatus(null, EBAY_PAYMENT_URL), 5000);
      }
    });
}

function addToCart (product) {
  console.log(colors.blue('== Step 10: Add to cart =='));

  page.injectJs(JQUERY);
  var cart = page.evaluate(function () {
    var variations = $('.nonActPanel select, .nonActPanel checkbox, .nonActPanel radio').length > 0;
    var url = $('a#isCartBtn_btn').attr('href');
    return { cartUrl: url, hasVariations: variations };
  });

  if (cart.cartUrl != null && !cart.hasVariations) {
    cartLink = cart.cartUrl;
    console.log(colors.green('- Done'));
    setTimeout(checkShoppingStatus(product, cart.cartUrl), 10000);
  }
  else {
    console.log(colors.yellow('No cart url or has variations, starting over.'));
    return restart();
  }
}

function checkShoppingStatus (product, cartUrl) {
  console.log(colors.blue('== Step 11: Check shopping status =='));

  page.injectJs(JQUERY);
  page.open(cartUrl, function (status) {
      var cart = page.evaluate(function () {
        var total = $('#syncTotal span.normal').text().split('$')[1];
        var nrItems = $('#ShopCart div[id^="sellerBucket_"]').length;
        var cart = { totalAmount: total, items: nrItems };
        return cart;
      });

      page.render(IMAGE_PATH + "7.png");

      if (!DEBUG && product !== null) {
        cashFlow =  Math.round((BUDGET - cart.totalAmount) * 100) / 100;
        maxPrice = cashFlow;

        product.searchWord = searchWord;
        products.push(product);
      }

      console.log('Cart total: ' + colors.white(cart.totalAmount));
      console.log('Products in cart: ' + colors.white(products.length));

      if (cashFlow >= 0 && cart.totalAmount <= BUDGET && RERUNS !== 0) {
        // RERUNS--;
        console.log('Reruns left: ' + colors.white(RERUNS));
        console.log('Cash left: ' + colors.white('$' + cashFlow));
        return restart();
      }
      else {
        console.log(colors.yellow('No more cash or out of reruns, proceed to checkout.'));
        console.log('Cash flow: ' + colors.white('$' + cashFlow));
        console.log('Reruns: ' + colors.white(RERUNS));
        setTimeout(checkout, 5000);
      }
  });

  console.log(colors.green('- Done'));;
}

function checkout () {
  console.log(colors.blue('== Step 12: Checkout =='));

  page.injectJs(JQUERY);
  var checkoutUrl = page.evaluate(function () {
    var url = $('a#ptcBtnBottom').attr('href');
    return url;
  });

  page.injectJs(JQUERY);
  page.open(EBAY_PAYMENT_URL + checkoutUrl, function (status) {

      page.render(IMAGE_PATH + "8.png");

      var response = page.evaluate(function (budget) {
        var success = false;
        var total = $('span#amount').text().split('$')[1];
        $('input#PAYPAL').click();

        if ($('input#PAYPAL').is(':checked') || $('input[name="pmtmthd"]').val() === 'PAYPAL') {
          console.log('PayPal selected.');

          if (total <= budget) {
            console.log('Cart total is within budget, checkout cart.');
            $('input#rypsubmit').click();
            success = true;
          }
        }

        return { success: success, total: total };
      }, BUDGET );

      page.render(IMAGE_PATH + "9.png");

      console.log('Total: ' +  colors.white('$' + response.total));
      console.log('Budget: ' +  colors.white('$' + BUDGET));
      console.log('Cash flow left: ' + colors.white('$' + cashFlow));

      if (response.success && response.total <= BUDGET) {
        console.log(colors.green('- Done'));
        setTimeout(payPalLogin, 10000);
      }
      else {
        console.log(colors.red('Cart total is over budget, or something went wrong, checkout canceled.'));
        phantom.exit();
      }
  });
}

function payPalLogin () {
  console.log(colors.blue('== Step 13: PayPal login =='));

  page.injectJs(JQUERY);
  page.evaluate(function (data) {
    $('#login_email').val(data.username);
    $('#login_password').val(data.password);
    $('input#submitLogin').click();

  }, { username: conf.paypal.username, password: conf.paypal.password });

  page.render(IMAGE_PATH + "10.png");

  console.log(colors.green('- Done'));

  setTimeout(validateAndBuy, 10000);
}

function validateAndBuy () {
  console.log(colors.blue('== Step 14: Validate and buy =='));

  page.render(IMAGE_PATH + '11.png');

  page.injectJs(JQUERY);
  page.evaluate(function (budget) {
    var resultTotal = parseFloat($('#miniCart .total').text().split(' ')[0].replace('$', ''));
    if (resultTotal <= budget) {
      console.log('Total price $' + resultTotal + ' is whitin budget. Paying.');
      $('#continue_abovefold').click();
    }
  }, BUDGET);

  console.log(colors.green('- Done'));

  setTimeout(confirmOrder, 20000);
}

function confirmOrder () {
  console.log(colors.blue('== Step 15: Confirm order =='));

  page.injectJs(JQUERY);
  var success = page.evaluate(function (budget) {
      if ($('#successtitle').length === 1) {
        return true;
      }
      else {
        return false;
      }
  });

  page.render(IMAGE_PATH + '12.png');

  util.logToFile('products', JSON.stringify(products));

  console.log('Nr of products bought: ' + colors.green(products.length));

  console.log(colors.green('****************ORDER COMPLETE****************'));

  phantom.exit();
}


start();
