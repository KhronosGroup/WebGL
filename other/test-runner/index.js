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
    .describe('config', 'Use a different config file than the default')
    .boolean('dump_shaders')
    .describe('dump_shaders', 'Dump shader info for GLSL tests');

var all_passed = false;

var osx_cached_defaults = null;

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
      restore_osx_defaults(function() {
        process.exit(all_passed ? 0 : 1);
      });
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
    "postResults": 1,
    "allowSkip": 1
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
  if(config.args.dump_shaders) {
    default_args.dumpShaders = 1;
  }

  for(arg_name in default_args) {
    full_url += queryArgs ? "&" : "?";
    full_url += arg_name + "=" + default_args[arg_name];
    queryArgs++;
  }
  
  return full_url;
}

function get_command_line_args_string() {
  var out = ""; //process.argv[0];

  for(var i = 2; i < process.argv.length; ++i) {
    if(process.argv[i].indexOf(" ") != -1) {
      out += " \"" + process.argv[i] + "\""
    } else {
      out += " " + process.argv[i];
    }
  }

  return out;
}

function get_failing_command_line_args_string(browser_name, version, test_results) {
  var out = "--browser=" + browser_name;
  if(version) {
    out += " --version=" + version;
  }
  out += " --include=";
  var firstMatch = true;

  test_results.replace(/(.*): (\d) tests failed/g, function(match, p1, p2, offset) {
    out += (firstMatch ? "" : ",") + p1;
    firstMatch = false;
  });

  return out;
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

function getAvailableShaderFileName(url, shaderType) {
  var count = 0;
  while(fs.existsSync(path.join(url, shaderType + "_" + count)))
    count++;
  return path.join(url, shaderType + "_" + count);
}

function quit(app) {
  if(app.browser_proc) {
    process.stdout.write("Finished");
    if(app.quit_command) {
      child_process.exec(app.quit_command)
    } else {
      app.browser_proc.kill();
    }
  }
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

  var current_time = Date.now();
  if(config.args.dump_shaders) {
    var shaders_dir_name = config.args.browser + "_" + current_time + "_shaders";
    var shaders_dir = path.join(__dirname, config.output_dir, shaders_dir_name);
    var shaders_array = [];
    var summary_file = null;
  }

  app.post('/dumpShaderInfo', function(req, res){
    if(!config.args.dump_shaders) {
        res.send(200);
        return;
    }

    // dump shaders info
    var shaders_info = JSON.parse(req.plainText);
    var summary_file_name = path.basename(shaders_info.url, '.html') + ".json";
    var summary_file_path = path.join(shaders_dir, path.dirname(shaders_info.url));
    var vShader = {};
    vShader.label = shaders_info.vLabel;
    vShader.should_compile = shaders_info.vShouldCompile;
    vShader.source = shaders_info.vSource;
    vShader.translated_source_path = null;
    var fShader = {};
    fShader.label = shaders_info.fLabel;
    fShader.should_compile = shaders_info.fShouldCompile;
    fShader.source = shaders_info.fSource;
    fShader.translated_source_path = null;
    var translated_shader_file_path = path.join(summary_file_path, path.basename(summary_file_name, '.json') + "_shaders");
    if(shaders_info.vTranslatedSource) {
      ensure_dir_exists(translated_shader_file_path);
      var translated_vShader_file_name = getAvailableShaderFileName(translated_shader_file_path, "vertex_shader");
      fs.writeFileSync(translated_vShader_file_name, shaders_info.vTranslatedSource, 'utf8');
      vShader.translated_source_path = path.relative(summary_file_path, translated_vShader_file_name);
    }
    if(shaders_info.fTranslatedSource) {
      ensure_dir_exists(translated_shader_file_path);
      var translated_fShader_file_name = getAvailableShaderFileName(translated_shader_file_path, "fragment_shader");
      fs.writeFileSync(translated_fShader_file_name, shaders_info.fTranslatedSource, 'utf8');
      fShader.translated_source_path = path.relative(summary_file_path, translated_fShader_file_name);
    }
    if(summary_file == null) {
      summary_file = path.join(summary_file_path, summary_file_name);
    }
    var shaders = {};
    shaders.test_description = shaders_info.testDescription;
    shaders.vShader = vShader;
    shaders.fShader = fShader;
    shaders_array.push(shaders);
    res.send(200);
  });

  // Called after each test run if the harness is dumping shaders.
  app.post('/finishIndividualTest', function(req, res){
    if(!config.args.dump_shaders) {
        res.send(200);
        return;
    }
    if(shaders_array.length > 0) {
      ensure_dir_exists(path.dirname(summary_file));
      fs.writeFileSync(summary_file, JSON.stringify(shaders_array, null, 4));
      shaders_array = [];
      summary_file = null;
    }
    res.send(200);
  });


  app.post('/finish', function(req, res){
    // Output the plain text results to a file
    var file_name = path.join(
        __dirname, config.output_dir,
        app.browser_name + "_" + current_time + ".txt"
        );

    var output = "";

    var test_results = req.plainText;
    scan_test_results(test_results);

    var executing_args = get_command_line_args_string();

    if(executing_args) {
      output += "Executing command line args: " + executing_args + "\n\n";
    }
    if(!all_passed) {
      var failing_args = get_failing_command_line_args_string(app.browser_name, config.args.version, test_results);
      output += "To reproduce failures, run with the following args: " + failing_args + "\n\n";
    }

    if(executing_args || !all_passed) {
      output += "-------------------\n\n"
    }

    output += test_results;

    fs.writeFile(file_name, output, 'utf8', function(err, data) {
      if(err) {
        console.error(err);
        all_passed = false;
      }
      if(!config.args.dump_shaders || config.args.dump_shaders && app.finished_tests) {
        quit(app);
      }
      app.finished_tests = true;
    });

    if(config.args.dump_shaders) {
      // Compress dumped shaders
      var gz_file_name = path.join(shaders_dir, shaders_dir_name + ".tar.gz");
      console.log("Compressing shaders in folder: " + shaders_dir_name);
      var targz = require('tar.gz');
      var compress = new targz().compress(shaders_dir, gz_file_name, function(err){
        if(err) {
          console.log(err);
        }
        console.log("The compressed shaders are at: " + gz_file_name);
        if(app.finished_tests) {
          quit(app);
        }
        app.finished_tests = true;
      });
    }

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
  var platform_id, platform, path_id, browser_path;
  for(platform_id in browser.platforms) {
    if(os_platform.match(platform_id)) {
      for(path_id in browser.platforms[platform_id].paths) {
        if(fs.existsSync(browser.platforms[platform_id].paths[path_id])) {
          platform = browser.platforms[platform_id];
          browser_path = platform.paths[path_id];
          break;
        }
      }
    }
    if (platform) {
      break;
    }
  }

  if(platform) {
    if(os_platform == "darwin" && browser.osx_defaults) {
      set_osx_defaults(browser.osx_defaults, function() {
        run_tests_internal(app, config, callback, browser_id, browser, platform, browser_path);
      });
    } else {
      run_tests_internal(app, config, callback, browser_id, browser, platform, browser_path);
    }
  } else {
    process.stdout.write("Not found, skipped");
    run_tests(app, config, callback, browser_id + 1);
  }
}

function run_tests_internal(app, config, callback, browser_id, browser, platform, browser_path) {
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
    profile_dir = path.join(__dirname, PROFILE_DIR_NAME);
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

  if (platform.command) {
    browser_path = platform.command;
  }

  var browser_proc = child_process.spawn(browser_path, all_args, { stdio: 'ignore' });
  app.browser_proc = browser_proc;
  app.browser_name = browser.name.replace(' ', '-');
  app.quit_command = platform.quit_command;

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

    if(app.kill_timeout) {
      clearTimeout(app.kill_timeout);
      app.kill_timeout = null;
    }

    if(profile_dir) {
      rimraf(profile_dir, function() {
        run_tests(app, config, callback, browser_id + 1);
      });
    } else {
      run_tests(app, config, callback, browser_id + 1);
    }
  });
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

var default_was_changed = false;

function write_osx_default(domain_key, value, callback) {
  if(!osx_cached_defaults){
    osx_cached_defaults = {};
  }

  child_process.exec("defaults read " + domain_key,
    function (error, stdout, stderr) {
      if(stdout == value) {
        if(callback) { callback(); }
        return; // Already has the right value
      }

      // Only cache the previous value the first time we read it for a given key
      if(typeof(osx_cached_defaults[domain_key]) == 'undefined') {
        osx_cached_defaults[domain_key] = stdout;

        if(!default_was_changed) {
          default_was_changed = true;
          console.log("WARNING: System defaults have been changed to ensure " +
              "correct test execution. Terminating this process early may " +
              "prevent system defaults from properly restoring to their original " +
              "values.");
        }
      }

      if(value.indexOf(" ") != -1) {
        value = "\"" + value + "\"";
      }

      // Write the desired default
      child_process.exec("defaults write " + domain_key + " " + value, callback);
    }
  );
}

function set_osx_defaults(defaults, callback, i) {
  if(!i) { i = 0; }
  var keys = Object.keys(defaults);
  if(i >= keys.length) {
    if(callback) {
      callback();
    }
    return;
  }
  var domain_key = keys[i];
  var value = defaults[domain_key];

  write_osx_default(domain_key, value, function() {
    set_osx_defaults(defaults, callback, i+1);
  });
}

function restore_osx_defaults(callback) {
  if(os.platform() != "darwin" || !osx_cached_defaults) {
    if(callback) { callback(); }
    return;
  }

  set_osx_defaults(osx_cached_defaults, callback);
}

if(optimist.argv.help) {
  optimist.showHelp();
} else {
  main();
}
