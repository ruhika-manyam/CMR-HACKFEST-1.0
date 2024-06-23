class FlipDown {
  constructor(uts, el = "flipdown", opt = {}) {
    if (typeof uts !== "number") {
      throw new Error(`FlipDown: Constructor expected unix timestamp, got ${typeof uts} instead.`);
    }
    if (typeof el === "object") {
      opt = el;
      el = "flipdown";
    }
    this.version = "0.3.2";
    this.initialised = false;
    this.now = this._getTime();
    this.epoch = uts;
    this.countdownEnded = false;
    this.hasEndedCallback = null;
    this.element = document.getElementById(el);
    this.rotors = [];
    this.rotorLeafFront = [];
    this.rotorLeafRear = [];
    this.rotorTops = [];
    this.rotorBottoms = [];
    this.countdown = null;
    this.daysRemaining = 0;
    this.clockValues = {};
    this.clockStrings = {};
    this.clockValuesAsString = [];
    this.prevClockValuesAsString = [];
    this.opts = this._parseOptions(opt);
    this._setOptions();
    console.log(`FlipDown ${this.version} (Theme: ${this.opts.theme})`);
  }
  start() {
    if (!this.initialised) this._init();
    this.countdown = setInterval(this._tick.bind(this), 1000);
    return this;
  }
  ifEnded(cb) {
    this.hasEndedCallback = function () {
      cb();
      this.hasEndedCallback = null;
    };
    return this;
  }
  _getTime() {
    return new Date().getTime() / 1000;
  }
  _hasCountdownEnded() {
    if (this.epoch - this.now < 0) {
      this.countdownEnded = true;
      if (this.hasEndedCallback != null) {
        this.hasEndedCallback();
        this.hasEndedCallback = null;
      }
      return true;
    } else {
      this.countdownEnded = false;
      return false;
    }
  }
  _parseOptions(opt) {
    let headings = ["Days", "Hours", "Minutes", "Seconds"];
    if (opt.headings && opt.headings.length === 4) {
      headings = opt.headings;
    }
    return {
      theme: opt.hasOwnProperty("theme") ? opt.theme : "dark",
      headings
    };
  }
  _setOptions() {
    this.element.classList.add(`flipdown__theme-${this.opts.theme}`);
  }
  _init() {
    this.initialised = true;
    if (this._hasCountdownEnded()) {
      this.daysremaining = 0;
    } else {
      this.daysremaining = Math.floor((this.epoch - this.now) / 86400).toString().length;
    }
    var dayRotorCount = this.daysremaining <= 2 ? 2 : this.daysremaining;
    for (var i = 0; i < dayRotorCount + 6; i++) {
      this.rotors.push(this._createRotor(0));
    }
    var dayRotors = [];
    for (var i = 0; i < dayRotorCount; i++) {
      dayRotors.push(this.rotors[i]);
    }
    this.element.appendChild(this._createRotorGroup(dayRotors, 0));
    var count = dayRotorCount;
    for (var i = 0; i < 3; i++) {
      var otherRotors = [];
      for (var j = 0; j < 2; j++) {
        otherRotors.push(this.rotors[count]);
        count++;
      }
      this.element.appendChild(this._createRotorGroup(otherRotors, i + 1));
    }
    this.rotorLeafFront = Array.prototype.slice.call(this.element.getElementsByClassName("rotor-leaf-front"));
    this.rotorLeafRear = Array.prototype.slice.call(this.element.getElementsByClassName("rotor-leaf-rear"));
    this.rotorTop = Array.prototype.slice.call(this.element.getElementsByClassName("rotor-top"));
    this.rotorBottom = Array.prototype.slice.call(this.element.getElementsByClassName("rotor-bottom"));
    this._tick();
    this._updateClockValues(true);
    return this;
  }
  _createRotorGroup(rotors, rotorIndex) {
    var rotorGroup = document.createElement("div");
    rotorGroup.className = "rotor-group";
    var dayRotorGroupHeading = document.createElement("div");
    dayRotorGroupHeading.className = "rotor-group-heading";
    dayRotorGroupHeading.setAttribute("data-before", this.opts.headings[rotorIndex]);
    rotorGroup.appendChild(dayRotorGroupHeading);
    appendChildren(rotorGroup, rotors);
    return rotorGroup;
  }
  _createRotor(v = 0) {
    var rotor = document.createElement("div");
    var rotorLeaf = document.createElement("div");
    var rotorLeafRear = document.createElement("figure");
    var rotorLeafFront = document.createElement("figure");
    var rotorTop = document.createElement("div");
    var rotorBottom = document.createElement("div");
    rotor.className = "rotor";
    rotorLeaf.className = "rotor-leaf";
    rotorLeafRear.className = "rotor-leaf-rear";
    rotorLeafFront.className = "rotor-leaf-front";
    rotorTop.className = "rotor-top";
    rotorBottom.className = "rotor-bottom";
    rotorLeafRear.textContent = v;
    rotorTop.textContent = v;
    rotorBottom.textContent = v;
    appendChildren(rotor, [rotorLeaf, rotorTop, rotorBottom]);
    appendChildren(rotorLeaf, [rotorLeafRear, rotorLeafFront]);
    return rotor;
  }
  _tick() {
    this.now = this._getTime();
    var diff = this.epoch - this.now <= 0 ? 0 : this.epoch - this.now;
    this.clockValues.d = Math.floor(diff / 86400);
    diff -= this.clockValues.d * 86400;
    this.clockValues.h = Math.floor(diff / 3600);
    diff -= this.clockValues.h * 3600;
    this.clockValues.m = Math.floor(diff / 60);
    diff -= this.clockValues.m * 60;
    this.clockValues.s = Math.floor(diff);
    this._updateClockValues();
    this._hasCountdownEnded();
  }
  _updateClockValues(init = false) {
    this.clockStrings.d = pad(this.clockValues.d, 2);
    this.clockStrings.h = pad(this.clockValues.h, 2);
    this.clockStrings.m = pad(this.clockValues.m, 2);
    this.clockStrings.s = pad(this.clockValues.s, 2);
    this.clockValuesAsString = (this.clockStrings.d + this.clockStrings.h + this.clockStrings.m + this.clockStrings.s).split("");
    this.rotorLeafFront.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i];
    });
    this.rotorBottom.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i];
    });
    function rotorTopFlip() {
      this.rotorTop.forEach((el, i) => {
        if (el.textContent != this.clockValuesAsString[i]) {
          el.textContent = this.clockValuesAsString[i];
        }
      });
    }
    function rotorLeafRearFlip() {
      this.rotorLeafRear.forEach((el, i) => {
        if (el.textContent != this.clockValuesAsString[i]) {
          el.textContent = this.clockValuesAsString[i];
          el.parentElement.classList.add("flipped");
          var flip = setInterval(function () {
            el.parentElement.classList.remove("flipped");
            clearInterval(flip);
          }.bind(this), 500);
        }
      });
    }
    if (!init) {
      setTimeout(rotorTopFlip.bind(this), 500);
      setTimeout(rotorLeafRearFlip.bind(this), 500);
    } else {
      rotorTopFlip.call(this);
      rotorLeafRearFlip.call(this);
    }
    this.prevClockValuesAsString = this.clockValuesAsString;
  }
}
function pad(n, len) {
  n = n.toString();
  return n.length < len ? pad("0" + n, len) : n;
}
function appendChildren(parent, children) {
  children.forEach(el => {
    parent.appendChild(el);
  });
}
