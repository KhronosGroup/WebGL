var os = require('os');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var express = require('express');

console.log("Platform:", os.platform());

function main() {
  var config_path = path.join(__dirname, 'config.json');

  fs.readFile(config_path, 'utf8', function (err, data) {
    if (err) {
      console.error('ERROR: Could not locate configuration file ', config_path);
      process.exit(0);
    }

    var config = JSON.parse(data);
    var app = start_test_server(config);
    ensure_dir_exists(__dirname + '/' + config.output_dir);
    config.test.full_url = build_full_url(app, config.test);

    run_tests(app, config, function() {
      // This callback runs when all tests have finished
      console.log("\nDone!");
      process.exit(0);
    });
  });
}

function ensure_dir_exists(dir_path) {
  if(!dir_path) { 
    return; 
  }

  var idx = dir_path.lastIndexOf(path.sep);
  var dir = dir_path.substring(0, idx);
  
  if(dir) {
    ensure_dir_exists(dir);
  }
  
  if(idx != dir_path.length - 1) {
    try {
        fs.mkdirSync(dir_path);
    } catch(ex) {}
  }
}

function build_full_url(app, test) {
  var full_url = "http://localhost:" + app.port + "/" + test.url;
  var queryArgs = 0;
  var arg_name;

  var default_args = {
    "run": 1,
    "postResults": 1
  }

  for(arg_name in default_args) {
    full_url += queryArgs ? "&" : "?";
    full_url += arg_name + "=" + default_args[arg_name];
    queryArgs++;
  }
  for(arg_name in test.args) {
    full_url += queryArgs ? "&" : "?";
    full_url += arg_name + "=" + test.args[arg_name];
    queryArgs++;
  }

  return full_url;
}

function start_test_server(config) {
  // Start Express server
  var app = express();
  app.use('/', express.static(__dirname + '/../..'));
  app.use(express.bodyParser());

  // Allows reading of plain text POSTs
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

  app.post('/finish', function(req, res){
    // Output the plain text results to a file
    var file_name = path.join(
        __dirname, config.output_dir,
        app.browser_name + "_" + Date.now() + ".txt"
        );

    fs.writeFile(file_name, req.plainText, 'utf8', function(err, data) {
      if(err) {
        console.error(err);
      }
      if(app.browser_proc) {
        app.browser_proc.kill();
      }
    });

    res.send(200);
  });

  var port;
  var listening = false;
  
  // Attempt to listen on random ports till we find a free one
  while(!listening) {
    port = Math.floor(Math.random() * 8999) + 1000;
    
    try {
      app.listen(port);
      app.port = port;
      console.log('Listening on:', port);
      listening = true;
    } catch(ex) {}
  }

  return app;
}

function run_tests(app, config, callback, browser_id) {
  process.stdout.write("\n");

  if(!browser_id) {
    browser_id = 0;
  }

  if(browser_id >= config.browsers.length) {
    if(callback) {
      callback();
    }
    return;
  }

  var browser = config.browsers[browser_id];

  process.stdout.write(browser.name + ": ");

  // Does a browser matching the given configuration exist on this system?
  var os_platform = os.platform();
  var platform_id, platform;
  for(platform_id in browser.platforms) {
    if(os_platform.match(platform_id)) {
      if(fs.existsSync(browser.platforms[platform_id].path)) {
        platform = browser.platforms[platform_id];
        break;
      }
    }
  }

  if(platform) {
    // Concatenate the standard browser args and any platform specific ones
    var all_args = [];

    if(browser.args) {
      all_args = all_args.concat(browser.args);
    }
    if(platform.args) {
      all_args = all_args.concat(platform.args);
    }
    all_args.push(config.test.full_url);

    var browser_proc = child_process.spawn(platform.path, all_args);
    app.browser_proc = browser_proc;
    app.browser_name = browser.name.replace(' ', '-');

    browser_proc.on('exit', function(code) {
      if(code == 20) {
        process.stdout.write("Could not launch new instance, already running");
      } else {
        process.stdout.write("Finished");
      }
      run_tests(app, config, callback, browser_id + 1);
    });

  } else {
    process.stdout.write("Not found, skipped");
    run_tests(app, config, callback, browser_id + 1);
  }
}

main();
