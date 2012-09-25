var express = require('express');

var HTTP_PORT = 9090;

var child_process = require('child_process');

var test_url = 
    "localhost:" + HTTP_PORT + "/sdk/tests/webgl-conformance-tests.html?run=1";
    test_url += "&postResults=1";

    test_url += "&include=attribs";

function launch_chrome() {
  //var app_path = 
  //    "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome";

  var app_path = 
      "/Users/bajones/chrome/src/out/Release/Chromium.app/Contents/MacOS/Chromium";

  var app_args = [test_url,
      "--disable-gpu-driver-workarounds"
      ];

  console.log("Launching", app_path);
  return child_process.spawn(app_path, app_args);
}

function launch_firefox() {
  var app_path = 
      "/Applications/Firefox.app/Contents/MacOS/firefox";

  var app_args = [
      "-browser",
      test_url
      ];

  console.log("Launching", app_path);
  return child_process.spawn(app_path, app_args);
}

function watch_process(child) {
  child.stdout.setEncoding('utf8');
  child.stdout.on("data", function(data) {
    console.log(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on("data", function(data) {
    if (/^execvp\(\)/.test(data)) {
      console.error('ERROR: Failed to start child process.\n' + data);
    } else {
      //console.error(data);
    }
  });

  child.on("exit", function(code) {
    console.log("Process exited with code", code);
  });

  return child;
}

var chrome = watch_process(launch_chrome());

// Start Express server
var app = express();
app.use("/", express.static(__dirname + "/../.."));
app.use("/", express.directory(__dirname + "/../.."));

app.use(express.bodyParser());

app.use(function(req, res, next){
  if (req.is('text/plain')) {
    req.plainText = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk){ req.plainText += chunk });
    req.on('end', next);
  } else {
    next();
  }
});

app.get("/finish", function(req, res){
  res.send(200);
  chrome.kill();

  // All done, nothing to see here! Goodbye!
  process.exit(0);
});

app.post("/finish", function(req, res){
  console.log(req.plainText);

  res.send(200);
  chrome.kill();

  // All done, nothing to see here! Goodbye!
  process.exit(0);
});

app.listen(HTTP_PORT);
console.log("Listening on:", HTTP_PORT);