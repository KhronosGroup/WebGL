WebGL Conformance Test Harness
==============================

Simple test harness to automate execution of WebGL conformance tests across
several browsers.

Installation
------------

Make sure you have a reasonably new [Node.JS installalled](http://nodejs.org/),
then run:

    cd <WebGL>/other/test-runner
    npm install

Once installed you may need to adjust the paths in 
`test-runner/config.json` to ensure they are correct for your system.

Running
-------

    cd <WebGL>/other
    node ./test-runner

Run with `--help` to see command line options.

Example invocations:

    node ./test-runner
    node ./test-runner --version 1.0.1 --browser ChromeOpenGL

Results
-------

Returns exit code 0 if all tests passed in all browser configurations.
Returns non-zero exit code otherwise.

Test results are output as plain text files into 
`<WebGL>/other/test-runner/output`
