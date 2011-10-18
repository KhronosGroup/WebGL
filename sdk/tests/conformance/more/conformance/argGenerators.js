// ArgGenerators contains argument generators for WebGL functions.
// The argument generators are used for running random tests against the WebGL
// functions.
//
// ArgGenerators is an object consisting of functionName : argGen -properties.
//
// functionName is a WebGL context function name and the argGen is an argument
// generator object that encapsulates the requirements to run
// randomly generated tests on the WebGL function.
//
// An argGen object has the following methods:
//   - setup    -- set up state for testing the GL function, returns values
//                 that need cleanup in teardown. Run once before entering a
//                 test loop.
//   - teardown -- do cleanup on setup's return values after testing is complete
//   - generate -- generate a valid set of random arguments for the GL function
//   - returnValueCleanup -- do cleanup on value returned by the tested GL function
//   - cleanup  -- do cleanup on generated arguments from generate
//   - checkArgValidity -- check if passed args are valid. Has a call signature
//                         that matches generate's return value. Returns true
//                         if args are valid, false if not.
//
//   Example test loop that demonstrates how the function args and return
//   values flow together:
//
//   var setupArgs = argGen.setup();
//   for (var i=0; i<numberOfTests; i++) {
//     var generatedArgs = argGen.generate.apply(argGen, setupArgs);
//     var validArgs = argGen.checkArgValidity.apply(argGen, generatedArgs);
//     var rv = call the GL function with generatedArgs;
//     argGen.returnValueCleanup(rv);
//     argGen.cleanup.apply(argGen, generatedArgs);
//   }
//   argGen.teardown.apply(argGen, setupArgs);
//
ArgGenerators = {

// GL functions in alphabetical order

// A

  activeTexture : {
    generate : function() { return [textureUnit.random()]; },
    checkArgValidity : function(t) { return textureUnit.has(t); },
    teardown : function() { GL.activeTexture(GL.TEXTURE0); }
  },
  attachShader : {
    generate : function() {
      var p = GL.createProgram();
      var sh = GL.createShader(shaderType.random());
      return [p, sh];
    },
    checkArgValidity : function(p, sh) {
      return GL.isProgram(p) && GL.isShader(sh) && !GL.getAttachedShaders(p).has(sh);
    },
    cleanup : function(p, sh) {
      try {GL.detachShader(p,sh);} catch(e) {}
      try {GL.deleteProgram(p);} catch(e) {}
      try {GL.deleteShader(sh);} catch(e) {}
    }
  },

// B

  bindAttribLocation : {
    generate : function() {
      var program = GL.createProgram();
      return [program, randomVertexAttribute(), randomName()];
    },
    checkArgValidity : function(program, index, name) {
      return GL.isProgram(program) && isVertexAttribute(index) && isValidName(name);
    },
    cleanup : function(program, index, name) {
      try { GL.deleteProgram(program); } catch(e) {}
    }
  },
  bindBuffer : {
    generate : function(buf) {
      return [bufferTarget.random(), GL.createBuffer()];
    },
    checkArgValidity : function(target, buf) {
      if (!bufferTarget.has(target))
        return false;
      GL.bindBuffer(target, buf);
      return GL.isBuffer(buf);
    },
    cleanup : function(t, buf, m) {
      GL.deleteBuffer(buf);
    }
  },
  bindFramebuffer : {
    generate : function() {
      return [GL.FRAMEBUFFER, Math.random() > 0.5 ? null : GL.createFramebuffer()];
    },
    checkArgValidity : function(target, fbo) {
      if (target != GL.FRAMEBUFFER)
        return false;
      if (fbo != null)
          GL.bindFramebuffer(target, fbo);
      return (fbo == null || GL.isFramebuffer(fbo));
    },
    cleanup : function(target, fbo) {
      GL.bindFramebuffer(target, null);
      if (fbo)
        GL.deleteFramebuffer(fbo);
    }
  },
  bindRenderbuffer : {
    generate : function() {
      return [GL.RENDERBUFFER, Math.random() > 0.5 ? null : GL.createRenderbuffer()];
    },
    checkArgValidity : function(target, rbo) {
      if (target != GL.RENDERBUFFER)
        return false;
      if (rbo != null)
        GL.bindRenderbuffer(target, rbo);
      return (rbo == null || GL.isRenderbuffer(rbo));
    },
    cleanup : function(target, rbo) {
      GL.bindRenderbuffer(target, null);
      if (rbo)
        GL.deleteRenderbuffer(rbo);
    }
  },
  bindTexture : {
    generate : function() {
      return [bindTextureTarget.random(), Math.random() > 0.5 ? null : GL.createTexture()];
    },
    checkArgValidity : function(target, o) {
      if (!bindTextureTarget.has(target))
        return false;
      if (o != null)
        GL.bindTexture(target, o);
      return (o == null || GL.isTexture(o));
    },
    cleanup : function(target, o) {
      GL.bindTexture(target, null);
      if (o)
        GL.deleteTexture(o);
    }
  },
  blendColor : {
    generate : function() { return randomColor(); },
    teardown : function() { GL.blendColor(0,0,0,0); }
  },
  blendEquation : {
    generate : function() { return [blendEquationMode.random()]; },
    checkArgValidity : function(o) { return blendEquationMode.has(o); },
    teardown : function() { GL.blendEquation(GL.FUNC_ADD); }
  },
  blendEquationSeparate : {
    generate : function() {
      return [blendEquationMode.random(), blendEquationMode.random()];
    },
    checkArgValidity : function(o,p) {
      return blendEquationMode.has(o) && blendEquationMode.has(p);
    },
    teardown : function() { GL.blendEquationSeparate(GL.FUNC_ADD, GL.FUNC_ADD); }
  },
  blendFunc : {
    generate : function() {
      return [blendFuncSfactor.random(), blendFuncDfactor.random()];
    },
    checkArgValidity : function(s,d) {
      return blendFuncSfactor.has(s) && blendFuncDfactor.has(d);
    },
    teardown : function() { GL.blendFunc(GL.ONE, GL.ZERO); }
  },
  blendFuncSeparate : {
    generate : function() {
      return [blendFuncSfactor.random(), blendFuncDfactor.random(),
              blendFuncSfactor.random(), blendFuncDfactor.random()];
    },
    checkArgValidity : function(s,d,as,ad) {
      return blendFuncSfactor.has(s) && blendFuncDfactor.has(d) &&
              blendFuncSfactor.has(as) && blendFuncDfactor.has(ad) ;
    },
    teardown : function() {
      GL.blendFuncSeparate(GL.ONE, GL.ZERO, GL.ONE, GL.ZERO);
    }
  },
  bufferData : {
    setup : function() {
      var buf = GL.createBuffer();
      var ebuf = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, buf);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ebuf);
      return [buf, ebuf];
    },
    generate : function(buf, ebuf) {
      return [bufferTarget.random(), randomBufferData(), bufferMode.random()];
    },
    checkArgValidity : function(target, bufData, mode) {
      return bufferTarget.has(target) && isBufferData(bufData) && bufferMode.has(mode);
    },
    teardown : function(buf, ebuf) {
      GL.deleteBuffer(buf);
      GL.deleteBuffer(ebuf);
    },
  },
  bufferSubData : {
    setup : function() {
      var buf = GL.createBuffer();
      var ebuf = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, buf);
      GL.bufferData(GL.ARRAY_BUFFER, 256, GL.STATIC_DRAW);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ebuf);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, 256, GL.STATIC_DRAW);
      return [buf, ebuf];
    },
    generate : function(buf, ebuf) {
      var d = randomBufferSubData(256);
      return [bufferTarget.random(), d.offset, d.data];
    },
    checkArgValidity : function(target, offset, data) {
      return bufferTarget.has(target) && offset >= 0 && data.byteLength >= 0 && offset + data.byteLength <= 256;
    },
    teardown : function(buf, ebuf) {
      GL.deleteBuffer(buf);
      GL.deleteBuffer(ebuf);
    },
  },

