/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

var os = require('os');
var fs = require('fs');
var rimraf = require("rimraf"); // To provide "rm -rf" functionality
var path = require('path');
var child_process = require('child_process');

var express = require('express');

var optimist = require('optimist')
    .usage('Automated execution of the Khronos WebGL conformance tests\nUsage: $0')
    .boolean('help')
    .describe('help', 'Show this help message')
    .describe('browser', 'Comma-separated list of browsers to run the tests with')
    .describe('version', 'Version of the conformance test to run.\n     If not specified runs the latest.\n     Example: --version 1.0.1')
    .boolean('fast')
    .describe('fast', 'Only run tests not marked with --slow')
    .describe('skip', 'Comma separated list of regular expressions of which tests to skip.')
    .describe('include', 'Comma separated list of regular expressions of which tests to include.')
    .default('config', 'config')
    .describe('config', 'Use a different config file than the default');

var all_passed = false;

function main() {
  var config_path = path.join(__dirname, optimist.argv.config + '.json');

  fs.readFile(config_path, 'utf8', function (err, data) {
    if (err) {
      console.error('ERROR: Could not locate configuration file ', config_path);
      process.exit(1);
    }

    var config = JSON.parse(data);
    config.args = optimist.argv;

    process_args(config);

    var app = start_test_server(config);
    ensure_dir_exists(__dirname + '/' + config.output_dir);
    config.test_url = build_test_url(app, config);

    all_passed = true;

    run_tests(app, config, function() {
      // This callback runs when all tests have finished
      if (all_passed) {
        console.log("\nAll tests passed!");
      } else {
        console.log("\nERROR: some tests failed. See output/ for details.");
      }
      process.exit(all_passed ? 0 : 1);
    });
  });
}

