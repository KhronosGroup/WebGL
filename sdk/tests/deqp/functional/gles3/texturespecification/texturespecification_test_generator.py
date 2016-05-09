#!/usr/bin/env python

# Copyright (c) 2016 The Khronos Group Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and/or associated documentation files (the
# "Materials"), to deal in the Materials without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Materials, and to
# permit persons to whom the Materials are furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Materials.
#
# THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.

"""
  Generator for texturespecification* tests.
  This file needs to be run in its folder.
"""

import sys

_DO_NOT_EDIT_WARNING = """<!--

This file is auto-generated from texturespecification_test_generator.py
DO NOT EDIT!

-->

"""

_HTML_TEMPLATE = """<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>WebGL Texture Specification Tests</title>
<link rel="stylesheet" href="../../../../resources/js-test-style.css"/>
<script src="../../../../js/js-test-pre.js"></script>
<script src="../../../../js/webgl-test-utils.js"></script>

<script src="../../../../closure-library/closure/goog/base.js"></script>
<script src="../../../deqp-deps.js"></script>
<script>goog.require('functional.gles3.es3fTextureSpecificationTests');</script>
</head>
<body>
<div id="description"></div>
<div id="console"></div>
<canvas id="canvas" width="256" height="256"> </canvas>
<script>
var wtu = WebGLTestUtils;
var gl = wtu.create3DContextWithWrapperThatThrowsOnGLError('canvas', null, 2);


    try {
        functional.gles3.es3fTextureSpecificationTests.run(gl, [%(start)s, %(end)s]);
    }
    catch(err)
    {
        bufferedLogToConsole(err);
    }

</script>
</body>
</html>
"""

_GROUPS = [
    'basic_teximage2d',
    'random_teximage2d',
    'teximage2d_align',
    'teximage2d_unpack_params',
    'teximage2d_pbo',
    'teximage2d_depth',
    'teximage2d_depth_pbo',
    'basic_texsubimage2d',
    'texsubimage2d_empty_tex',
    'texsubimage2d_align',
    'texsubimage2d_unpack_params',
    'texsubimage2d_pbo',
    'texsubimage2d_depth',
    'basic_copyteximage2d',
    'basic_copytexsubimage2d',
    'basic_teximage3d',
    'teximage3d_unpack_params',
    'teximage3d_pbo',
    'teximage3d_depth',
    'teximage3d_depth_pbo',
    'basic_texsubimage3d',
    'texsubimage3d_unpack_params',
    'texsubimage3d_pbo',
    'texsubimage3d_depth',
    'texstorage2d',
    'texstorage3d'
]

def GenerateFilename(group):
  """Generate test filename."""
  filename = group
  filename += ".html"
  return filename

def WriteTest(filename, start, end):
  """Write one test."""
  file = open(filename, "wb")
  file.write(_DO_NOT_EDIT_WARNING)
  file.write(_HTML_TEMPLATE % {
    'start': start,
    'end': end
  })
  file.close

def GenerateTests():
  """Generate all tests."""
  filelist = []
  for ii in range(len(_GROUPS)):
    filename = GenerateFilename(_GROUPS[ii])
    filelist.append(filename)
    WriteTest(filename, ii, ii + 1)
  return filelist

def GenerateTestList(filelist):
  file = open("00_test_list.txt", "wb")
  file.write('\n'.join(filelist))
  file.close

def main(argv):
  """This is the main function."""
  filelist = GenerateTests()
  GenerateTestList(filelist)

if __name__ == '__main__':
  sys.exit(main(sys.argv[1:]))
