/*
Copyright (c) 2019 The Khronos Group Inc.
Use of this source code is governed by an MIT-style license that can be
found in the LICENSE.txt file.
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
    var _wildcardSkipEntries = {};
    var _reason = "";

    function _setReason(reason) {
        _reason = reason;
    }

    function _skip(testName) {
        if(testName.indexOf("*") >= 0){
            testName = testName.split("*")[0];
            _wildcardSkipEntries[testName] = _reason;
        }else{
            _skipEntries[testName] = _reason;
        }
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
        // Example usage:
        //
        // _setReason("Bugs in FooVendor 30.03 driver");
        // _skip("transform_feedback.basic_types.separate.points.lowp_mat2");

        // Please see https://android.googlesource.com/platform/external/deqp/+/7c5323116bb164d64bfecb68e8da1af634317b24
        _setReason("Native dEQP also fails on these tests and suppresses them");
        _skip("texture_functions.textureoffset.sampler3d_fixed_fragment");
        _skip("texture_functions.textureoffset.isampler3d_fragment");
        _skip("texture_functions.textureoffset.usampler3d_fragment");
        _skip("texture_functions.textureprojoffset.sampler3d_fixed_fragment");
        _skip("texture_functions.textureprojoffset.isampler3d_fragment");
        _skip("texture_functions.textureprojoffset.usampler3d_fragment");
        // Please see https://android.googlesource.com/platform/external/deqp/+/master/android/cts/master/src/gles3-hw-issues.txt
        _skip("texture_functions.textureprojlod.isampler3d_vertex");
        _skip("texture_functions.textureprojlod.usampler3d_vertex");
        // Please see https://android.googlesource.com/platform/external/deqp/+/master/android/cts/master/src/gles3-test-issues.txt
        _skip("texture_functions.textureprojlodoffset.usampler3d_vertex");
        _skip("texture_functions.textureoffset.sampler3d_float_fragment");
        _skip("texture_functions.textureprojoffset.sampler3d_float_fragment");
        // Please see https://android.googlesource.com/platform/external/deqp/+/master/android/cts/master/src/gles3-driver-issues.txt
        _skip("texture_functions.textureprojlodoffset.isampler3d_vertex");
        _skip("texture_functions.texturegrad.samplercubeshadow*");
        // Please see https://android.googlesource.com/platform/external/deqp/+/40ff528%5E%21/
        // and https://bugs.chromium.org/p/angleproject/issues/detail?id=3094
        _skip("texture_functions.texturelodoffset.sampler3d_float_vertex");

        // https://android.googlesource.com/platform/external/deqp/+/0c1f83aee4709eef7ef2a3edd384f9c192f476fd/android/cts/master/src/gles3-hw-issues.txt#801
        _setReason("Tricky blit rects can result in imperfect copies on some HW.");
        _skip("blit.rect.nearest_consistency_mag");
        _skip("blit.rect.nearest_consistency_mag_reverse_dst_x");
        _skip("blit.rect.nearest_consistency_mag_reverse_src_dst_x");
        _skip("blit.rect.nearest_consistency_mag_reverse_src_x");
        _skip("blit.rect.nearest_consistency_mag_reverse_src_y");
        _skip("blit.rect.nearest_consistency_min");
        _skip("blit.rect.nearest_consistency_min_reverse_dst_x");
        _skip("blit.rect.nearest_consistency_min_reverse_src_dst_x");
        _skip("blit.rect.nearest_consistency_min_reverse_src_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag");
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag_reverse_dst_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag_reverse_src_dst_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag_reverse_src_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag_reverse_src_y");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min_reverse_dst_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min_reverse_src_dst_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min_reverse_src_x");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min_reverse_src_y");

        // https://android.googlesource.com/platform/external/deqp/+/0c1f83aee4709eef7ef2a3edd384f9c192f476fd/android/cts/master/src/gles3-driver-issues.txt#381
        _setReason("Tricky blit rects can result in imperfect copies on some drivers.");
        _skip("blit.rect.out_of_bounds_linear");
        _skip("blit.rect.out_of_bounds_reverse_src_x_linear");
        _skip("blit.rect.out_of_bounds_reverse_src_y_linear");
        _skip("blit.rect.out_of_bounds_reverse_dst_x_linear");
        _skip("blit.rect.out_of_bounds_reverse_dst_y_linear");
        _skip("blit.rect.out_of_bounds_reverse_src_dst_x_linear");
        _skip("blit.rect.out_of_bounds_reverse_src_dst_y_linear");

        // https://android.googlesource.com/platform/external/deqp/+/0c1f83aee4709eef7ef2a3edd384f9c192f476fd/android/cts/master/src/gles3-driver-issues.txt#368
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag_reverse_dst_y");
        _skip("blit.rect.nearest_consistency_out_of_bounds_mag_reverse_src_dst_y");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min_reverse_dst_y");
        _skip("blit.rect.nearest_consistency_out_of_bounds_min_reverse_src_dst_y");

        _setReason("Missing shadow sampler functions in D3D11");
        // https://github.com/KhronosGroup/WebGL/issues/1870
        // deqp/functional/gles3/shadertexturefunction/texture.html
        _skip("texture_functions.texture.sampler2darrayshadow_vertex");
        // deqp/functional/gles3/shadertexturefunction/texturelod.html
        _skip("texture_functions.texturelod.sampler2dshadow_vertex");
        _skip("texture_functions.texturelod.sampler2dshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/texturelodoffset.html
        _skip("texture_functions.texturelodoffset.sampler2dshadow_vertex");
        _skip("texture_functions.texturelodoffset.sampler2dshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/textureprojlod.html
        _skip("texture_functions.textureprojlod.sampler2dshadow_vertex");
        _skip("texture_functions.textureprojlod.sampler2dshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/textureprojlodoffset.html
        _skip("texture_functions.textureprojlodoffset.sampler2dshadow_vertex");
        _skip("texture_functions.textureprojlodoffset.sampler2dshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/texturegrad.html
        _skip("texture_functions.texturegrad.sampler2dshadow_vertex");
        _skip("texture_functions.texturegrad.sampler2dshadow_fragment");
        _skip("texture_functions.texturegrad.sampler2darrayshadow_vertex");
        _skip("texture_functions.texturegrad.sampler2darrayshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/texturegradoffset.html
        _skip("texture_functions.texturegradoffset.sampler2dshadow_vertex");
        _skip("texture_functions.texturegradoffset.sampler2dshadow_fragment");
        _skip("texture_functions.texturegradoffset.sampler2darrayshadow_vertex");
        _skip("texture_functions.texturegradoffset.sampler2darrayshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/textureprojgrad.html
        _skip("texture_functions.textureprojgrad.sampler2dshadow_vertex");
        _skip("texture_functions.textureprojgrad.sampler2dshadow_fragment");
        // deqp/functional/gles3/shadertexturefunction/textureprojgradoffset.html
        _skip("texture_functions.textureprojgradoffset.sampler2dshadow_vertex");
        _skip("texture_functions.textureprojgradoffset.sampler2dshadow_fragment");

        _setReason("MacOSX drivers share namespaces where they should not");
        // https://github.com/KhronosGroup/WebGL/issues/1890
        // deqp/data/gles3/shaders/scoping.html
        _skip("scoping.valid.local_int_variable_hides_struct_type_vertex");
        _skip("scoping.valid.local_int_variable_hides_struct_type_fragment");
        _skip("scoping.valid.local_struct_variable_hides_struct_type_vertex");
        _skip("scoping.valid.local_struct_variable_hides_struct_type_fragment");
        _skip("scoping.valid.function_parameter_hides_struct_type_vertex");
        _skip("scoping.valid.function_parameter_hides_struct_type_fragment");

        _setReason("NVidia Linux drivers does not clamp gl_FragDepth to [0.0, 1.0]");
        // Standalone Test case:
        //  https://github.com/Kangz/GLDriverBugs/blob/master/frag_depth_clamp_32f_depth/Main.cpp
        // deqp/functional/gles3/fbodepthbuffer.html
        _skip("depth.depth_write_clamp.depth_component32f");
        _skip("depth.depth_write_clamp.depth32f_stencil8");
        _skip("depth.depth_test_clamp.depth_component32f");
        _skip("depth.depth_test_clamp.depth32f_stencil8");

        _setReason("NVidia Linux driver bug in nested uniform block location assignment");
        // crbug.com/621178
        // deqp/functional/gles3/uniformapi/random.html
        _skip("uniform_api.random.64");

        _setReason("Mac AMD / Linux AMD / older mesa handles clipping of wide points incorrectly");
        // crbug.com/642822
        // deqp/functional/gles3/clipping.html
        _skip("clipping.wide_points_full_viewport");
        _skip("clipping.wide_points_partial_viewport");

        _setReason("Some Windows AMD D3D11 drivers have issues with blit and depth/stencil formats.");
        // crbug.com/638323
        // deqp/functional/gles3/framebufferblit/depth_stencil.html
        // Also see conformance2/rendering/blitframebuffer-stencil-only.html for 2.0.1 test.
        _skip("blit.depth_stencil.depth24_stencil8_scale");
        _skip("blit.depth_stencil.depth24_stencil8_stencil_only");
    } // if (!runSkippedTests)

    /*
     * Gets the skip status of the given test. Returns an
     * object with the properties "skip", a boolean, and "reason", a
     * string.
     */
    tcuSkipList.getSkipStatus = function(testName) {
        var skipEntry = _skipEntries[testName];
        if (skipEntry === undefined) {
            return this._getWildcardSkipStatus(testName);
        } else {
            return { 'skip': true, 'reason': skipEntry };
        }
    }

    /*
     * Gets the skip status of the given tests like testpath*
     * object with the properties "skip", a boolean, and "reason", a
     * string.
    */
    tcuSkipList._getWildcardSkipStatus = function(testName) {
        var skipEntry;
        for (var key in _wildcardSkipEntries) {
            if (testName.indexOf(key) >=0 ) {
                skipEntry = _wildcardSkipEntries[key];
                if (skipEntry != undefined) {
                    return { 'skip': true, 'reason': skipEntry };
                }
            }
        }
        return { 'skip': false, 'reason': '' };
    }

});
