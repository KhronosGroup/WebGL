/*-------------------------------------------------------------------------
 * drawElements Quality Program OpenGL ES Utilities
 * ------------------------------------------------
 *
 * Copyright 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';
goog.provide('framework.referencerenderer.rrRasterizer');
goog.require('framework.referencerenderer.rrRenderState');


goog.scope(function() {

var rrRasterizer = framework.referencerenderer.rrRasterizer;
var rrRenderState = framework.referencerenderer.rrRenderState;


/** @const */ rrRasterizer.RASTERIZER_SUBPIXEL_BITS            = 8;
/** @const */ rrRasterizer.RASTERIZER_MAX_SAMPLES_PER_FRAGMENT = 16;
/** @const */ rrRasterizer.shlMultiplier = Math.pow(2, rrRasterizer.RASTERIZER_SUBPIXEL_BITS);
/** @const */ rrRasterizer.shrMultiplier = Math.pow(2, -rrRasterizer.RASTERIZER_SUBPIXEL_BITS);

/**
 * @param {number}
 * @return {number}
 */
rrRasterizer.toSubpixelCoord = function(v) { return v * rrRasterizer.shlMultiplier + (v < 0 ? -0.5 : 0.5); };


/**
 * \brief Edge function
 *
 * Edge function can be evaluated for point P (in fixed-point coordinates
 * with SUBPIXEL_BITS fractional part) by computing
 *  D = a*Px + b*Py + c
 *
 * D will be fixed-point value where lower (SUBPIXEL_BITS*2) bits will
 * be fractional part.
 *
 * a and b are stored with SUBPIXEL_BITS fractional part, while c is stored
 * with SUBPIXEL_BITS*2 fractional bits.
 * @constructor
 * @param {boolean=} a_
 * @param {boolean=} b_
 * @param {boolean=} c_
 * @param {boolean=} inclusive_
 */
rrRasterizer.EdgeFunction = function(a_, b_, c_, inclusive_) {
    this.a = a_ || 0;
    this.b = b_ || 0;
    this.c = c_ || 0;
    this.inclusive = inclusive_ || false;  //!< True if edge is inclusive according to fill rules.
};

/**
 * @param {boolean} horizontalFill
 * @param {boolean} verticalFill
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
rrRasterizer.EdgeFunction.prototype.initEdgeCCW = function(horizontalFill, verticalFill, x0, y0, x1, y1) {
    // \note See rrRasterizer.EdgeFunction documentation for details.

    var xd          = x1-x0;
    var yd          = y1-y0;
    var            inclusive   = false;    //!< Inclusive in CCW orientation.

    if (yd == 0)
        inclusive = verticalFill == rrRenderState.VerticalFill.BOTTOM ? xd >= 0 : xd <= 0;
    else
        inclusive = horizontalFill == rrRenderState.HorizontalFill.LEFT ? yd <= 0 : yd >= 0;

    this.a          = (y0 - y1);
    this.b          = (x1 - x0);
    this.c          = x0*y1 - y0*x1;
    this.inclusive  = inclusive; //!< \todo [pyry] Swap for CW triangles
};

/**
 * @constructor
 * @param {rrRenderState.RasterizationState} state
 */
rrRasterizer.TriangleRasterizer = function(viewport, numSamples, state) {
    this.m_viewport = viewport;
    this.m_numSamples = numSamples;
    this.m_winding = state.winding;
    this.m_horizontalFill = state.horizontalFill;
    this.m_verticalFill = state.verticalFill;
    this.m_face = undefined;
    this.m_edge01 = new rrRasterizer.EdgeFunction();
    this.m_edge12 = new rrRasterizer.EdgeFunction();
    this.m_edge20 = new rrRasterizer.EdgeFunction();
};


/**
 * \brief Initialize triangle rasterization
 * @param {Array<number>} v0 Screen-space coordinates (x, y, z) and 1/w for vertex 0.
 * @param {Array<number>} v1 Screen-space coordinates (x, y, z) and 1/w for vertex 1.
 * @param {Array<number>} v2 Screen-space coordinates (x, y, z) and 1/w for vertex 2.
 */
