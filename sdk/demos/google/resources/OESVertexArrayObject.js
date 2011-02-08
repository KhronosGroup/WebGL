var WebGLVertexArrayObjectOES = function WebGLVertexArrayObjectOES(ext) {
    var gl = ext.gl;
    
    this.ext = ext;
    this.isAlive = true;
    this.hasBeenBound = false;
    
    this.elementArrayBuffer = null;
    this.attribs = new Array(ext.maxVertexAttribs);
    for (var n = 0; n < this.attribs.length; n++) {
        var attrib = new WebGLVertexArrayObjectOES.VertexAttrib(gl);
        this.attribs[n] = attrib;
    }
};

WebGLVertexArrayObjectOES.VertexAttrib = function VertexAttrib(gl) {
    this.enabled = false;
    this.buffer = null;
    this.size = 4;
    this.type = gl.FLOAT;
    this.normalized = false;
    this.stride = 16;
    this.offset = 0;
};

var OESVertexArrayObject = function OESVertexArrayObject(gl) {
    var self = this;
    this.gl = gl;
    
    this.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    
    this.defaultVertexArrayObject = new WebGLVertexArrayObjectOES(this);
    this.currentVertexArrayObject = this.defaultVertexArrayObject;
    
    this.currentArrayBuffer = null;
    
    this.dummyBuffer = gl.createBuffer();
    
    var original = this.original = {
        getParameter: gl.getParameter,
        enableVertexAttribArray: gl.enableVertexAttribArray,
        disableVertexAttribArray: gl.disableVertexAttribArray,
        bindBuffer: gl.bindBuffer,
        getVertexAttrib: gl.getVertexAttrib,
        vertexAttribPointer: gl.vertexAttribPointer
    };
    
    gl.getParameter = function getParameter(pname) {
        if (pname == self.VERTEX_ARRAY_BINDING_OES) {
            if (self.currentVertexArrayObject == self.defaultVertexArrayObject) {
                return null;
            } else {
                return self.currentVertexArrayObject;
            }
        }
        return original.getParameter.apply(this, arguments);
    };
    
    gl.enableVertexAttribArray = function enableVertexAttribArray(index) {
        var attrib = self.currentVertexArrayObject.attribs[index];
        attrib.enabled = true;
        return original.enableVertexAttribArray.apply(this, arguments);
    };
    gl.disableVertexAttribArray = function disableVertexAttribArray(index) {
        var attrib = self.currentVertexArrayObject.attribs[index];
        attrib.enabled = false;
        return original.disableVertexAttribArray.apply(this, arguments);
    };
    
    gl.bindBuffer = function bindBuffer(target, buffer) {
        switch (target) {
            case gl.ARRAY_BUFFER:
                self.currentArrayBuffer = buffer;
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                self.currentVertexArrayObject.elementArrayBuffer = buffer;
                break;
        }
        return original.bindBuffer.apply(this, arguments);
    };
    
    gl.getVertexAttrib = function getVertexAttrib(index, pname) {
        var attrib = self.currentVertexArrayObject.attribs[index];
        switch (pname) {
            case gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:
                return attrib.buffer;
            case gl.VERTEX_ATTRIB_ARRAY_ENABLED:
                return attrib.enabled;
            case gl.VERTEX_ATTRIB_ARRAY_SIZE:
                return attrib.size;
            case gl.VERTEX_ATTRIB_ARRAY_STRIDE:
                return attrib.stride;
            case gl.VERTEX_ATTRIB_ARRAY_TYPE:
                return attrib.type;
            case gl.VERTEX_ATTRIB_ARRAY_NORMALIZED:
                return attrib.normalized;
            default:
                return original.getVertexAttrib.apply(this, arguments);
        }
    };
    
    gl.vertexAttribPointer = function vertexAttribPointer(indx, size, type, normalized, stride, offset) {
        var attrib = self.currentVertexArrayObject.attribs[indx];
        attrib.buffer = self.currentArrayBuffer;
        attrib.size = size;
        attrib.type = type;
        attrib.normalized = normalized;
        attrib.stride = stride;
        attrib.offset = offset;
        return original.vertexAttribPointer.apply(this, arguments);
    };
    
    if (gl.instrumentExtension) {
        gl.instrumentExtension(this, "OES_vertex_array_object");
    }
};

OESVertexArrayObject.prototype.VERTEX_ARRAY_BINDING_OES = 0x85B5;

OESVertexArrayObject.prototype.createVertexArrayOES = function createVertexArrayOES() {
    var arrayObject = new WebGLVertexArrayObjectOES(this);
    return arrayObject;
};

