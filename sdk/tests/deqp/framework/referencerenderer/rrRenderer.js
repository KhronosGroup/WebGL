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
goog.provide('framework.referencerenderer.rrRenderer');
goog.require('framework.common.tcuTexture');
goog.require('framework.common.tcuTextureUtil');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.referencerenderer.rrDefs');
goog.require('framework.referencerenderer.rrFragmentOperations');
goog.require('framework.referencerenderer.rrGenericVector');
goog.require('framework.referencerenderer.rrMultisamplePixelBufferAccess');
goog.require('framework.referencerenderer.rrRenderState');
goog.require('framework.referencerenderer.rrShadingContext');
goog.require('framework.referencerenderer.rrVertexPacket');

goog.scope(function() {

var rrRenderer = framework.referencerenderer.rrRenderer;
var rrVertexPacket = framework.referencerenderer.rrVertexPacket;
var rrDefs = framework.referencerenderer.rrDefs;
var rrFragmentOperations = framework.referencerenderer.rrFragmentOperations;
var deMath = framework.delibs.debase.deMath;
var tcuTextureUtil = framework.common.tcuTextureUtil;
var tcuTexture = framework.common.tcuTexture;
var rrRenderState = framework.referencerenderer.rrRenderState;
var rrMultisamplePixelBufferAccess = framework.referencerenderer.rrMultisamplePixelBufferAccess;
var rrShadingContext = framework.referencerenderer.rrShadingContext;
var rrGenericVector = framework.referencerenderer.rrGenericVector;

/**
 * @enum
 */
rrRenderer.PrimitiveType = {
    TRIANGLES: 0, //!< Separate rrRenderer.triangles
    TRIANGLE_STRIP: 1, //!< rrRenderer.Triangle strip
    TRIANGLE_FAN: 2, //!< rrRenderer.Triangle fan

    LINES: 3, //!< Separate lines
    LINE_STRIP: 4, //!< Line strip
    LINE_LOOP: 5, //!< Line loop

    POINTS: 6 //!< Points
};


// /**
//  * @constructor
//  * @param {boolean} depthEnabled Is depth buffer enabled
//  */
// rrRenderer.RasterizationInternalBuffers = function(depthEnabled) {
//     /*std::vector<rrFragmentOperations.Fragment>*/ this.fragmentPackets = [];
//     /*std::vector<GenericVec4>*/ this.shaderOutputs = [];
//     /*std::vector<Fragment>*/ this.shadedFragments = [];
//     /*float**/ this.fragmentDepthBuffer = depthEnabled ? [] : null;
// };

/**
 * @constructor
 * @param {number=} id
 */
rrRenderer.DrawContext = function(id) {
    this.primitiveID = id || 0;

};

// rrRenderer.makeSharedVertexDistinct = function(packet, vertices, vpalloc) {
//     if (!vertices[packet])
//         vertices[packet] = true;
//     else {
//         var newPacket = vpalloc.alloc();
//         // copy packet output values
//         newPacket.position = packet.position;
//         newPacket.pointSize = packet.pointSize;
//         newPacket.primitiveID = packet.primitiveID;

//         for (var outputNdx = 0; outputNdx < vpalloc.getNumVertexOutputs(); ++outputNdx)
//             newPacket.outputs[outputNdx] = packet.outputs[outputNdx];

//         // no need to insert new packet to "vertices" as newPacket is unique
//         packet = newPacket;
//     }
//     return packet;
// };

// rrRenderer.findTriangleVertexDepthSlope = function(p, v0, v1) {
//     // screen space
//     var ssp = deMath.swizzle(p, [0, 1, 2]);
//     var ssv0 = deMath.swizzle(v0, [0, 1, 2]);
//     var ssv1 = deMath.swizzle(v1, [0, 1, 2]);

//     // dx & dy

//     var a = deMath.subtract(deMath.swizzle(ssv0, [0, 1, 2]), deMath.swizzle(ssp, [0, 1, 2]));
//     var b = deMath.subtract(deMath.swizzle(ssv1, [0, 1, 2]), deMath.swizzle(ssp, [0, 1, 2]));
//     var epsilon = 0.0001;
//     var det = (a[0] * b[1] - b[0] * a[1]);

//     // degenerate triangle, it won't generate any fragments anyway. Return value doesn't matter
//     if (Math.abs(det) < epsilon)
//         return 0;

//     var dxDir = [b[1] / det, -a[1] / det];
//     var dyDir = [-b[0] / det, a[0] / det];

//     var dzdx = dxDir[0] * a[2] + dxDir[1] * b[2];
//     var dzdy = dyDir[0] * a[2] + dyDir[1] * b[2];

//     // approximate using max(|dz/dx|, |dz/dy|)
//     return Math.max(Math.abs(dzdx), Math.abs(dzdy));
// };

rrRenderer.transformVertexClipCoordsToWindowCoords = function(/*const RenderState&*/ state, /*VertexPacket&*/ packet) {
    var transformed = [packet.position[0] / packet.position[3],
                                packet.position[1] / packet.position[3],
                                packet.position[2] / packet.position[3],
                                1 / packet.position[3]];
    var viewport = state.viewport.rect;
    var halfW = viewport.width / 2;
    var halfH = viewport.height / 2;
    var oX = viewport.left + halfW;
    var oY = viewport.bottom + halfH;
    var zn = state.viewport.zn;
    var zf = state.viewport.zf;

    return [
        transformed[0] * halfW + oX,
        viewport.height - (transformed[1] * halfH + oY),
        transformed[2] * (zf - zn) / 2 + (zn + zf) / 2,
        transformed[3]
    ];
};

// rrRenderer.getFloatingPointMinimumResolvableDifference = function(maxZValue, /*tcu::TextureFormat::ChannelType*/ type) {
//     if (type == tcuTexture.ChannelType.FLOAT) {
//         // 32f
//         /* TODO: Port
//         const int maxExponent = tcu::Float32(maxZValue).exponent();
//         return tcu::Float32::construct(+1, maxExponent - 23, 1 << 23).asFloat();
//         */
//     }

//     // unexpected format
//     throw new Error('Unexpected format');
// };

// rrRenderer.getFixedPointMinimumResolvableDifference = function(numBits) {
//     /* TODO: Port
//     return tcu::Float32::construct(+1, -numBits, 1 << 23).asFloat();
//     */
//     throw new Error('Unimplemented');
// };

// rrRenderer.writeFragmentPackets = function(/*const RenderState&*/                   state,
//                            /*const rrRenderer.RenderTarget&*/                  renderTarget,
//                            /*const Program&*/                      program,
//                            /*const rrFragmentOperations.Fragment**/                fragmentPackets,
//                            /*int*/                                  numRasterizedPackets,
//                            /*rr::FaceType*/                         facetype,
//                            /*const std::vector<rr::GenericVec4>&*/  fragmentOutputArray,
//                            /*const float**/                         depthValues,
//                            /*std::vector<Fragment>&*/               fragmentBuffer) {
//     var numSamples = renderTarget.colorBuffers[0].getNumSamples();
//     var numOutputs = program.fragmentShader.getOutputs().length;
//     var fragProcessor = new rrFragmentOperations.FragmentProcessor();
//     var fragCount = 0;

//     // Translate fragments but do not set the value yet
//     for (var packetNdx = 0; packetNdx < numRasterizedPackets; ++packetNdx)
//     for (var fragNdx = 0; fragNdx < 4; fragNdx++) {
//         var packet = fragmentPackets[packetNdx];
//         var xo = Math.floor(fragNdx % 2);
//         var yo = Math.floor(fragNdx / 2);

//         /* TODO: Port - needs 64 bit binary operations
//         if (getCoverageAnyFragmentSampleLive(packet.coverage, numSamples, xo, yo)) {
//             var fragment = fragmentBuffer[fragCount++];

//             fragment.pixelCoord = deMath.add(packet.position, [xo, yo]);
//             fragment.coverage = (deUint32)((packet.coverage & getCoverageFragmentSampleBits(numSamples, xo, yo)) >> getCoverageOffset(numSamples, xo, yo));
//             fragment.sampleDepths = (depthValues) ? (&depthValues[(packetNdx*4 + yo*2 + xo)*numSamples]) : (DE_NULL);
//         }
//         */
//     }

//     // Set per output output values
//     var noStencilDepthWriteState = new rrRenderState.FragmentOperationState(state.fragOps);
//     noStencilDepthWriteState.depthMask = false;
//     noStencilDepthWriteState.stencilStates[facetype].sFail = rrRenderState.StencilOp.STENCILOP_KEEP;
//     noStencilDepthWriteState.stencilStates[facetype].dpFail = rrRenderState.StencilOp.STENCILOP_KEEP;
//     noStencilDepthWriteState.stencilStates[facetype].dpPass = rrRenderState.StencilOp.STENCILOP_KEEP;

//     fragCount = 0;
//     for (var outputNdx = 0; outputNdx < numOutputs; ++outputNdx) {
//         // Only the last output-pass has default state, other passes have stencil & depth writemask=0
//         var fragOpsState = (outputNdx == numOutputs - 1) ? (state.fragOps) : (noStencilDepthWriteState);

//         for (var packetNdx = 0; packetNdx < numRasterizedPackets; ++packetNdx)
//         for (var fragNdx = 0; fragNdx < 4; fragNdx++) {
//             var packet = fragmentPackets[packetNdx];
//             var xo = Math.floor(fragNdx % 2);
//             var yo = Math.floor(fragNdx / 2);

//             /* TODO: Port
//             // Add only fragments that have live samples to shaded fragments queue.
//             if (getCoverageAnyFragmentSampleLive(packet.coverage, numSamples, xo, yo)) {
//                 var fragment = fragmentBuffer[fragCount++];
//                 fragment.value = fragmentOutputArray[(packetNdx*4 + fragNdx) * numOutputs + outputNdx];
//             }
//             */
//         }

//         // Execute per-fragment ops and write
//         fragProcessor.render(renderTarget.colorBuffers[outputNdx], renderTarget.depthBuffer, renderTarget.stencilBuffer, fragmentBuffer, fragCount, facetype, fragOpsState);
//     }
// };

// /**
//  * @constructor
//  */
// rrRenderer.Triangle = function(v0_, v1_, v2_, provokingIndex_) {
//     this.NUM_VERTICES = 3;
//     this.v0 = v0_ || null;
//     this.v1 = v1_ || null;
//     this.v2 = v2_ || null;
//     this.provokingIndex = provokingIndex_;

// };

// rrRenderer.Triangle.prototype.getProvokingVertex = function() {
//     switch (this.provokingIndex) {
//         case 0: return this.v0;
//         case 1: return this.v1;
//         case 2: return this.v2;
//         default:
//             throw new Error('Wrong provoking index:' + this.provokingIndex);
//     }
// };

// rrRenderer.Triangle.prototype.makeSharedVerticesDistinct = function(vertices, vpalloc) {
//     this.v0 = rrRenderer.makeSharedVertexDistinct(this.v0, vertices, vpalloc);
//     this.v1 = rrRenderer.makeSharedVertexDistinct(this.v1, vertices, vpalloc);
//     this.v2 = rrRenderer.makeSharedVertexDistinct(this.v2, vertices, vpalloc);
// };

// rrRenderer.Triangle.prototype.generatePrimitiveIDs = function(id) {
//     this.v0.primitiveID = id;
//     this.v1.primitiveID = id;
//     this.v2.primitiveID = id;
// };

// rrRenderer.Triangle.prototype.flatshadePrimitiveVertices = function(outputNdx) {
//     var flatValue = this.getProvokingVertex().outputs[outputNdx];
//     this.v0.outputs[outputNdx] = flatValue;
//     this.v1.outputs[outputNdx] = flatValue;
//     this.v2.outputs[outputNdx] = flatValue;
// };

// rrRenderer.Triangle.prototype.transformPrimitiveClipCoordsToWindowCoords = function(state) {
//     rrRenderer.transformVertexClipCoordsToWindowCoords(state, this.v0);
//     rrRenderer.transformVertexClipCoordsToWindowCoords(state, this.v1);
//     rrRenderer.transformVertexClipCoordsToWindowCoords(state, this.v2);
// };

// rrRenderer.Triangle.prototype.findPrimitiveMaximumDepthSlope = function() {
//     var d1 = rrRenderer.findTriangleVertexDepthSlope(this.v0.position, this.v1.position, this.v2.position);
//     var d2 = rrRenderer.findTriangleVertexDepthSlope(this.v1.position, this.v2.position, this.v0.position);
//     var d3 = rrRenderer.findTriangleVertexDepthSlope(this.v2.position, this.v0.position, this.v1.position);

//     return Math.max(d1, d2, d3);
// };

// rrRenderer.Triangle.prototype.findPrimitiveMinimumResolvableDifference = function(/*const rr::MultisampleConstPixelBufferAccess&*/ depthAccess) {
//     var maxZvalue = Math.max(this.v0.position[2], this.v1.position[2], this.v2.position[2]);
//     var format = depthAccess.raw().getFormat();
//     var order = format.order;

//     if (order == tcuTexture.ChannelOrder.D) {
//         // depth only
//         var channelType = format.type;
//         var channelClass = tcuTextureUtil.getTextureChannelClass(channelType);
//         var numBits = tcuTextureUtil.getTextureFormatBitDepth(format)[0];

//         if (channelClass == tcuTextureUtil.TextureChannelClass.FLOATING_POINT)
//             return rrRenderer.getFloatingPointMinimumResolvableDifference(maxZvalue, channelType);
//         else
//             // \note channelClass might be CLASS_LAST but that's ok
//             return rrRenderer.getFixedPointMinimumResolvableDifference(numBits);
//     } else if (order == tcuTexture.ChannelOrder.DS) {
//         // depth stencil, special cases for possible combined formats
//         if (format.type == tcuTexture.ChannelType.FLOAT_UNSIGNED_INT_24_8_REV)
//             return rrRenderer.getFloatingPointMinimumResolvableDifference(maxZvalue, tcuTexture.ChannelType.FLOAT);
//         else if (format.type == tcuTexture.ChannelType.UNSIGNED_INT_24_8)
//             return rrRenderer.getFixedPointMinimumResolvableDifference(24);
//     }

//     // unexpected format
//     throw new Error('Unexpected format');
// };

// rrRenderer.Triangle.prototype.rasterizePrimitive = function(/*const RenderState&*/                  state,
//                          /*const rrRenderer.RenderTarget&*/                renderTarget,
//                          /*const Program&*/                     program,
//                          /*const tcu::IVec4&*/                  renderTargetRect,
//                          /*rrRenderer.RasterizationInternalBuffers&*/      buffers) {
//     var numSamples = renderTarget.colorBuffers[0].getNumSamples();
//     var depthClampMin = Math.min(state.viewport.zn, state.viewport.zf);
//     var depthClampMax = Math.max(state.viewport.zn, state.viewport.zf);
//     var rasterizer = new rrRasterizer.TriangleRasterizer(renderTargetRect, numSamples, state.rasterization);
//     var depthOffset = 0;

//     rasterizer.init(this.v0.position, this.v1.position, this.v2.position);

//     // Culling
//     var visibleFace = rasterizer.getVisibleFace();
//     if ((state.cullMode == rrRenderState.CullMode.CULLMODE_FRONT && visibleFace == rrDefs.FaceType.FACETYPE_FRONT) ||
//         (state.cullMode == rrRenderState.CullMode.CULLMODE_BACK && visibleFace == rrDefs.FaceType.FACETYPE_BACK))
//         return;

//     // Shading context
//     var shadingContext = new rrShadingContext.FragmentShadingContext(this.v0.outputs, this.v1.outputs, this.v2.outputs, buffers.shaderOutputs, buffers.fragmentDepthBuffer, this.v2.primitiveID, program.fragmentShader.getOutputs().length, numSamples);

//     // Polygon offset
//     if (buffers.fragmentDepthBuffer && state.fragOps.polygonOffsetEnabled) {
//         var maximumDepthSlope = this.findPrimitiveMaximumDepthSlope();
//         var minimumResolvableDifference = this.findPrimitiveMinimumResolvableDifference(renderTarget.depthBuffer);

//         depthOffset = maximumDepthSlope * state.fragOps.polygonOffsetFactor + minimumResolvableDifference * state.fragOps.polygonOffsetUnits;
//     }

//     // Execute rrRenderer.rasterize - shade - write loop
//     while (true) {
//         // Rasterize

//         // Clear the fragmentPackets and fragmentDepthBuffer buffers before rasterizing
//         buffers.fragmentPackets.length = 0;
//         if (buffers.fragmentDepthBuffer)
//             buffers.fragmentDepthBuffer.length = 0;

//         var numRasterizedPackets = rasterizer.rasterize(buffers.fragmentPackets, buffers.fragmentDepthBuffer);

//         // numRasterizedPackets is guaranteed to be greater than zero for shadeFragments()

//         if (!numRasterizedPackets)
//             break; // Rasterization finished.

//         // Polygon offset
//         if (buffers.fragmentDepthBuffer && state.fragOps.polygonOffsetEnabled)
//             for (var sampleNdx = 0; sampleNdx < numRasterizedPackets * 4 * numSamples; ++sampleNdx)
//                 buffers.fragmentDepthBuffer[sampleNdx] = deMath.clamp(buffers.fragmentDepthBuffer[sampleNdx] + depthOffset, 0, 1);

//         // Shade

//         program.fragmentShader.shadeFragments(buffers.fragmentPackets, numRasterizedPackets, shadingContext);

//         // Depth clamp
//         if (buffers.fragmentDepthBuffer && state.fragOps.depthClampEnabled)
//             for (var sampleNdx = 0; sampleNdx < numRasterizedPackets * 4 * numSamples; ++sampleNdx)
//                 buffers.fragmentDepthBuffer[sampleNdx] = deMath.clamp(buffers.fragmentDepthBuffer[sampleNdx], depthClampMin, depthClampMax);

//         // Handle fragment shader outputs

//         rrRenderer.writeFragmentPackets(state, renderTarget, program, buffers.fragmentPackets, numRasterizedPackets, visibleFace, buffers.shaderOutputs, buffers.fragmentDepthBuffer, buffers.shadedFragments);
//     }
// };

// rrRenderer.triangles = (function() {
//     var exec = function(output, /*VertexPacket* const**/ vertices, /*size_t*/ numVertices, /*rr::ProvokingVertex*/ provokingConvention) {
//         var provokingOffset = (provokingConvention == rrDefs.ProvokingVertex.PROVOKINGVERTEX_FIRST) ? (0) : (2);

//         for (var ndx = 0; ndx + 2 < numVertices; ndx += 3)
//             output.push(new rrRenderer.Triangle(vertices[ndx], vertices[ndx + 1], vertices[ndx + 2], provokingOffset));
//     };

//     var getPrimitiveCount = function(vertices) {
//         return Math.floor(vertices / 3);
//     };

//     return {
//         exec: exec,
//         getPrimitiveCount: getPrimitiveCount
//     };
// })();

// rrRenderer.assemblers = (function() {
//     rrRenderer.assemblers = [];
//     rrRenderer.assemblers[rrRenderer.PrimitiveType.TRIANGLES] = rrRenderer.triangles;
//     return rrRenderer.assemblers;
// })();

// rrRenderer.makeSharedVerticesDistinct = function(list, /*VertexPacketAllocator&*/ vpalloc) {
//     var vertices = {};

//     for (var i = 0; i < list.length; i++)
//         list[i].makeSharedVerticesDistinct(vertices, vpalloc);
// };

// rrRenderer.generatePrimitiveIDs = function(list, /*rrRenderer.DrawContext&*/ drawContext) {
//     for (var i = 0; i < list.length; i++)
//         list[i].generatePrimitiveIDs(drawContext.primitiveID++);
// };
//
// rrRenderer.flatshadeVertices = function(/*const Program&*/ program, /*ContainerType&*/ list) {
//     // flatshade
//     var fragInputs = program.vertexShader.getOutputs();

//     for (var inputNdx = 0; inputNdx < fragInputs.length; ++inputNdx)
//         if (fragInputs[inputNdx].flatshade)
//             for (var i = 0; i < list.length; i++)
//                 list[i].flatshadePrimitiveVertices(inputNdx);
// };

// rrRenderer.transformClipCoordsToWindowCoords = function(/*const RenderState&*/ state, /*ContainerType&*/ list) {
//     for (var i = 0; i < list.length; i++)
//         list[i].transformPrimitiveClipCoordsToWindowCoords(state);
// };

// rrRenderer.rasterize = function(/*const RenderState&*/                  state,
//                 /*const rrRenderer.RenderTarget&*/                 renderTarget,
//                 /*const Program&*/                      program,
//                 /*const ContainerType&*/                list) {
//     var numSamples = renderTarget.colorBuffers[0].getNumSamples();
//     var numFragmentOutputs = program.fragmentShader.getOutputs().length;

//     var viewportRect = [state.viewport.rect.left, state.viewport.rect.bottom, state.viewport.rect.width, state.viewport.rect.height];
//     var bufferRect = renderTarget.colorBuffers[0].getBufferSize();
//     var renderTargetRect = deMath.intersect(viewportRect, bufferRect);
//     var isDepthEnabled = !renderTarget.depthBuffer.isEmpty();

//     var buffers = new rrRenderer.RasterizationInternalBuffers(isDepthEnabled);

//     // rrRenderer.rasterize
//     for (var i = 0; i < list.length; i++)
//         list[i].rasterizePrimitive(state, renderTarget, program, renderTargetRect, buffers);
// };

// /*--------------------------------------------------------------------*//*!
//  * Draws transformed rrRenderer.triangles, lines or points to render target
//  *//*--------------------------------------------------------------------*/
// rrRenderer.drawBasicPrimitives = function(/*const RenderState&*/ state, /*const rrRenderer.RenderTarget&*/ renderTarget, /*const Program&*/ program, /*ContainerType&*/ primList, /*VertexPacketAllocator&*/ vpalloc) {
//     var clipZ = !state.fragOps.depthClampEnabled;

//     // Transform feedback

//     // Flatshading
//     rrRenderer.flatshadeVertices(program, primList);

//     /* TODO: implement
//     // Clipping
//     // \todo [jarkko] is creating & swapping std::vectors really a good solution?
//     clipPrimitives(primList, program, clipZ, vpalloc);
//     */

//     // Transform vertices to window coords
//     rrRenderer.transformClipCoordsToWindowCoords(state, primList);

//     // Rasterize and paint
//     rrRenderer.rasterize(state, renderTarget, program, primList);
// };

// rrRenderer.drawAsPrimitives = function(DrawPrimitiveType, /*const RenderState&*/ state, /*const rrRenderer.RenderTarget&*/ renderTarget, /*const Program&*/ program, /*VertexPacket* const**/ vertices, /*int*/ numVertices, /*rrRenderer.DrawContext&*/ drawContext, /*VertexPacketAllocator&*/ vpalloc) {
//     // Assemble primitives (deconstruct stips & loops)
//     var assembler = rrRenderer.assemblers[DrawPrimitiveType];
//     var inputPrimitives = [];

//     assembler.exec(inputPrimitives, vertices, numVertices, state.provokingVertexConvention);

//     // Make shared vertices distinct. Needed for that the translation to screen space happens only once per vertex, and for flatshading
//     rrRenderer.makeSharedVerticesDistinct(inputPrimitives, vpalloc);

//     // A primitive ID will be generated even if no geometry shader is active
//     rrRenderer.generatePrimitiveIDs(inputPrimitives, drawContext);

//     // Draw as a basic type
//     rrRenderer.drawBasicPrimitives(state, renderTarget, program, inputPrimitives, vpalloc);
// };

rrRenderer.isValidCommand = function(/*const rrRenderer.DrawCommand&*/ command, /*int*/ numInstances) {
    /* TODO: Implement */
    return true;
};

/**
 * @constructor
 * @param {rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess} colorMultisampleBuffer
 * @param {rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess=} depthMultisampleBuffer
 * @param {rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess=} stencilMultisampleBuffer
 */
rrRenderer.RenderTarget = function(colorMultisampleBuffer, depthMultisampleBuffer, stencilMultisampleBuffer) {
    this.MAX_COLOR_BUFFERS = 4;
    this.colorBuffers = [];
    this.colorBuffers[0] = colorMultisampleBuffer;
    this.depthBuffer = depthMultisampleBuffer || new rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess();
    this.stencilBuffer = stencilMultisampleBuffer || new rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess();
    this.numColorBuffers = 1;
};

// NOTE: Program object is useless. Let's just use the sglrShaderProgram
// /**
//  * @constructor
//  * @param {rrShaders.VertexShader} vertexShader_
//  * @param {rrShaders.FragmentShader} fragmentShader_
//  */
// var Program = function(vertexShader_, fragmentShader_) {
//     this.vertexShader = vertexShader_;
//     this.fragmentShader = fragmentShader_;
// };

/**
 * @constructor
 * @param {ArrayBuffer} data
 * @param {rrDefs.IndexType} type
 * @param {number=} baseVertex_
 */
rrRenderer.DrawIndices = function(data, type, baseVertex_) {
    this.data = data;
    this.baseVertex = baseVertex_ || 0;
    this.indexType = type;
    switch (type) {
        case rrDefs.IndexType.INDEXTYPE_UINT8: this.access = new Uint8Array(data); break;
        case rrDefs.IndexType.INDEXTYPE_UINT16: this.access = new Uint16Array(data); break;
        case rrDefs.IndexType.INDEXTYPE_UINT32: this.access = new Uint32Array(data); break;
        default: throw new Error('Invalid type: ' + type);
    }
};

rrRenderer.DrawIndices.prototype.readIndexArray = function(index) { return this.access[index]; };

/**
 * @constructor
 * @param {rrRenderer.PrimitiveType} primitiveType
 * @param {number} numElements
 * @param { (number|rrRenderer.DrawIndices) } indices
 */
rrRenderer.PrimitiveList = function(primitiveType, numElements, indices) {
    this.m_primitiveType = primitiveType;
    this.m_numElements = numElements;

    if (typeof indices == 'number') {
        // !< primitive list for drawArrays-like call
        this.m_indices = null;
        this.m_indexType = undefined;
        this.m_baseVertex = indices;
    } else {
        // !< primitive list for drawElements-like call
        this.m_indices = indices;
        this.m_indexType = indices.indexType;
        this.m_baseVertex = indices.baseVertex;
    }
};

rrRenderer.PrimitiveList.prototype.getIndex = function(elementNdx) {
    if (this.m_indices) {
        var index = this.m_baseVertex + this.m_indices.readIndexArray(elementNdx);
        if (index < 0)
            throw new Error('Index must not be negative');

        return index;
    } else
        return this.m_baseVertex + elementNdx;
};

rrRenderer.PrimitiveList.prototype.isRestartIndex = function (elementNdx, restartIndex) {
    // implicit index or explicit index (without base vertex) equals restart
    if (this.m_indices)
        return this.m_indices.readIndexArray(elementNdx) == restartIndex;
    else
        return elementNdx == restartIndex;
};

rrRenderer.PrimitiveList.prototype.getNumElements = function() {return this.m_numElements;};
rrRenderer.PrimitiveList.prototype.getPrimitiveType = function() {return this.m_primitiveType;};
rrRenderer.PrimitiveList.prototype.getIndexType = function() {return this.m_indexType;};

/**
 * @constructor
 * @param {rrRenderState.RenderState} state_
 * @param {rrRenderer.RenderTarget} renderTarget_
 * @param {sglrShaderProgram.ShaderProgram} program_
 * @param {number} numVertexAttribs_
 * @param {Array<rrVertexAttrib.VertexAttrib>} vertexAttribs_
 * @param {rrRenderer.PrimitiveList} primitives_
 */
rrRenderer.DrawCommand = function(state_, renderTarget_, program_, numVertexAttribs_, vertexAttribs_, primitives_) {
    this.state = state_;
    this.renderTarget = renderTarget_;
    this.program = program_;
    this.numVertexAttribs = numVertexAttribs_;
    this.vertexAttribs = vertexAttribs_;
    this.primitives = primitives_;
};

// rrRenderer.drawInstanced = function(/*const rrRenderer.DrawCommand&*/ command, numInstances) {
//     // Do not run bad commands
//     var validCommand = rrRenderer.isValidCommand(command, numInstances);
//     if (!validCommand)
//         throw new Error('Invalid command');
//     // Do not rrRenderer.draw if nothing to rrRenderer.draw {
//     if (command.primitives.getNumElements() == 0 || numInstances == 0)
//         return;

//     // Prepare transformation

//     var numVaryings = command.program.vertexShader.getOutputs().length;
//     var vpalloc = new rrVertexPacket.VertexPacketAllocator(numVaryings);
//     var vertexPackets = vpalloc.allocArray(command.primitives.getNumElements());
//     var drawContext = new rrRenderer.DrawContext();

//     for (var instanceID = 0; instanceID < numInstances; ++instanceID) {
//         // Each instance has its own primitives
//         drawContext.primitiveID = 0;

//         for (var elementNdx = 0; elementNdx < command.primitives.getNumElements(); ++elementNdx) {
//             var numVertexPackets = 0;

//             // collect primitive vertices until restart

//             while (elementNdx < command.primitives.getNumElements() &&
//                     !(command.state.restart.enabled && command.primitives.isRestartIndex(elementNdx, command.state.restart.restartIndex))) {
//                 // input
//                 vertexPackets[numVertexPackets].instanceNdx = instanceID;
//                 vertexPackets[numVertexPackets].vertexNdx = command.primitives.getIndex(elementNdx);

//                 // output
//                 vertexPackets[numVertexPackets].pointSize = command.state.point.pointSize; // default value from the current state
//                 vertexPackets[numVertexPackets].position = [0, 0, 0, 0]; // no undefined values

//                 ++numVertexPackets;
//                 ++elementNdx;
//             }

//             // Duplicated restart shade
//             if (numVertexPackets == 0)
//                 continue;

//             // \todo Vertex cache?

//             // Transform vertices

//             command.program.shadeVertices(command.vertexAttribs, vertexPackets, numVertexPackets);

//             // Draw primitives
//             rrRenderer.drawAsPrimitives(command.primitives.getPrimitiveType(), command.state, command.renderTarget, command.program, vertexPackets, numVertexPackets, drawContext, vpalloc);
//         }
//     }
// };

// rrRenderer.draw = function(/*const rrRenderer.DrawCommand&*/ command) {
//     rrRenderer.drawInstanced(command, 1);
// };

rrRenderer.getBarycentricCoefficients = function(v, v1, v2, v3) {
    var b = [];

    var x = v[0];
    var y = v[1];
    var x1 = v1[0];
    var x2 = v2[0];
    var x3 = v3[0];
    var y1 = v1[1];
    var y2 = v2[1];
    var y3 = v3[1];

    var det = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);

    b[0] = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / det;
    b[1] = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / det;
    b[2] = 1 - b[0] - b[1];

    return b;
};

/**
 * @param {rrRenderState.RenderState} state
 * @param {rrRenderer.RenderTarget} renderTarget
 * @param {Array<rrFragmentOperations.Fragment>} fragments Fragments to write
*/
rrRenderer.writeFragments = function(state, renderTarget, fragments) {
    /* TODO: Add blending, depth, stencil ... */
    var colorbuffer = renderTarget.colorBuffers[0].raw();
    for (var i = 0; i < fragments.length; i++) {
        var fragment = fragments[i];
        colorbuffer.setPixel(fragment.output, 0, fragment.pixelCoord[0], fragment.pixelCoord[1]);
    }

};

/**
 * @param {rrRenderState.RenderState} renderState
 * @param {rrRenderer.RenderTarget} renderTarget
 * @param {Array<rrFragmentOperations.Fragment>} fragments Fragments to write
*/
rrRenderer.writeFragments2 = function(renderState, renderTarget, fragments) {
    /*
void FragmentProcessor::render (const rr::MultisamplePixelBufferAccess& msColorBuffer,
                                const rr::MultisamplePixelBufferAccess& msDepthBuffer,
                                const rr::MultisamplePixelBufferAccess& msStencilBuffer,
                                const Fragment*                             fragments,
                                int numFragments,
                                FaceType fragmentFacing,
                                const FragmentOperationState& state)
*/

    /** @const */ var fragmentFacing = rrDefs.FaceType.FACETYPE_FRONT;
    var colorBuffer = renderTarget.colorBuffers[0].raw();
    var depthBuffer = renderTarget.depthBuffer.raw();
    var stencilBuffer = renderTarget.stencilBuffer.raw();
    var state = renderState.fragOps;

    var hasDepth = depthBuffer.getWidth() > 0 && depthBuffer.getHeight() > 0 && depthBuffer.getDepth() > 0;
    var hasStencil = stencilBuffer.getWidth() > 0 && stencilBuffer.getHeight() > 0 && stencilBuffer.getDepth() > 0;
    var doDepthTest = hasDepth && state.depthTestEnabled;
    var doStencilTest = hasStencil && state.stencilTestEnabled;

    var colorbufferClass = tcuTextureUtil.getTextureChannelClass(colorBuffer.getFormat().type);
    var fragmentDataType = rrGenericVector.GenericVecType.FLOAT;
    switch (colorbufferClass) {
        case tcuTextureUtil.TextureChannelClass.SIGNED_INTEGER:
            fragmentDataType = rrGenericVector.GenericVecType.INT32;
            break;
        case tcuTextureUtil.TextureChannelClass.UNSIGNED_INTEGER:
            fragmentDataType = rrGenericVector.GenericVecType.UINT32;
            break;
    }

    if (!((!hasDepth || colorBuffer.getWidth() == depthBuffer.getWidth()) && (!hasStencil || colorBuffer.getWidth() == stencilBuffer.getWidth())))
        throw new Error('Attachment must have the same width');
    if (!((!hasDepth || colorBuffer.getHeight() == depthBuffer.getHeight()) && (!hasStencil || colorBuffer.getHeight() == stencilBuffer.getHeight())))
        throw new Error('Attachment must have the same height');
    if (!((!hasDepth || colorBuffer.getDepth() == depthBuffer.getDepth()) && (!hasStencil || colorBuffer.getDepth() == stencilBuffer.getDepth())))
        throw new Error('Attachment must have the same depth');

    var stencilState = state.stencilStates[fragmentFacing];
    var colorMaskFactor = [state.colorMask[0] ? true : false, state.colorMask[1] ? true : false, state.colorMask[2] ? true : false, state.colorMask[3] ? true : false];
    var colorMaskNegationFactor = [state.colorMask[0] ? false : true, state.colorMask[1] ? false : true, state.colorMask[2] ? false : true, state.colorMask[3] ? false : true];
    var sRGBTarget = false;

    // Scissor test.

    if (state.scissorTestEnabled)
        rrFragmentOperations.executeScissorTest(fragments, state.scissorRectangle);

    // Stencil test.

    if (doStencilTest) {
        rrFragmentOperations.executeStencilCompare(fragments, stencilState, state.numStencilBits, stencilBuffer);
        rrFragmentOperations.executeStencilSFail(fragments, stencilState, state.numStencilBits, stencilBuffer);
    }

    // Depth test.
    // \note Current value of isAlive is needed for dpPass and dpFail, so it's only updated after them and not right after depth test.

    if (doDepthTest) {
        rrFragmentOperations.executeDepthCompare(fragments, state.depthFunc, depthBuffer);

        if (state.depthMask)
            rrFragmentOperations.executeDepthWrite(fragments, depthBuffer);
    }

    // Do dpFail and dpPass stencil writes.

    if (doStencilTest)
        rrFragmentOperations.executeStencilDpFailAndPass(fragments, stencilState, state.numStencilBits, stencilBuffer);

    // Kill the samples that failed depth test.

    if (doDepthTest) {
        for (var i = 0; i < fragments.length; i++)
            fragments[i].isAlive = fragments[i].isAlive && fragments[i].depthPassed;
    }

    // Paint fragments to target

    switch (fragmentDataType) {
        case rrGenericVector.GenericVecType.FLOAT:
            // Blend calculation - only if using blend.
            if (state.blendMode == rrRenderState.BlendMode.STANDARD) {
                // Put dst color to register, doing srgb-to-linear conversion if needed.
                for (var i = 0; i < fragments.length; i++) {
                    var frag = fragments[i];
                    if (frag.isAlive) {
                        var fragSampleNdx = 1;
                        var dstColor = colorBuffer.getPixel(fragSampleNdx, frag.pixelCoord[0], frag.pixelCoord[1]);

                        /* TODO: Check frag.value and frag.value1 types */
                        frag.clampedBlendSrcColor = deMath.clampVector(frag.value, 0, 1);
                        frag.clampedBlendSrc1Color = deMath.clampVector(frag.value1, 0, 1);
                        frag.clampedBlendDstColor = deMath.clampVector(sRGBTarget ? tcuTexture.sRGBToLinear(dstColor) : dstColor, 0, 1);
                    }
                }

                // Calculate blend factors to register.
                rrFragmentOperations.executeBlendFactorComputeRGB(fragments, state.blendColor, state.blendRGBState);
                rrFragmentOperations.executeBlendFactorComputeA(fragments, state.blendColor, state.blendAState);

                // Compute blended color.
                rrFragmentOperations.executeBlend(fragments, state.blendRGBState, state.blendAState);
            } else {
                // Not using blend - just put values to register as-is.

                for (var i = 0; i < fragments.length; i++) {
                    var frag = fragments[i];
                    if (frag.isAlive) {
                        frag.blendedRGB = deMath.swizzle(frag.value, [0, 1, 2]);
                        frag.blendedA = frag.value[3];
                    }
                }
            }

            // Finally, write the colors to the color buffer.

            if (state.colorMask[0] && state.colorMask[1] && state.colorMask[2] && state.colorMask[3]) {
                /* TODO: Add quick path */
                // if (colorBuffer.getFormat().isEqual(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8)))
                //     executeRGBA8ColorWrite(fragments, colorBuffer);
                // else
                    rrFragmentOperations.executeColorWrite(fragments, sRGBTarget, colorBuffer);
            } else if (state.colorMask[0] || state.colorMask[1] || state.colorMask[2] || state.colorMask[3])
                rrFragmentOperations.executeMaskedColorWrite(fragments, colorMaskFactor, colorMaskNegationFactor, sRGBTarget, colorBuffer);
            break;

        case rrGenericVector.GenericVecType.INT32:
            // Write fragments
            for (var i = 0; i < fragments.length; i++) {
                var frag = fragments[i];
                if (frag.isAlive) {
                    frag.signedValue = frag.value;
                }
            }

            if (state.colorMask[0] || state.colorMask[1] || state.colorMask[2] || state.colorMask[3])
                rrFragmentOperations.executeSignedValueWrite(fragments, state.colorMask, colorBuffer);
            break;

        case rrGenericVector.GenericVecType.UINT32:
            // Write fragments
           for (var i = 0; i < fragments.length; i++) {
                var frag = fragments[i];
                if (frag.isAlive) {
                    frag.unsignedValue = frag.value;
                }
            }

            if (state.colorMask[0] || state.colorMask[1] || state.colorMask[2] || state.colorMask[3])
                rrFragmentOperations.executeUnsignedValueWrite(fragments, state.colorMask, colorBuffer);
            break;

        default:
            throw new Error('Unrecognized fragment data type:' + fragmentDataType);
    }
};

/**
 */
rrRenderer.drawQuads = function(state, renderTarget, program, vertexAttribs, first, count) {
    var primitives = new rrRenderer.PrimitiveList(gl.TRIANGLES, count * 2 * 3, first); // 2 triangles per quad with 3 vertices each.
    // Do not draw if nothing to draw
    if (primitives.getNumElements() == 0)
        return;

    // Prepare transformation
    var numVaryings = program.vertexShader.getOutputs().length;
    var vpalloc = new rrVertexPacket.VertexPacketAllocator(numVaryings);
    var vertexPackets = vpalloc.allocArray(primitives.getNumElements());
    var drawContext = new rrRenderer.DrawContext();
    drawContext.primitiveID = 0;
    var instanceID = 0;

    var numberOfVertices = primitives.getNumElements();
    for (var elementNdx = 0; elementNdx < numberOfVertices; ++elementNdx)
    {
        var numVertexPackets = 0;

        // collect primitive vertices until restart
        while (elementNdx < numberOfVertices &&
            !(state.restart.enabled && primitives.isRestartIndex(elementNdx, state.restart.restartIndex)))
        {
            // input
            vertexPackets[numVertexPackets].instanceNdx = instanceID;
            vertexPackets[numVertexPackets].vertexNdx = primitives.getIndex(elementNdx);

            // output
            vertexPackets[numVertexPackets].pointSize = state.point.pointSize; // default value from the current state
            vertexPackets[numVertexPackets].position = [0, 0, 0, 0]; // no undefined values

            ++numVertexPackets;
            ++elementNdx;
        }

        // Duplicated restart shade
        if (numVertexPackets == 0)
            continue;

        // \todo Vertex cache?

        // Transform vertices

        program.shadeVertices(vertexAttribs, vertexPackets, numVertexPackets);
    }

    // For each quad, we get a group of four vertex packets
    for (var quad = 0; quad < count; quad++) {
        var bottomLeftVertexNdx = 0;
        var bottomRightVertexNdx = 1;
        var topLeftVertexNdx = 2;
        var topRightVertexNdx = 3;

        /*var glToCanvasXCoordFactor = state.viewport.rect.width;
        var glToCanvasYCoordFactor = -state.viewport.rect.height;

        var topLeft = [
            (state.viewport.rect.width / 2) + Math.floor(vertexPackets[(quad * 6) + topLeftVertexNdx].position[0] * glToCanvasXCoordFactor),
            (state.viewport.rect.height / 2) + Math.floor(vertexPackets[(quad * 6) + topLeftVertexNdx].position[1] * glToCanvasYCoordFactor)
        ];
        var bottomRight = [
            (state.viewport.rect.width / 2) + Math.floor(vertexPackets[(quad * 6) + bottomRightVertexNdx].position[0] * glToCanvasXCoordFactor),
            (state.viewport.rect.height / 2) + Math.floor(vertexPackets[(quad * 6) + bottomRightVertexNdx].position[1] * glToCanvasYCoordFactor)
        ];*/

        var topLeft = rrRenderer.transformVertexClipCoordsToWindowCoords(state, vertexPackets[(quad * 6) + topLeftVertexNdx]);
        var bottomRight = rrRenderer.transformVertexClipCoordsToWindowCoords(state, vertexPackets[(quad * 6) + bottomRightVertexNdx]);

        var v0 = [topLeft[0], topLeft[1]];
        var v1 = [topLeft[0], bottomRight[1]];
        var v2 = [bottomRight[0], topLeft[1]];
        var v3 = [bottomRight[0], bottomRight[1]];
        var width = bottomRight[0] - topLeft[0];
        var height = bottomRight[1] - topLeft[1];

        // Generate two rrRenderer.triangles [v0, v1, v2] and [v2, v1, v3]
        var shadingContextTopLeft = new rrShadingContext.FragmentShadingContext(
            vertexPackets[(quad * 6) + topLeftVertexNdx].outputs,
            vertexPackets[(quad * 6) + bottomLeftVertexNdx].outputs,
            vertexPackets[(quad * 6) + topRightVertexNdx].outputs, null, 1
        );
        var packetsTopLeft = [];

        var shadingContextBottomRight = new rrShadingContext.FragmentShadingContext(
            vertexPackets[(quad * 6) + topRightVertexNdx].outputs,
            vertexPackets[(quad * 6) + bottomLeftVertexNdx].outputs,
            vertexPackets[(quad * 6) + bottomRightVertexNdx].outputs, null, 1
        );
        var packetsBottomRight = [];

        for (var i = 0; i < width; i++)
            for (var j = 0; j < height; j++) {
                var x = v0[0] + i + 0.5;
                var y = v0[1] + j + 0.5;

                var xf = (i + 0.5) / width;
                var yf = (j + 0.5) / height;
                var triNdx = xf + yf >= 1;
                if (!triNdx) {
                    var b = rrRenderer.getBarycentricCoefficients([x, y], v0, v1, v2);
                    packetsTopLeft.push(new rrFragmentOperations.Fragment(b, [v0[0] + i, v0[1] + j]));
                } else {
                    var b = rrRenderer.getBarycentricCoefficients([x, y], v2, v1, v3);
                    packetsBottomRight.push(new rrFragmentOperations.Fragment(b, [v0[0] + i, v0[1] + j]));
                }
            }

        program.fragmentShader.shadeFragments(packetsTopLeft, shadingContextTopLeft);
        program.fragmentShader.shadeFragments(packetsBottomRight, shadingContextBottomRight);

        rrRenderer.writeFragments2(state, renderTarget, packetsTopLeft);
        rrRenderer.writeFragments2(state, renderTarget, packetsBottomRight);
    }
};

});