rrRasterizer.TriangleRasterizer.prototype.init = function(v0,v1, v2) {
    this.m_v0 = v0;
    this.m_v1 = v1;
    this.m_v2 = v2;

    // Positions in fixed-point coordinates.
    var x0      = rrRasterizer.toSubpixelCoord(v0[0]);
    var y0      = rrRasterizer.toSubpixelCoord(v0[1]);
    var x1      = rrRasterizer.toSubpixelCoord(v1[0]);
    var y1      = rrRasterizer.toSubpixelCoord(v1[1]);
    var x2      = rrRasterizer.toSubpixelCoord(v2[0]);
    var y2      = rrRasterizer.toSubpixelCoord(v2[1]);

    // Initialize edge functions.
    if (this.m_winding == rrRenderState.Winding.CCW)
    {
        this.m_edge01.initEdgeCCW(this.m_horizontalFill, this.m_verticalFill, x0, y0, x1, y1);
        this.m_edge12.initEdgeCCW(this.m_horizontalFill, this.m_verticalFill, x1, y1, x2, y2);
        this.m_edge20.initEdgeCCW(this.m_horizontalFill, this.m_verticalFill, x2, y2, x0, y0);
    }
    else
    {
        // Reverse edges
        this.m_edge01.initEdgeCCW(this.m_horizontalFill, this.m_verticalFill, x1, y1, x0, y0);
        this.m_edge12.initEdgeCCW(this.m_horizontalFill, this.m_verticalFill, x2, y2, x1, y1);
        this.m_edge20.initEdgeCCW(this.m_horizontalFill, this.m_verticalFill, x0, y0, x2, y2);
    }

    // Determine face.
    var s               = evaluateEdge(this.m_edge01, x2, y2);
    var positiveArea    = (this.m_winding == rrRenderState.Winding.CCW) ? (s > 0) : (s < 0);
    this.m_face = positiveArea ? rrDefs.FaceType.FACETYPE_FRONT : rrDefs.FaceType.FACETYPE_BACK;

    if (!positiveArea) {
        // Reverse edges so that we can use CCW area tests & interpolation
        reverseEdge(this.m_edge01);
        reverseEdge(this.m_edge12);
        reverseEdge(this.m_edge20);
    }

    // Bounding box
    var xMin    = Math.min(x0, x1, x2);
    var xMax    = Math.max(x0, x1, x2);
    var yMin    = Math.min(y0, y1, y2);
    var yMax    = Math.max(y0, y1, y2);

    this.m_bboxMin[0] = floorSubpixelToPixelCoord   (xMin, this.m_horizontalFill == rrRenderState.HorizontalFill.LEFT);
    this.m_bboxMin[1] = floorSubpixelToPixelCoord   (yMin, this.m_verticalFill   == rrRenderState.VerticalFill.BOTTOM);
    this.m_bboxMax[0] = ceilSubpixelToPixelCoord    (xMax, this.m_horizontalFill == rrRenderState.HorizontalFill.RIGHT);
    this.m_bboxMax[1] = ceilSubpixelToPixelCoord    (yMax, this.m_verticalFill   == rrRenderState.VerticalFill.TOP);

    // Clamp to viewport
    var wX0     = this.m_viewport[0];
    var wY0     = this.m_viewport[1];
    var wX1     = wX0 + this.m_viewport[2] - 1;
    var wY1     = wY0 + this.m_viewport[3] -1;

    this.m_bboxMin[0] = deMath.clamp(this.m_bboxMin[0], wX0, wX1);
    this.m_bboxMin[1] = deMath.clamp(this.m_bboxMin[1], wY0, wY1);
    this.m_bboxMax[0] = deMath.clamp(this.m_bboxMax[0], wX0, wX1);
    this.m_bboxMax[1] = deMath.clamp(this.m_bboxMax[1], wY0, wY1);

    this.m_curPos = this.m_bboxMin;
};




});
