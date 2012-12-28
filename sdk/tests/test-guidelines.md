Contributing WebGL conformance tests Guidelines
===============================================

Thank you for contibuting to the WebGL conformance tests.
Please try to follow these guidelines when submitting a test.

*   All changes and/or new tests should go in the sdk/tests/conformance folder

The tests under conformance-suites are snapshots and are only to be updated by
the WebGL Working Group when "official" snapshots are taken.

*   Please use the Khronos Group License (MIT)

These lines appears at the top of every html and js file under sdk/tests/conformance

    <!--
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
    -->

*   Please use code similar to the code in existing tests

Ideally, copy an existing test and modify it for your new test. Try not to duplicate
code that already exists where approriate.

*   If adding a new test edit the approriate 00_test_list.txt file

Each folder has a 00_test_list.txt file that lists the test in that folder.
Each new test should be prefixed with the option "--min-version <version>" where
version is 1 more than the newest official verison. At the time of this writing
all new tests should be prefixed with "--min-version 1.0.2"


