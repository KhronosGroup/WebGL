/*
** Copyright (c) 2016 The Khronos Group Inc.
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

/**
 * This class defines the individual tests which are skipped because
 * of graphics driver bugs which simply can not be worked around in
 * WebGL 2.0 implementations.
 *
 * The intent is that this list be kept as small as possible; and that
 * bugs are filed with the respective GPU vendors for entries in this
 * list.
 *
 * Pass the query argument "runSkippedTests" in the URL in order to
 * force the skipped tests to be run. So, for example:
 *
 * http://localhost:8080/sdk/tests/deqp/functional/gles3/transformfeedback.html?filter=transform_feedback.basic_types.separate.points&runSkippedTests
 */
'use strict';
goog.provide('framework.common.tcuSkipList');

goog.scope(function() {

    var tcuSkipList = framework.common.tcuSkipList;

    var _skipEntries = {};
    var _reason = "";

    function _setReason(reason) {
        _reason = reason;
    }

    function _skip(testName) {
        _skipEntries[testName] = _reason;
    }

    var runSkippedTests = false;
    var queryVars = window.location.search.substring(1).split('&');
    for (var i = 0; i < queryVars.length; i++) {
        var value = queryVars[i].split('=');
        if (decodeURIComponent(value[0]) === 'runSkippedTests') {
            // Assume that presence of this query arg implies to run
            // the skipped tests; the value is ignored.
            runSkippedTests = true;
            break;
        }
    }

    if (!runSkippedTests) {
        // NVIDIA's 355.06 driver on Linux fails all of these transform
        // feedback tests. It's unfortunate how long this suppression list
        // is, but WebGL 2.0 implementations can't work around these bugs.
        _setReason("Bugs in NVIDIA 355.06 driver");
        _skip("transform_feedback.basic_types.separate.points.lowp_mat2");
        _skip("transform_feedback.basic_types.separate.points.mediump_mat2");
        _skip("transform_feedback.basic_types.separate.points.highp_mat2");
        _skip("transform_feedback.basic_types.separate.lines.lowp_mat2");
        _skip("transform_feedback.basic_types.separate.lines.mediump_mat2");
        _skip("transform_feedback.basic_types.separate.lines.highp_mat2");
        _skip("transform_feedback.basic_types.separate.triangles.lowp_mat2");
        _skip("transform_feedback.basic_types.separate.triangles.mediump_mat2");
        _skip("transform_feedback.basic_types.separate.triangles.highp_mat2");
        _skip("transform_feedback.array.separate.points.lowp_float");
        _skip("transform_feedback.array.separate.points.mediump_float");
        _skip("transform_feedback.array.separate.points.highp_float");
        _skip("transform_feedback.array.separate.points.lowp_vec2");
        _skip("transform_feedback.array.separate.points.mediump_vec2");
        _skip("transform_feedback.array.separate.points.highp_vec2");
        _skip("transform_feedback.array.separate.points.lowp_int");
        _skip("transform_feedback.array.separate.points.mediump_int");
        _skip("transform_feedback.array.separate.points.highp_int");
        _skip("transform_feedback.array.separate.points.lowp_ivec2");
        _skip("transform_feedback.array.separate.points.mediump_ivec2");
        _skip("transform_feedback.array.separate.points.highp_ivec2");
        _skip("transform_feedback.array.separate.points.lowp_uint");
        _skip("transform_feedback.array.separate.points.mediump_uint");
        _skip("transform_feedback.array.separate.points.highp_uint");
        _skip("transform_feedback.array.separate.points.lowp_uvec2");
        _skip("transform_feedback.array.separate.points.mediump_uvec2");
        _skip("transform_feedback.array.separate.points.highp_uvec2");
        _skip("transform_feedback.array.separate.lines.lowp_float");
        _skip("transform_feedback.array.separate.lines.mediump_float");
        _skip("transform_feedback.array.separate.lines.highp_float");
        _skip("transform_feedback.array.separate.lines.lowp_vec2");
        _skip("transform_feedback.array.separate.lines.mediump_vec2");
        _skip("transform_feedback.array.separate.lines.highp_vec2");
        _skip("transform_feedback.array.separate.lines.lowp_int");
        _skip("transform_feedback.array.separate.lines.mediump_int");
        _skip("transform_feedback.array.separate.lines.highp_int");
        _skip("transform_feedback.array.separate.lines.lowp_ivec2");
        _skip("transform_feedback.array.separate.lines.mediump_ivec2");
        _skip("transform_feedback.array.separate.lines.highp_ivec2");
        _skip("transform_feedback.array.separate.lines.lowp_uint");
        _skip("transform_feedback.array.separate.lines.mediump_uint");
        _skip("transform_feedback.array.separate.lines.highp_uint");
        _skip("transform_feedback.array.separate.lines.lowp_uvec2");
        _skip("transform_feedback.array.separate.lines.mediump_uvec2");
        _skip("transform_feedback.array.separate.lines.highp_uvec2");
        _skip("transform_feedback.array.separate.triangles.lowp_float");
        _skip("transform_feedback.array.separate.triangles.mediump_float");
        _skip("transform_feedback.array.separate.triangles.highp_float");
        _skip("transform_feedback.array.separate.triangles.lowp_vec2");
        _skip("transform_feedback.array.separate.triangles.mediump_vec2");
        _skip("transform_feedback.array.separate.triangles.highp_vec2");
        _skip("transform_feedback.array.separate.triangles.lowp_int");
        _skip("transform_feedback.array.separate.triangles.mediump_int");
        _skip("transform_feedback.array.separate.triangles.highp_int");
        _skip("transform_feedback.array.separate.triangles.lowp_ivec2");
        _skip("transform_feedback.array.separate.triangles.mediump_ivec2");
        _skip("transform_feedback.array.separate.triangles.highp_ivec2");
        _skip("transform_feedback.array.separate.triangles.lowp_uint");
        _skip("transform_feedback.array.separate.triangles.mediump_uint");
        _skip("transform_feedback.array.separate.triangles.highp_uint");
        _skip("transform_feedback.array.separate.triangles.lowp_uvec2");
        _skip("transform_feedback.array.separate.triangles.mediump_uvec2");
        _skip("transform_feedback.array.separate.triangles.highp_uvec2");
        _skip("transform_feedback.array.interleaved.points.lowp_float");
        _skip("transform_feedback.array.interleaved.points.mediump_float");
        _skip("transform_feedback.array.interleaved.points.highp_float");
        _skip("transform_feedback.array.interleaved.points.lowp_vec2");
        _skip("transform_feedback.array.interleaved.points.mediump_vec2");
        _skip("transform_feedback.array.interleaved.points.highp_vec2");
        _skip("transform_feedback.array.interleaved.points.lowp_vec3");
        _skip("transform_feedback.array.interleaved.points.mediump_vec3");
        _skip("transform_feedback.array.interleaved.points.highp_vec3");
        _skip("transform_feedback.array.interleaved.points.lowp_vec4");
        _skip("transform_feedback.array.interleaved.points.mediump_vec4");
        _skip("transform_feedback.array.interleaved.points.highp_vec4");
        _skip("transform_feedback.array.interleaved.points.lowp_int");
        _skip("transform_feedback.array.interleaved.points.mediump_int");
        _skip("transform_feedback.array.interleaved.points.highp_int");
        _skip("transform_feedback.array.interleaved.points.lowp_ivec2");
        _skip("transform_feedback.array.interleaved.points.mediump_ivec2");
        _skip("transform_feedback.array.interleaved.points.highp_ivec2");
        _skip("transform_feedback.array.interleaved.points.lowp_ivec3");
        _skip("transform_feedback.array.interleaved.points.mediump_ivec3");
        _skip("transform_feedback.array.interleaved.points.highp_ivec3");
        _skip("transform_feedback.array.interleaved.points.lowp_ivec4");
        _skip("transform_feedback.array.interleaved.points.mediump_ivec4");
        _skip("transform_feedback.array.interleaved.points.highp_ivec4");
        _skip("transform_feedback.array.interleaved.points.lowp_uint");
        _skip("transform_feedback.array.interleaved.points.mediump_uint");
        _skip("transform_feedback.array.interleaved.points.highp_uint");
        _skip("transform_feedback.array.interleaved.points.lowp_uvec2");
        _skip("transform_feedback.array.interleaved.points.mediump_uvec2");
        _skip("transform_feedback.array.interleaved.points.highp_uvec2");
        _skip("transform_feedback.array.interleaved.points.lowp_uvec3");
        _skip("transform_feedback.array.interleaved.points.mediump_uvec3");
        _skip("transform_feedback.array.interleaved.points.highp_uvec3");
        _skip("transform_feedback.array.interleaved.points.lowp_uvec4");
        _skip("transform_feedback.array.interleaved.points.mediump_uvec4");
        _skip("transform_feedback.array.interleaved.points.highp_uvec4");
        _skip("transform_feedback.array.interleaved.lines.lowp_float");
        _skip("transform_feedback.array.interleaved.lines.mediump_float");
        _skip("transform_feedback.array.interleaved.lines.highp_float");
        _skip("transform_feedback.array.interleaved.lines.lowp_vec2");
        _skip("transform_feedback.array.interleaved.lines.mediump_vec2");
        _skip("transform_feedback.array.interleaved.lines.highp_vec2");
        _skip("transform_feedback.array.interleaved.lines.lowp_vec3");
        _skip("transform_feedback.array.interleaved.lines.mediump_vec3");
        _skip("transform_feedback.array.interleaved.lines.highp_vec3");
        _skip("transform_feedback.array.interleaved.lines.lowp_vec4");
        _skip("transform_feedback.array.interleaved.lines.mediump_vec4");
        _skip("transform_feedback.array.interleaved.lines.highp_vec4");
        _skip("transform_feedback.array.interleaved.lines.lowp_int");
        _skip("transform_feedback.array.interleaved.lines.mediump_int");
        _skip("transform_feedback.array.interleaved.lines.highp_int");
        _skip("transform_feedback.array.interleaved.lines.lowp_ivec2");
        _skip("transform_feedback.array.interleaved.lines.mediump_ivec2");
        _skip("transform_feedback.array.interleaved.lines.highp_ivec2");
        _skip("transform_feedback.array.interleaved.lines.lowp_ivec3");
        _skip("transform_feedback.array.interleaved.lines.mediump_ivec3");
        _skip("transform_feedback.array.interleaved.lines.highp_ivec3");
        _skip("transform_feedback.array.interleaved.lines.lowp_ivec4");
        _skip("transform_feedback.array.interleaved.lines.mediump_ivec4");
        _skip("transform_feedback.array.interleaved.lines.highp_ivec4");
        _skip("transform_feedback.array.interleaved.lines.lowp_uint");
        _skip("transform_feedback.array.interleaved.lines.mediump_uint");
        _skip("transform_feedback.array.interleaved.lines.highp_uint");
        _skip("transform_feedback.array.interleaved.lines.lowp_uvec2");
        _skip("transform_feedback.array.interleaved.lines.mediump_uvec2");
        _skip("transform_feedback.array.interleaved.lines.highp_uvec2");
        _skip("transform_feedback.array.interleaved.lines.lowp_uvec3");
        _skip("transform_feedback.array.interleaved.lines.mediump_uvec3");
        _skip("transform_feedback.array.interleaved.lines.highp_uvec3");
        _skip("transform_feedback.array.interleaved.lines.lowp_uvec4");
        _skip("transform_feedback.array.interleaved.lines.mediump_uvec4");
        _skip("transform_feedback.array.interleaved.lines.highp_uvec4");
        _skip("transform_feedback.array.interleaved.triangles.lowp_float");
        _skip("transform_feedback.array.interleaved.triangles.mediump_float");
        _skip("transform_feedback.array.interleaved.triangles.highp_float");
        _skip("transform_feedback.array.interleaved.triangles.lowp_vec2");
        _skip("transform_feedback.array.interleaved.triangles.mediump_vec2");
        _skip("transform_feedback.array.interleaved.triangles.highp_vec2");
        _skip("transform_feedback.array.interleaved.triangles.lowp_vec3");
        _skip("transform_feedback.array.interleaved.triangles.mediump_vec3");
        _skip("transform_feedback.array.interleaved.triangles.highp_vec3");
        _skip("transform_feedback.array.interleaved.triangles.lowp_vec4");
        _skip("transform_feedback.array.interleaved.triangles.mediump_vec4");
        _skip("transform_feedback.array.interleaved.triangles.highp_vec4");
        _skip("transform_feedback.array.interleaved.triangles.lowp_int");
        _skip("transform_feedback.array.interleaved.triangles.mediump_int");
        _skip("transform_feedback.array.interleaved.triangles.highp_int");
        _skip("transform_feedback.array.interleaved.triangles.lowp_ivec2");
        _skip("transform_feedback.array.interleaved.triangles.mediump_ivec2");
        _skip("transform_feedback.array.interleaved.triangles.highp_ivec2");
        _skip("transform_feedback.array.interleaved.triangles.lowp_ivec3");
        _skip("transform_feedback.array.interleaved.triangles.mediump_ivec3");
        _skip("transform_feedback.array.interleaved.triangles.highp_ivec3");
        _skip("transform_feedback.array.interleaved.triangles.lowp_ivec4");
        _skip("transform_feedback.array.interleaved.triangles.mediump_ivec4");
        _skip("transform_feedback.array.interleaved.triangles.highp_ivec4");
        _skip("transform_feedback.array.interleaved.triangles.lowp_uint");
        _skip("transform_feedback.array.interleaved.triangles.mediump_uint");
        _skip("transform_feedback.array.interleaved.triangles.highp_uint");
        _skip("transform_feedback.array.interleaved.triangles.lowp_uvec2");
        _skip("transform_feedback.array.interleaved.triangles.mediump_uvec2");
        _skip("transform_feedback.array.interleaved.triangles.highp_uvec2");
        _skip("transform_feedback.array.interleaved.triangles.lowp_uvec3");
        _skip("transform_feedback.array.interleaved.triangles.mediump_uvec3");
        _skip("transform_feedback.array.interleaved.triangles.highp_uvec3");
        _skip("transform_feedback.array.interleaved.triangles.lowp_uvec4");
        _skip("transform_feedback.array.interleaved.triangles.mediump_uvec4");
        _skip("transform_feedback.array.interleaved.triangles.highp_uvec4");
        _skip("transform_feedback.random.separate.points.2");
        _skip("transform_feedback.random.separate.points.7");
        _skip("transform_feedback.random.separate.lines.1");
        _skip("transform_feedback.random.separate.lines.8");
        _skip("transform_feedback.random.separate.lines.9");
        _skip("transform_feedback.random.separate.triangles.6");
        _skip("transform_feedback.random.separate.triangles.9");
        _skip("transform_feedback.random.separate.triangles.10");
    } // if (!runSkippedTests)

    /*
     * Gets the skip status of the given test. Returns an
     * object with the properties "skip", a boolean, and "reason", a
     * string.
     */
    tcuSkipList.getSkipStatus = function(testName) {
        var skipEntry = _skipEntries[testName];
        if (skipEntry === undefined) {
            return { 'skip': false, 'reason': '' };
        } else {
            return { 'skip': true, 'reason': skipEntry };
        }
    }

});
