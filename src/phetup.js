var currentdate = new Date();

var date = currentdate.getFullYear() + '-'
                + (currentdate.getMonth()+1) + '-'
                + currentdate.getDate();

var timestamp = "[" + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds() + "]";

function phantomPage () {
  var page = new WebPage();
  page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36";
  page.settings.javascriptEnabled = true;
  page.settings.webSecurityEnabled = false;
  page.customHeaders = { "Accept-Language": "en" };

  return page;
}

function onPhantomError (msg, trace) {
  var msgStack = [timestamp + ' PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push(timestamp + ' TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }

  try {
    var file = LOG_PATH + "/" + date + "_phantom_log.txt";
    if (!fs.exists(file)) {
      fs.touch(file)
      console.log('touch');
    }
    fs.write(file, msgStack.join('\n'), 'a');
  }
  catch(e) {
    console.log(+ e);
  }

  phantom.exit(1);
}

function onError (msg, trace) {
  var msgStack = [timestamp + ' ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push(timestamp + ' TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }

  try {
    var file = LOG_PATH + "/" + date + "_log.txt";
    if (!fs.exists(file)) {
      fs.touch(file)
    }
    fs.write(file, msgStack.join('\n'), 'a');
  }
  catch(e) {
    console.log(e);
  }
}

function onConsoleMessage (msg) {
  if (msg.indexOf('Skip to main content') <= -1) {
    console.log('log: ' + msg);
  }
};

function onResourceError (resourceError) {
  // console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
  // console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
};

function onLoadStarted () {
  loadInProgress = true;
  //console.log("load started");
};

function onLoadFinished () {
  loadInProgress = true;
  //console.log("load started");
};

module.exports = {
  phantomPage: phantomPage,
  onPhantomError: onPhantomError,
  onError: onError,
  onConsoleMessage: onConsoleMessage,
  onResourceError: onResourceError,
  onLoadStarted: onLoadStarted,
  onLoadFinished: onLoadFinished
}
