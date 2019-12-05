# Description
This script is to run any version of Khronos WebGL conformance test on various OSes (like Android, ChromeOS, Linux, MacOS and Windows) with various browsers (like Chrome, Edge, FireFox, Safari, etc.). Results will be
compared with expectations and a final report will be generated.  
WebDriver backs the main logic of test automation in this script.

# Supported Configurations
Target OS means the OS you run test on, while host OS is the place you run this script. They are same most of time, while Android is the only known exception now.
<table>
  <tr align=center>
    <td><strong>Target OS</td>
    <td><strong>Host OS</td>
    <td><strong>Browser</td>
  </tr>
  <tr align=left>
    <td>Android</td>
    <td>Linux</td>
    <td>Chrome: Stable, Beta, Dev, Canary, Public<br>FireFox: Stable, Beta, Aurora,  Nightly</td>
  </tr>
  <tr align=left>
    <td>Android</td>
    <td>MacOS</td>
    <td>Chrome: Stable, Beta, Dev, Canary, Public<br>FireFox: Stable, Beta, Aurora,  Nightly</td>
  </tr>
  <tr align=left>
    <td>Android</td>
    <td>Windows</td>
    <td>Chrome: Stable[1], Beta, Dev, Canary, Public<br>FireFox: Stable, Beta, Aurora,  Nightly</td>
  </tr>
  <tr align=left>
    <td colspan=2 align=center>ChromeOS</td>
    <td>Chrome[1]</td>
  </tr>
  <tr align=left>
    <td colspan=2 align=center>Linux</td>
    <td>Chrome: Stable[1], Beta, Dev<br>FireFox: Stable, Beta, Dev, Nightly</td>
  </tr>  
  <tr align=left>
    <td colspan=2 align=center>MacOS</td>
    <td>Chrome: Stable, Beta, Dev, Canary[1]<br>FireFox: Stable, Beta, Dev, Nightly<br>Safari</td>
  </tr>  
  <tr align=left>
    <td colspan=2 align=center>Windows</td>
    <td>Chrome: Stable[1], Beta, Dev, Canary<br>FireFox: Stable[1], Beta, Dev, Nightly[1]<br>IE<br>Edge[1]</td>
  </tr>
</table>

[1] means the configuration has been tested.

# Setup

Assuming your current directory is the one with `conformance.py`.

1. Install Python

    Both Python 2 and 3 are supported, available from https://www.python.org/downloads/.

2. *OPTIONAL* - Install a virtual environment

    Seeing as you'll be installing packages, it might be best to use a virtual python
    environment. If you're not familiar with this, the flow is something like this (on UNIX):

    ```
    # If you're using python3
    shell> python3 -m pip install --user virtualenv
    shell> python3 -m venv env

    # If you're using python2
    shell> pip install virtualenv
    shell> virtualenv env

    # Now activate the environment
    shell> source env/bin/activate

    # To exit the environment
    shell> deactivate
    ```

3. Install the Selenium package

    Selenium is a tool for automating browsers. There is a python API, which
    talks to WebDriver.

    ```
    shell> pip install selenium
    ```

    Note on Windows, pip resides in `<python_dir>/Scripts`.

4. *Android Only* - Download and install the platform tools

    If you're going to run this tool for Android, download the relevant package
    for your host platform, and install into your `PATH`.
    - https://dl.google.com/android/repository/platform-tools-latest-darwin.zip
    - https://dl.google.com/android/repository/platform-tools-latest-linux.zip
    - https://dl.google.com/android/repository/platform-tools-latest-windows.zip

5. Download a Web Driver binary if necessary

    With the exception of Safari, which comes with the system, you'll probably
    need the tool that can control the browser via Web Driver.

    This tool will look for the driver in `./webdriver/<os_name>` by default, where `os_name`
    is "android", "linux", "win" or "mac".
    You can also designate a path to a webdriver executable with `--webdriver-path`.  

    Webdrivers are available at:  
    - Chrome (chromedriver(.exe)): https://sites.google.com/a/chromium.org/chromedriver  
    - Edge (MicrosoftWebDriver.exe): https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver  
    - FireFox (geckodriver(.exe)): https://github.com/mozilla/geckodriver/releases  
    - Safari (safaridriver): already included as `/usr/bin/safaridriver`

6. Execute script

    ```
    shell> python conformance.py [options]
    ```

    Pass `--help` for more information. You'll need to provide `--browser-name` at least.

    For example, to run a local version of the 1.0.4 test suite against Safari, use:

    ```
    # Start a server pointing to the tests.
    shell1> ./serve_localhost.py --directory sdk/tests

    # Run the tests.
    shell2> python3 conformance.py --browser-name safari --url http://localhost:8000/webgl-conformance-tests.html --version 1.0.4
    ```

7. Check report

    Test results will be placed in `<work_dir>/result/<timestamp>.html` where
    `timestamp` is when the test run happened (`%Y%m%d%H%M%S`, e.g., 20170403235901)

## ChromeOS
First, a test image is required as the script relies on telemetry. Then you just need to copy the script to your ChromeOS and execute it as others, including Python, webdriver binary, etc., just work out of the box.


# Supported Features
* Multiple Android devices<br>
You may connect multiple Android devices with your host machine, and use --android-device-id to designate the exact device you will test on.
* Multiple GPUs<br>
Multiple GPUs can be installed on same device. Typically, you may have one discrete GPU and one integrated GPU in this scenario. The choice among them can be quite flexible. For example, on MacOS, you may run one application with discrete GPU, while running another application with integrated GPU at the same time. The script will try to check some info from browser at runtime to see which GPU it uses actually.
The info of GPU in usage can be very important for the tests. For example, it's important to know how many of the expectations can be applied in current tests.
* Crash handling<br>
It's often to see some GPU driver issues crash the browser. To run the whole test suite in a batch, the capability to recover from crash is critical. However, the crash handling can be very complex, due to different browsers under very different situations.   
Currently, some simple but effective crash handling was added, which was verified to be very useful for tests at least with Chrome.
* Resume from last tests<br>
We can't always guarantee the tests to be finished smoothly, especially when many crashes are unexpected. The script will record the progress (&lt;work_dir>/log/resume) in details so that you may resume from it next time.
* Automatic retry<br>
Sometimes, a test case can be flaky under an abnormal context, and a clean retest can mute this false alarm. A simple retry mechanism is brought for this sake.
* Expectation as the baseline<br>
Sophiscated expectations regarding to OS, GPU and browser can be set so that you can always have a clear idea on improvements and regressions.
* Test with only a subset of all cases<br>
You may designate a folder or a specific case for testing using option --suite.
* Extra browser options<br>
You may pass extra browser options to test script. An intuitive usage of this is to live behind the proxy.
* Top time consuming cases<br>
Top time consuming cases will also be listed in final report, which can help to find some performance issue.
* OpenGL ES<br>
Sometimes, you want to test against OpenGL ES instead of OpenGL on Linux, and option --gles is your friend here.  
* Self-build Mesa driver<br>
On Linux, Mesa driver can be used on the fly, which means you may run the system with system graphics stack, while running browser solely with your self-build Mesa driver. Option --mesa-dir can be used for this sake.

# TODO Features
* More support of host_os, target_os and browser combinations
* The design of expectations
* Get more GPU, OS, browser info
* log_path of geckodriver
* Run with multiple frames (?frame=x in url)<br>
This might not be an important feature.
