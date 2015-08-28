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
var TexImageUtils = (function() {

  "use strict";

  var wtu = WebGLTestUtils;

  /**
   * A vertex shader for a single texture.
   * @type {string}
   */
  var simpleTextureVertexShaderES3 = [
    '#version 300 es',
    'in vec4 vPosition;',
    'in vec2 texCoord0;',
    'out vec2 texCoord;',
    'void main() {',
    '    gl_Position = vPosition;',
    '    texCoord = texCoord0;',
    '}'].join('\n');

  /**
   * A fragment shader for a single integer texture.
   * @type {string}
   */
  var simpleUintTextureFragmentShaderES3 = [
    '#version 300 es',
    'precision mediump float;',
    'uniform usampler2D tex;',
    'in vec2 texCoord;',
    'out vec4 fragData;',
    'void main() {',
    '    fragData.rgb = texture(tex, texCoord).rgb / 255.0;',
    '    fragData.a = 1;',
    '}'].join('\n');

  /**
   * A fragment shader for a single cube map integer texture.
   * @type {string}
   */
    // A fragment shader for a single integer cube map texture.
  var simpleCubeMapUintTextureFragmentShaderES3 = [
    '#version 300 es',
    'precision mediump float;',
    'uniform usamplerCube tex;',
    'uniform int face;',
    'in vec2 texCoord;',
    'out vec4 fragData;',
    'void main() {',
    // Transform [0, 1] -> [-1, 1]
    '    vec2 texC2 = (texCoord * 2.) - 1.;',
    // Transform 2d tex coord. to each face of TEXTURE_CUBE_MAP coord.
    '    vec3 texCube = vec3(0., 0., 0.);',
    '    if (face == 34069) {',         // TEXTURE_CUBE_MAP_POSITIVE_X
    '        texCube = vec3(1., -texC2.y, -texC2.x);',
    '    } else if (face == 34070) {',  // TEXTURE_CUBE_MAP_NEGATIVE_X
    '        texCube = vec3(-1., -texC2.y, texC2.x);',
    '    } else if (face == 34071) {',  // TEXTURE_CUBE_MAP_POSITIVE_Y
    '        texCube = vec3(texC2.x, 1., texC2.y);',
    '    } else if (face == 34072) {',  // TEXTURE_CUBE_MAP_NEGATIVE_Y
    '        texCube = vec3(texC2.x, -1., -texC2.y);',
    '    } else if (face == 34073) {',  // TEXTURE_CUBE_MAP_POSITIVE_Z
    '        texCube = vec3(texC2.x, -texC2.y, 1.);',
    '    } else if (face == 34074) {',  // TEXTURE_CUBE_MAP_NEGATIVE_Z
    '        texCube = vec3(-texC2.x, -texC2.y, -1.);',
    '    }',
    '    fragData.rgb = texture(tex, texCube).rgb / 255.0;',
    '    fragData.a = 1;',
    '}'].join('\n');

  /**
   * Creates a simple texture vertex shader.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @return {!WebGLShader}
   */
  var setupSimpleTextureVertexShader = function(gl) {
    return WebGLTestUtils.loadShader(gl, simpleTextureVertexShaderES3, gl.VERTEX_SHADER);
  };

  /**
   * Creates a simple unsigned integer texture fragment shader.
   * Output is scaled by 1/255 to bring the result into normalized float range.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @return {!WebGLShader}
   */
  var setupSimpleUintTextureFragmentShader = function(gl) {
    return WebGLTestUtils.loadShader(gl, simpleUintTextureFragmentShaderES3, gl.FRAGMENT_SHADER);
  };

  /**
   * Creates a simple cube map unsigned integer texture fragment shader.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @return {!WebGLShader}
   */
  var setupSimpleCubeMapUintTextureFragmentShader = function(gl) {
    return WebGLTestUtils.loadShader(gl, simpleCubeMapUintTextureFragmentShaderES3, gl.FRAGMENT_SHADER);
  };

  /**
   * Creates a simple unsigned integer texture program.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {number} opt_positionLocation The attrib location for position.
   * @param {number} opt_texcoordLocation The attrib location for texture coords.
   * @return {WebGLProgram}
   */
  var setupSimpleUintTextureProgram = function(gl, opt_positionLocation, opt_texcoordLocation)
  {
    opt_positionLocation = opt_positionLocation || 0;
    opt_texcoordLocation = opt_texcoordLocation || 1;
    var vs = setupSimpleTextureVertexShader(gl),
        fs = setupSimpleUintTextureFragmentShader(gl);
    if (!vs || !fs) {
      return null;
    }
    var program = WebGLTestUtils.setupProgram(
      gl,
      [vs, fs],
      ['vPosition', 'texCoord0'],
      [opt_positionLocation, opt_texcoordLocation]);
    if (!program) {
      gl.deleteShader(fs);
      gl.deleteShader(vs);
    }
    gl.useProgram(program);
    return program;
  };

  /**
   * Creates a simple cube map unsigned integer texture program.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {number} opt_positionLocation The attrib location for position.
   * @param {number} opt_texcoordLocation The attrib location for texture coords.
   * @return {WebGLProgram}
   */
  var setupSimpleCubeMapUintTextureProgram = function(gl, opt_positionLocation, opt_texcoordLocation) {
    opt_positionLocation = opt_positionLocation || 0;
    opt_texcoordLocation = opt_texcoordLocation || 1;
    var vs = setupSimpleTextureVertexShader(gl);
    var fs = setupSimpleCubeMapUintTextureFragmentShader(gl);
    if (!vs || !fs) {
      return null;
    }
    var program = WebGLTestUtils.setupProgram(
      gl,
      [vs, fs],
      ['vPosition', 'texCoord0'],
      [opt_positionLocation, opt_texcoordLocation]);
    if (!program) {
      gl.deleteShader(fs);
      gl.deleteShader(vs);
    }
    gl.useProgram(program);
    return program;
  };

  /**
   * Creates a program and buffers for rendering a unsigned integer textured quad.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @return {!WebGLProgram}
   */
  var setupUintTexturedQuad = function(gl) {
    var program = setupSimpleUintTextureProgram(gl);
    wtu.setupUnitQuad(gl);
    return program;
  };

  /**
   * Creates a program and buffers for rendering a textured quad with
   * a cube map unsigned integer texture.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @return {!WebGLProgram}
   */
  var setupUintTexturedQuadWithCubeMap = function(gl)
  {
    var program = setupSimpleCubeMapUintTextureProgram(gl);
    wtu.setupUnitQuad(gl);
    return program;
  };

  /**
   * Does the GL internal format represent an unsigned integer format
   * texture?
   * @return {boolean}
   */
  var isUintFormat = function(internalFormat)
  {
    return (internalFormat == "R8UI" ||
            internalFormat == "RG8UI" ||
            internalFormat == "RGB8UI" ||
            internalFormat == "RGBA8UI");
  };

  /**
   * Createa a program and buffers for rendering a textured quad for
   * tex-image-and-sub-image tests. Handle selection of correct
   * program to handle texture format.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} internalFormat The internal format for texture to be tested.
   */
  var setupTexturedQuad = function(gl, internalFormat)
  {
    if (isUintFormat(internalFormat))
      return setupUintTexturedQuad(gl);

    return wtu.setupTexturedQuad(gl);
  };

  /**
   * Createa a program and buffers for rendering a textured quad with
   * a cube map for tex-image-and-sub-image tests. Handle selection of
   * correct program to handle texture format.
   * @param {!WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} internalFormat The internal format for texture to be tested.
   */
  function setupTexturedQuadWithCubeMap(gl, internalFormat)
  {
    if (isUintFormat(internalFormat))
      return setupUintTexturedQuadWithCubeMap(gl);

    return wtu.setupTexturedQuadWithCubeMap(gl);
  }

  return {
    setupTexturedQuad: setupTexturedQuad,
    setupTexturedQuadWithCubeMap: setupTexturedQuadWithCubeMap
  };

}());
