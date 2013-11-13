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
installation of Chrome, rather than a machine-wide installation. The test
runner tries the paths in the list one by one until it finds one that exists.

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
    Safari

NOTE: The Safari configuration is able to execute the tests, but has
several known issues, including potentially interfering with an
already-running instance of the browser. Make sure you quit Safari before
running this test harness against Safari.

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

The exit code can be tested via the $? variable in most Unix shells, and
via the %errorlevel% pseudo environment variable in the Windows Command
Prompt. See:
http://stackoverflow.com/questions/334879/how-do-i-get-the-application-exit-code-from-a-windows-command-line

Test results are output as plain text files into 
`<WebGL>/other/test-runner/output`
