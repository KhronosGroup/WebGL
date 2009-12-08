// Simple camera controller. Attach it to an element to use it as the
// event source for constructing a view matrix.
//
// opt_canvas (an HTMLCanvasElement) and opt_context (a
// WebGLRenderingContext) can be passed in to make the hit detection
// more precise -- only opaque pixels will be considered as the start
// of a drag action.
function CameraController(element, opt_canvas, opt_context) {
  var controller = this;
  this.onchange = null;
  this.xRot = 0;
  this.yRot = 0;
  this.scaleFactor = 3.0;
  this.dragging = false;
  this.curX = 0;
  this.curY = 0;

  if (opt_canvas)
      this.canvas_ = opt_canvas;

  if (opt_context)
      this.context_ = opt_context;

  element.onmousedown = function(ev) {
    controller.curX = ev.clientX;
    controller.curY = ev.clientY;
    var dragging = false;
    if (controller.canvas_ && controller.context_) {
      var rect = controller.canvas_.getBoundingClientRect();
      // Transform the event's x and y coordinates into the coordinate
      // space of the canvas
      var canvasRelativeX = ev.pageX - rect.left;
      var canvasRelativeY = ev.pageY - rect.top;
      var canvasWidth = controller.canvas_.width;
      var canvasHeight = controller.canvas_.height;

      // Read back a small portion of the frame buffer around this point
      if (canvasRelativeX > 0 && canvasRelativeX < canvasWidth &&
          canvasRelativeY > 0 && canvasRelativeY < canvasHeight) {
        var pixels = controller.context_.readPixels(canvasRelativeX,
                                                    canvasHeight - canvasRelativeY,
                                                    1,
                                                    1,
                                                    controller.context_.RGBA,
                                                    controller.context_.UNSIGNED_BYTE);
        if (pixels) {
          // See whether this pixel has an alpha value of >= about 10%
          if (pixels[3] > (255.0 / 10.0)) {
            dragging = true;
          }
        }
      }
    } else {
      dragging = true;
    }

    controller.dragging = dragging;
  }

  element.onmouseup = function(ev) {
    controller.dragging = false;
  }

  element.onmousemove = function(ev) {
    if (controller.dragging) {
      var curX = ev.clientX;
      var curY = ev.clientY;
      var deltaX = (controller.curX - curX) / controller.scaleFactor;
      var deltaY = (controller.curY - curY) / controller.scaleFactor;
      controller.curX = curX;
      controller.curY = curY;
      controller.yRot = (controller.yRot + deltaX) % 360;
      controller.xRot = (controller.xRot + deltaY);
      if (controller.xRot < -90) {
        controller.xRot = -90;
      } else if (controller.xRot > 90) {
        controller.xRot = 90;
      }
      if (controller.onchange != null) {
        controller.onchange(controller.xRot, controller.yRot);
      }
    }
  }
}
