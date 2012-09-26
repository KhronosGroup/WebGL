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

Run with `--help` to see command line options

Results
-------

Test results are output as plain text files into 
`<WebGL>/other/test-runner/output`