// C

  checkFramebufferStatus : {
    generate : function() {
      return [Math.random() > 0.5 ? null : GL.createFramebuffer()];
    },
    checkArgValidity : function(fbo) {
      if (fbo != null)
        GL.bindFramebuffer(GL.FRAMEBUFFER, fbo);
      return fbo == null || GL.isFramebuffer(fbo);
    },
    cleanup : function(fbo){
      GL.bindFramebuffer(GL.FRAMEBUFFER, null);
      if (fbo != null)
        try{ GL.deleteFramebuffer(fbo); } catch(e) {}
    }
  },
  clear : {
    generate : function() { return [clearMask.random()]; },
    checkArgValidity : function(mask) { return clearMask.has(mask); }
  },
  clearColor : {
    generate : function() { return randomColor(); },
    teardown : function() { GL.clearColor(0,0,0,0); }
  },
  clearDepth : {
    generate : function() { return [Math.random()]; },
    teardown : function() { GL.clearDepth(1); }
  },
  clearStencil : {
    generate : function() { return [randomStencil()]; },
    teardown : function() { GL.clearStencil(0); }
  },
  colorMask : {
    generate : function() {
      return [randomBool(), randomBool(), randomBool(), randomBool()];
    },
    teardown : function() { GL.colorMask(true, true, true, true); }
  },
  compileShader : {}, // FIXME
  copyTexImage2D : {}, // FIXME
  copyTexSubImage2D : {}, // FIXME
  createBuffer : {
    generate : function() { return []; },
    returnValueCleanup : function(o) { GL.deleteBuffer(o); }
  },
  createFramebuffer : {
    generate : function() { return []; },
    returnValueCleanup : function(o) { GL.deleteFramebuffer(o); }
  },
  createProgram : {
    generate : function() { return []; },
    returnValueCleanup : function(o) { GL.deleteProgram(o); }
  },
  createRenderbuffer : {
    generate : function() { return []; },
    returnValueCleanup : function(o) { GL.deleteRenderbuffer(o); }
  },
  createShader : {
    generate : function() { return [shaderType.random()]; },
    checkArgValidity : function(t) { return shaderType.has(t); },
    returnValueCleanup : function(o) { GL.deleteShader(o); }
  },
  createTexture : {
    generate : function() { return []; },
    returnValueCleanup : function(o) { GL.deleteTexture(o); }
  },
  cullFace : {
    generate : function() { return [cullFace.random()]; },
    checkArgValidity : function(f) { return cullFace.has(f); },
    teardown : function() { GL.cullFace(GL.BACK); }
  }

};