function process_args(config) {
  if(config.args.browser) {
    config.args.browser = config.args.browser.split(",");
  }
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

function build_test_url(app, config) {
  var test_url;
  if(config.args.version) {
    test_url = path.join("conformance-suites", config.args.version)
  } else {
    test_url = path.join("sdk", "tests");
  }

  test_url = path.join(test_url, "webgl-conformance-tests.html");

  if(!fs.existsSync(path.join(__dirname, "../..", test_url))) {
    console.error("ERROR: Could not find test", test_url);
    process.exit(1);
  }

  // We should never see '\' in a valid path name to the conformance
  // tests, and their presence breaks loading of the conformance suite
  // in Firefox on Windows.
  test_url = test_url.replace(/\\/g, '/');

  var full_url = "http://localhost:" + app.port + "/" + test_url;
  var queryArgs = 0;
  var arg_name;

  var default_args = {
    "run": 1,
    "postResults": 1
  }

  if(config.args.fast) {
    default_args.fast = true;
  }

  if(config.args.skip) {
    default_args.skip = config.args.skip;
  }
  if(config.args.include) {
    default_args.include = config.args.include;
  }

  for(arg_name in default_args) {
    full_url += queryArgs ? "&" : "?";
    full_url += arg_name + "=" + default_args[arg_name];
    queryArgs++;
  }
  
  return full_url;
}

var pass_re = /Tests PASSED: (\d+)/;
var fail_re = /Tests FAILED: (\d+)/;
var timeout_re = /Tests TIMED OUT: (\d+)/;

function to_int(str) {
  var val = parseInt(str);
  if (isNaN(val)) {
    return 0;
  }
  return val;
}

function scan_test_results_with_re(test_results, test_re, re_kind, expect_zero) {
  var captured = test_re.exec(test_results);
  if (captured === null || captured.length != 2) {
    console.error("\n  ERROR: while parsing test output for " + re_kind);
    all_passed = false;
    return;
  }

  var val = to_int(captured[1]);
  if (expect_zero && val != 0) {
    console.error("\n  ERROR: expected to see 0 " + re_kind + ", saw " + val);
    all_passed = false;
  } else if (!expect_zero && val <= 0) {
    console.error("\n  ERROR: expected to see > 0 " + re_kind + ", saw " + val);
    all_passed = false;
  }
}

function scan_test_results(test_results) {
  scan_test_results_with_re(test_results, pass_re, "passes", false);
  scan_test_results_with_re(test_results, fail_re, "failures", true);
  scan_test_results_with_re(test_results, timeout_re, "timeouts", true);
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

  app.post('/start', function(req, res){
    // Now that the browser has told us it's working prevent the test from timing out
    if(app.start_timeout) {
      clearTimeout(app.start_timeout);
    }

    res.send(200);
  });

  app.post('/finish', function(req, res){
    // Output the plain text results to a file
    var file_name = path.join(
        __dirname, config.output_dir,
        app.browser_name + "_" + Date.now() + ".txt"
        );

    var test_results = req.plainText;

    fs.writeFile(file_name, test_results, 'utf8', function(err, data) {
      if(err) {
        console.error(err);
        all_passed = false;
      }
      if(app.browser_proc) {
        process.stdout.write("Finished");
        app.finished_tests = true;
        app.browser_proc.kill();
        scan_test_results(test_results);
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
      listening = true;
    } catch(ex) {}
  }

  return app;
}

var TEST_START_TIMEOUT = 30000;
var PROFILE_DIR_NAME = "tmp_profile";

function run_tests(app, config, callback, browser_id) {
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

  if(!should_run_browser(browser.name, config)) {
    run_tests(app, config, callback, browser_id + 1);
    return;
  }

  process.stdout.write("\n" + browser.name + ": ");

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

    var profile_dir;
    if(browser.profile_arg) {
      var profile_dir = path.join(__dirname, PROFILE_DIR_NAME);
      ensure_dir_exists(profile_dir);
      if(browser.profile_arg.indexOf("=") != -1) {
        all_args.push(browser.profile_arg + profile_dir);
      } else {
        all_args.push(browser.profile_arg);
        all_args.push(profile_dir);
      }
      
      if(browser.firefox_user_prefs) {
        write_firefox_user_prefs(profile_dir, browser.firefox_user_prefs);
      }
    }

    all_args.push(config.test_url);

    var path = platform.command ? platform.command : platform.path;

    var browser_proc = child_process.spawn(path, all_args);
    app.browser_proc = browser_proc;
    app.browser_name = browser.name.replace(' ', '-');
    app.finished_tests = false;

    app.start_timeout = setTimeout(function() {
      browser_proc.kill();
      process.stdout.write("Test failed to start in allotted time");
      all_passed = false;
    }, TEST_START_TIMEOUT);

    browser_proc.on('exit', function(code) {
      if(code == 20) {
        process.stdout.write("Could not launch new instance, already running");
        all_passed = false;
      }

      if (!app.finished_tests) {
        process.stdout.write("Tests didn't run to successful completion");
        all_passed = false;
      }

      if(profile_dir) {
        rimraf(profile_dir, function() {
          run_tests(app, config, callback, browser_id + 1);
        });
      } else {
        run_tests(app, config, callback, browser_id + 1);
      }
    });

  } else {
    process.stdout.write("Not found, skipped");
    run_tests(app, config, callback, browser_id + 1);
  }
}

function should_run_browser(browser, config) {
  if(!config.args.browser) {
    return true;
  }

  var found_browser = false;

  var i;
  for(i = 0; i < config.args.browser.length; ++i) {
    if(browser == config.args.browser[i]) {
      found_browser = true;
      break;
    }
  }

  return found_browser;
}

function write_firefox_user_prefs(profile_dir, user_prefs) {
  var out = "";

  var i, val;
  for(i in user_prefs) {
    out += "user_pref(\"" + i + "\", " + JSON.stringify(user_prefs[i]) + ");\n";
  }

  fs.appendFileSync(path.join(profile_dir, "prefs.js"), out);
}

if(optimist.argv.help) {
  optimist.showHelp();
} else {
  main();
}