OESVertexArrayObject.prototype.deleteVertexArrayOES = function deleteVertexArrayOES(arrayObject) {
    arrayObject.isAlive = false;
};

OESVertexArrayObject.prototype.isVertexArrayOES = function isVertexArrayOES(arrayObject) {
    if (arrayObject && arrayObject instanceof WebGLVertexArrayObjectOES) {
        if (arrayObject.hasBeenBound && arrayObject.ext == this) {
            return true;
        }
    }
    return false;
};

OESVertexArrayObject.prototype.bindVertexArrayOES = function bindVertexArrayOES(arrayObject) {
    var gl = this.gl;
    var original = this.original;

    var oldVAO = this.currentVertexArrayObject;
    this.currentVertexArrayObject = arrayObject || this.defaultVertexArrayObject;
    this.currentVertexArrayObject.hasBeenBound = true;
    var newVAO = this.currentVertexArrayObject;
    
    if (oldVAO == newVAO) {
        return;
    }
    
    var capturedOldBinding = false;
    var oldBinding = null;
    var currentBinding = null;

    if (newVAO.elementArrayBuffer != oldVAO.elementArrayBuffer) {
        original.bindBuffer.call(gl, gl.ELEMENT_ARRAY_BUFFER, newVAO.elementArrayBuffer);
    }
    
    for (var n = 0; n < this.maxVertexAttribs; n++) {
        var attrib = newVAO.attribs[n];
        var oldAttrib = oldVAO.attribs[n];
        
        if (attrib.enabled != oldAttrib.enabled) {
            if (attrib.enabled) {
                original.enableVertexAttribArray.call(gl, n);
            } else {
                original.disableVertexAttribArray.call(gl, n);
            }
        }
        
        if (attrib.buffer != oldAttrib.buffer) {
            if (!capturedOldBinding) {
                oldBinding = original.getParameter.call(gl, gl.ARRAY_BUFFER_BINDING);
                capturedOldBinding = true;
                currentBinding = oldBinding;
            }
            if (attrib.buffer) {
                if (currentBinding != attrib.buffer) {
                    original.bindBuffer.call(gl, gl.ARRAY_BUFFER, attrib.buffer);
                    currentBinding = attrib.buffer;
                }
            } else {
                if (currentBinding != this.dummyBuffer) {
                    // Set a dummy buffer so the vertexAttribPointer call will succeed
                    original.bindBuffer.call(gl, gl.ARRAY_BUFFER, this.dummyBuffer);
                    currentBinding = this.dummyBuffer;
                }
            }
        }
        
        if ((attrib.buffer != oldAttrib.buffer) ||
            (attrib.size != oldAttrib.size) ||
            (attrib.type != oldAttrib.type) ||
            (attrib.normalized != oldAttrib.normalized) ||
            (attrib.stride != oldAttrib.stride) ||
            (attrib.offset != oldAttrib.offset)) {
            original.vertexAttribPointer.call(gl, n, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
        }
    }
    
    if (capturedOldBinding) {
        original.bindBuffer.call(gl, gl.ARRAY_BUFFER, oldBinding);
    }
};

function setupVertexArrayObject(gl) {
    // Ignore if already installed (or the browser provides the extension)
    // FIXME: when all stable browsers support getSupportedExtensions
    // and getExtension, remove the workarounds below.
    if (gl.getSupportedExtensions) {
        var exts = gl.getSupportedExtensions();
        if (exts.indexOf("OES_vertex_array_object") != -1) {
            return;
        }
    } else if (gl.getExtension) {
        var vao = gl.getExtension("OES_vertex_array_object");
        if (vao) {
            return;
        }
    }

    if (gl.getSupportedExtensions) {
        var original_getSupportedExtensions = gl.getSupportedExtensions;
        gl.getSupportedExtensions = function getSupportedExtensions() {
            var list = original_getSupportedExtensions.call(this) || [];
            list.push("OES_vertex_array_object");
            return list;
        };
    }
    
    var original_getExtension = gl.getExtension;
    gl.getExtension = function getExtension(name) {
        if (name == "OES_vertex_array_object") {
            if (!gl.__OESVertexArrayObject) {
                gl.__OESVertexArrayObject = new OESVertexArrayObject(gl);
            }
            return gl.__OESVertexArrayObject;
        }
        if (original_getExtension) {
            return original_getExtension.call(this, name);
        } else {
            return null;
        }
    };
};
