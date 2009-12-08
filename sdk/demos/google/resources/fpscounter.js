/**
 * Creates a frames-per-second counter which displays its output as
 * text in a given element on the web page.
 *
 * @param {!Element} outputElement The HTML element on the web page in
 *   which to write the current frames per second.
 * @param {!number} opt_numSamples The number of samples to take
 *   between each update of the frames-per-second.
 */
function FPSCounter(outputElement, opt_numSamples) {
  this.outputElement_ = outputElement;
  this.startTime_ = new Date();
  if (opt_numSamples) {
    this.numSamples_ = opt_numSamples;
  } else {
    this.numSamples_ = 200;
  }
  this.curSample_ = 0;
}

/**
 * Updates this FPSCounter.
 */
FPSCounter.prototype.update = function() {
  if (++this.curSample_ >= this.numSamples_) {
    var curTime = new Date();
    var startTime = this.startTime_;
    var diff = curTime.getTime() - startTime.getTime();
    var str = "" + (1000.0 * this.numSamples_ / diff).toFixed(2) + " frames per second";
    this.outputElement_.innerHTML = str;
    this.curSample_ = 0;
    this.startTime_ = curTime;
  }
}
