#! /usr/bin/env python3

from datetime import date
from string import Template
import sys
import html5lib

LICENSE = """
// Copyright (c) $YEAR The Khronos Group Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and/or associated documentation files (the
// "Materials"), to deal in the Materials without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Materials, and to
// permit persons to whom the Materials are furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Materials.
//
// THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.

"""

htmlfilename = sys.argv[1]
htmlfile = open(htmlfilename)
try:
    doc = html5lib.parse(htmlfile, treebuilder="dom")
finally:
    htmlfile.close()

def elementHasClass(el, classArg):
    """
    Return true if and only if classArg is one of the classes of el
    """
    classes = [ c for c in el.getAttribute("class").split(" ") if c != "" ]
    return classArg in classes

def elementTextContent(el):
    """
    Implementation of DOM Core's .textContent
    """
    textContent = ""
    for child in el.childNodes:
        if child.nodeType == 3: # Node.TEXT_NODE
            textContent += child.data
        elif child.nodeType == 1: # Node.ELEMENT_NODE
            textContent += elementTextContent(child)
        else:
            # Other nodes are ignored
            pass
    return textContent

preList = doc.getElementsByTagName("pre")
idlList = [elementTextContent(p) for p in preList if elementHasClass(p, "idl") ]
licenseTemplate = Template(LICENSE)
print(licenseTemplate.substitute(YEAR=date.today().year) + "\n\n".join(idlList))
