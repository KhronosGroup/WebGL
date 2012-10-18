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
`test-runner/config.json` to ensure they are correct for your system. The
Linux paths in particular are especially likely to need adjustment. On
Windows the paths will need to be adjusted if you have done a per-user
installation of Chrome, rather than a machine-wide installation.

Running
-------

    cd <WebGL>/other
    node ./test-runner

Run with `--help` to see command line options.

Currently supported browser configurations:

    Chrome
    ChromeCanary
    Chromium
    Firefox

The configurations above use the browser's default mechanism for rendering
WebGL. Both Firefox and Chrome by default use the ANGLE library on Windows, and
OpenGL on Mac and Linux platforms. You can force the use of OpenGL on Windows
using the following browser configurations:

    ChromeWinOpenGL
    ChromeCanaryWinOpenGL
    ChromiumWinOpenGL
    FirefoxWinOpenGL

Example invocations:

    node ./test-runner
    node ./test-runner --version 1.0.1 --browser Chrome

Results
-------

Returns exit code 0 if all tests passed in all browser configurations.
Returns non-zero exit code otherwise.

Test results are output as plain text files into 
`<WebGL>/other/test-runner/output`
