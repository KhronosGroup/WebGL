#!/bin/sh

# Helper script for properly invoking the closure compiler in order to
# type check the ported dEQP tests.
#
# Assumes the Closure compiler:
#   https://github.com/google/closure-compiler
# is installed side-by-side with the WebGL repository, for example:
#
#  WebGL/
#    doc/
#    extensions/
#    sdk/
#    ...
#  closure/
#    compiler.jar
#
# and that the shell is cd'd into the directory containing this
# script.
#
# Note that Closure's --warnings_whitelist_file argument doesn't work
# to suppress the two warnings coming from require.js.

: ${JAVA:=java}

$JAVA -jar ../../../../closure/compiler.jar --js \*\*.js --language_in ECMASCRIPT5_STRICT --compilation_level ADVANCED --js_output_file /dev/null
