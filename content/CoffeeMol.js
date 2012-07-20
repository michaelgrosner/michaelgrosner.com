(function() {
  var ATOM_SIZE, Atom, Bond, CanvasContext, Chain, DEBUG, Element, Residue, Selector, Structure, addNewStructure, arrayToRGB, atomAtomDistance, atom_colors, boundMouseMotion, coffeemol, deepCopy, defaultInfo, degToRad, delay, encodeHTML, fromSplashLink, genIFSLink, hexToRGBArray, isBonded, mousePosition, nuc_acids, pdbAtomToDict, radToDeg, randomDrawMethod, randomInt, randomRGB, selector_delimiter, sortBondsByZ, sortByZ, summation, supported_draw_methods, timeIt, tol,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  CanvasContext = (function() {

    function CanvasContext(canvas_tag, background_color) {
      this.canvas_tag = canvas_tag;
      this.background_color = background_color != null ? background_color : "#ffffff";
      this.changeInfoFromSelectors = __bind(this.changeInfoFromSelectors, this);
      this.childFromSelector = __bind(this.childFromSelector, this);
      this.handleSelectorArg = __bind(this.handleSelectorArg, this);
      this.assignSelectors = __bind(this.assignSelectors, this);
      this.showAtomInfo = __bind(this.showAtomInfo, this);
      this.determinePointGrid = __bind(this.determinePointGrid, this);
      this.timedRotation = __bind(this.timedRotation, this);
      this.avgCenterOfAllElements = __bind(this.avgCenterOfAllElements, this);
      this.translateOrigin = __bind(this.translateOrigin, this);
      this.findBonds = __bind(this.findBonds, this);
      this.restoreToOriginal = __bind(this.restoreToOriginal, this);
      this.changeZoom = __bind(this.changeZoom, this);
      this.iOSChangeZoom = __bind(this.iOSChangeZoom, this);
      this.mousemove = __bind(this.mousemove, this);
      this.touchmove = __bind(this.touchmove, this);
      this.touchend = __bind(this.touchend, this);
      this.mouseup = __bind(this.mouseup, this);
      this.mousedown = __bind(this.mousedown, this);
      this.touchstart = __bind(this.touchstart, this);
      this.clear = __bind(this.clear, this);
      this.resizeToWindow = __bind(this.resizeToWindow, this);
      this.changeAllDrawMethods = __bind(this.changeAllDrawMethods, this);
      this.drawGridLines = __bind(this.drawGridLines, this);
      this.findBestZoom = __bind(this.findBestZoom, this);
      this.drawAll = __bind(this.drawAll, this);
      this.loadFromDict = __bind(this.loadFromDict, this);
      this.addNewStructure = __bind(this.addNewStructure, this);
      this.init = __bind(this.init, this);
      this.elements = [];
      try {
        this.canvas = $(this.canvas_tag)[0];
        this.context = this.canvas.getContext('2d');
      } catch (error) {
        alert(error);
      }
      $(this.canvas).css({
        "user-select": "none",
        "-moz-user-select": "none",
        "-webkit-user-select": "none",
        "background-color": arrayToRGB(this.background_color)
      });
      this.mouse_x_prev = 0;
      this.mouse_y_prev = 0;
      $("#reset").on("click", this.restoreToOriginal);
      this.canvas.addEventListener('mousedown', this.mousedown);
      this.canvas.addEventListener('touchstart', this.touchstart);
      this.canvas.addEventListener('DOMMouseScroll', this.changeZoom);
      this.canvas.addEventListener('mousewheel', this.changeZoom);
      this.canvas.addEventListener('gesturestart', this.iOSChangeZoom);
      this.canvas.addEventListener('dblclick', this.translateOrigin);
      this.canvas.addEventListener('mousemove', this.showAtomInfo);
    }

    CanvasContext.prototype.init = function() {
      var el, _i, _len, _ref;
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.init();
      }
      this.findBonds();
      this.assignSelectors();
      this.restoreToOriginal();
      return this.determinePointGrid();
    };

    CanvasContext.prototype.addElement = function(el) {
      return this.elements.push(el);
    };

    CanvasContext.prototype.addNewStructure = function(filepath, info) {
      var handlePDB,
        _this = this;
      if (info == null) info = null;
      handlePDB = function(data) {
        var a, a_str, c, chain_id_prev, d, r, resi_id_prev, s, _i, _len, _ref;
        s = new Structure(null, filepath, _this);
        _ref = data.split('\n');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          a_str = _ref[_i];
          if (a_str.startswith("TITLE")) s.attachTitle(a_str);
          if (!a_str.startswith("ATOM")) continue;
          d = pdbAtomToDict(a_str);
          if (!(typeof chain_id_prev !== "undefined" && chain_id_prev !== null) || d.chain_id !== chain_id_prev) {
            c = new Chain(s, d.chain_id);
          }
          if (!(typeof resi_id_prev !== "undefined" && resi_id_prev !== null) || d.resi_id !== resi_id_prev) {
            r = new Residue(c, d.resi_name, d.resi_id);
          }
          a = new Atom(r, d.atom_name, _this, d.x, d.y, d.z, d.original_atom_name);
          chain_id_prev = d.chain_id;
          resi_id_prev = d.resi_id;
        }
        if (info === null) info = defaultInfo();
        s.propogateInfo(info);
        if (_this.structures_left_to_load != null) {
          _this.structures_left_to_load -= 1;
          if (_this.structures_left_to_load === 0) {
            console.log("first global init");
            return _this.init();
          }
        } else {
          return _this.init();
        }
      };
      $.ajax({
        async: true,
        type: "GET",
        url: filepath,
        success: handlePDB
      });
      return null;
    };

    CanvasContext.prototype.loadFromDict = function(structuresToLoad) {
      var filepath, info, _results;
      this.structures_left_to_load = 0;
      for (filepath in structuresToLoad) {
        info = structuresToLoad[filepath];
        this.structures_left_to_load += 1;
      }
      _results = [];
      for (filepath in structuresToLoad) {
        info = structuresToLoad[filepath];
        _results.push(this.addNewStructure(filepath, info));
      }
      return _results;
    };

    CanvasContext.prototype.drawAll = function(DEBUG) {
      var el, sortByAvgZ, _i, _len, _ref;
      if (DEBUG == null) DEBUG = false;
      this.drawGridLines();
      this.context.scale(this.zoom, this.zoom);
      sortByAvgZ = function(e1, e2) {
        var c1, c2;
        c1 = e1.avgCenter();
        c2 = e2.avgCenter();
        return c1[2] - c2[2];
      };
      this.elements.sort(sortByAvgZ);
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.draw();
      }
      return null;
    };

    CanvasContext.prototype.findBestZoom = function() {
      var a, el, max_x, max_y, _i, _j, _len, _len2, _ref, _ref2;
      max_x = 0;
      max_y = 0;
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        _ref2 = el.atoms;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          a = _ref2[_j];
          if (Math.abs(a.x) > max_x) max_x = Math.abs(a.x);
          if (Math.abs(a.y) > max_y) max_y = Math.abs(a.y);
        }
      }
      if (max_x > max_y) {
        return this.canvas.width / (2 * max_x);
      } else {
        return this.canvas.width / (2 * max_y);
      }
    };

    CanvasContext.prototype.drawGridLines = function() {
      this.context.moveTo(0, -this.canvas.height);
      this.context.lineTo(0, this.canvas.height);
      this.context.moveTo(-this.canvas.width, 0);
      this.context.lineTo(this.canvas.width, 0);
      this.context.strokeStyle = "#eee";
      return this.context.stroke();
    };

    CanvasContext.prototype.changeAllDrawMethods = function(new_method) {
      var el, _i, _len, _ref;
      this.clear();
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.info.drawMethod = new_method;
      }
      return this.drawAll();
    };

    CanvasContext.prototype.resizeToWindow = function() {
      this.canvas.width = window.innerWidth;
      return this.canvas.height = window.innerHeight;
    };

    CanvasContext.prototype.clear = function() {
      this.canvas.width = this.canvas.width;
      return this.context.translate(this.x_origin, this.y_origin);
    };

    CanvasContext.prototype.touchstart = function(mobile_e) {
      mobile_e.preventDefault();
      this.canvas.addEventListener('touchmove', this.touchmove);
      this.canvas.addEventListener('touchend', this.touchend);
      return this.mousedown(mobile_e.touches[0]);
    };

    CanvasContext.prototype.mousedown = function(e) {
      this.mouse_x_prev = e.clientX;
      this.mouse_y_prev = e.clientY;
      this.canvas.removeEventListener('mousemove', this.showAtomInfo);
      this.canvas.addEventListener('mousemove', this.mousemove);
      this.canvas.addEventListener('mouseout', this.mouseup);
      return this.canvas.addEventListener('mouseup', this.mouseup);
    };

    CanvasContext.prototype.mouseup = function(e) {
      this.clear();
      this.drawAll();
      this.canvas.removeEventListener('mousemove', this.mousemove);
      this.canvas.addEventListener('mousemove', this.showAtomInfo);
      return this.determinePointGrid();
    };

    CanvasContext.prototype.touchend = function(mobile_e) {
      this.canvas.removeEventListener('touchmove', this.mousemove);
      return this.mouseup(mobile_e.touches[0]);
    };

    CanvasContext.prototype.touchmove = function(mobile_e) {
      return this.mousemove(mobile_e.touches[0]);
    };

    CanvasContext.prototype.mousemove = function(e) {
      var ds, dx, dy, el, fps, time_start, _i, _len, _ref;
      dx = boundMouseMotion(this.mouse_x_prev - e.clientX);
      dy = boundMouseMotion(this.mouse_y_prev - e.clientY);
      ds = Math.sqrt(dx * dx + dy * dy);
      time_start = new Date;
      this.clear();
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.rotateAboutX(degToRad(dy));
        el.rotateAboutY(degToRad(-dx));
      }
      this.drawAll();
      fps = 1000 / (new Date - time_start);
      this.mouse_x_prev = e.clientX;
      return this.mouse_y_prev = e.clientY;
    };

    CanvasContext.prototype.iOSChangeZoom = function(gesture) {
      var zoomChanger,
        _this = this;
      zoomChanger = function(gesture) {
        var el, _i, _len, _ref;
        gesture.preventDefault();
        _this.zoom *= Math.sqrt(gesture.scale);
        _ref = _this.elements;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          el = _ref[_i];
          el.rotateAboutZ(degToRad(boundMouseMotion(gesture.rotation)));
        }
        _this.clear();
        if (_this.zoom > 0) {
          _this.drawAll();
          return _this.zoom_prev = _this.zoom;
        }
      };
      zoomChanger(gesture);
      return this.canvas.addEventListener('gesturechange', zoomChanger);
    };

    CanvasContext.prototype.changeZoom = function(e) {
      if (e.hasOwnProperty('wheelDelta')) {
        this.zoom = this.zoom_prev - e.wheelDelta / 50.0;
      } else {
        this.zoom = this.zoom_prev - e.detail / 50.0;
      }
      e.preventDefault();
      this.clear();
      if (this.zoom > 0) {
        this.drawAll();
        return this.zoom_prev = this.zoom;
      }
    };

    CanvasContext.prototype.restoreToOriginal = function() {
      var center, el, _i, _len, _ref;
      center = this.avgCenterOfAllElements();
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.restoreToOriginal();
        el.translateTo(center);
      }
      this.zoom = this.findBestZoom();
      this.zoom_prev = this.zoom;
      this.x_origin = this.canvas.width / 2;
      this.y_origin = this.canvas.height / 2;
      this.clear();
      return this.drawAll();
    };

    CanvasContext.prototype.findBonds = function() {
      var el, _i, _len, _ref;
      this.bonds = [];
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.findBonds();
      }
      return null;
    };

    CanvasContext.prototype.translateOrigin = function(e) {
      var click;
      click = mousePosition(e);
      this.x_origin = click.x;
      this.y_origin = click.y;
      this.clear();
      return this.drawAll();
    };

    CanvasContext.prototype.avgCenterOfAllElements = function() {
      var a, avgs, el, elAvg, ela, total_atoms, _i, _j, _len, _len2, _ref, _results;
      avgs = [0.0, 0.0, 0.0];
      total_atoms = 0;
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        elAvg = el.avgCenter();
        ela = el.atoms.length;
        avgs[0] += elAvg[0] * ela;
        avgs[1] += elAvg[1] * ela;
        avgs[2] += elAvg[2] * ela;
        total_atoms += el.atoms.length;
      }
      _results = [];
      for (_j = 0, _len2 = avgs.length; _j < _len2; _j++) {
        a = avgs[_j];
        _results.push(a / total_atoms);
      }
      return _results;
    };

    CanvasContext.prototype.timedRotation = function(dim, dt) {
      var _this = this;
      return this.delayID = delay(dt, function() {
        var el, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
        _this.clear();
        if (dim === 'X') {
          _ref = _this.elements;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            el = _ref[_i];
            el.rotateAboutX(degToRad(1));
          }
        } else if (dim === 'Y') {
          _ref2 = _this.elements;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            el = _ref2[_j];
            el.rotateAboutY(degToRad(1));
          }
        } else if (dim === 'Z') {
          _ref3 = _this.elements;
          for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
            el = _ref3[_k];
            el.rotateAboutZ(degToRad(1));
          }
        }
        return _this.drawAll();
      });
    };

    CanvasContext.prototype.stopRotation = function() {
      return clearInterval(this.delayID);
    };

    CanvasContext.prototype.determinePointGrid = function() {
      var a, dx, el, h, i, j, w, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      this.grid = {};
      for (w = _ref = -this.x_origin, _ref2 = this.canvas.width - this.x_origin; _ref <= _ref2 ? w <= _ref2 : w >= _ref2; _ref <= _ref2 ? w++ : w--) {
        this.grid[w] = {};
        for (h = _ref3 = -this.y_origin, _ref4 = this.canvas.height - this.y_origin; _ref3 <= _ref4 ? h <= _ref4 : h >= _ref4; _ref3 <= _ref4 ? h++ : h--) {
          this.grid[w][h] = null;
        }
      }
      dx = parseInt(ATOM_SIZE / this.zoom);
      console.log(dx);
      _ref5 = this.elements;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        el = _ref5[_i];
        _ref6 = el.atoms;
        for (_j = 0, _len2 = _ref6.length; _j < _len2; _j++) {
          a = _ref6[_j];
          w = parseInt(a.x);
          h = parseInt(a.y);
          for (i = _ref7 = -1 * dx; _ref7 <= dx ? i <= dx : i >= dx; _ref7 <= dx ? i++ : i--) {
            for (j = _ref8 = -1 * dx; _ref8 <= dx ? j <= dx : j >= dx; _ref8 <= dx ? j++ : j--) {
              try {
                if (!(this.grid[w + i][h + j] != null) || a.z > this.grid[w + i][h + j].z) {
                  this.grid[w + i][h + j] = a;
                }
              } catch (error) {
                1;
              }
            }
          }
        }
      }
      return null;
    };

    CanvasContext.prototype.showAtomInfo = function(e) {
      var a, aib, click, grid_x, grid_y, _ref;
      if (this.a_prev != null) {
        this.a_prev.info.drawColor = this.a_prev.info.prevDrawColor;
        this.a_prev.info.borderColor = this.a_prev.info.prevBorderColor;
        this.a_prev.drawPoint();
      }
      click = mousePosition(e);
      grid_x = parseInt((click.x - this.x_origin) / this.zoom);
      grid_y = parseInt((click.y - this.y_origin) / this.zoom);
      if ((this.grid[grid_x] != null) && (this.grid[grid_x][grid_y] != null)) {
        a = this.grid[grid_x][grid_y];
        if ((_ref = a.info.drawMethod) === 'lines' || _ref === 'cartoon') {
          return null;
        }
        a.info.prevDrawColor = a.info.drawColor;
        a.info.prevBorderColor = a.info.prevBorderColor;
        a.info.drawColor = [0, 255, 0];
        a.info.borderColor = [0, 0, 255];
        a.drawPoint();
        if (false && (this.a_prev != null) && this.a_prev !== a) {
          aib = $("#atom-info-box");
          if (aib.length > 0) aib.remove();
        }
        this.a_prev = a;
      }
      return null;
    };

    CanvasContext.prototype.assignSelectors = function() {
      var a, c, el, na, nc, ne, nr, r, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4;
      _ref = this.elements;
      for (ne = 0, _len = _ref.length; ne < _len; ne++) {
        el = _ref[ne];
        el.selector = new Selector([ne]);
        _ref2 = el.children;
        for (nc = 0, _len2 = _ref2.length; nc < _len2; nc++) {
          c = _ref2[nc];
          c.selector = new Selector([ne, nc]);
          _ref3 = c.children;
          for (nr = 0, _len3 = _ref3.length; nr < _len3; nr++) {
            r = _ref3[nr];
            r.selector = new Selector([ne, nc, nr]);
            _ref4 = r.children;
            for (na = 0, _len4 = _ref4.length; na < _len4; na++) {
              a = _ref4[na];
              a.selector = new Selector([ne, nc, nr, na]);
            }
          }
        }
      }
      return null;
    };

    CanvasContext.prototype.handleSelectorArg = function(s) {
      if (typeof s === "string") s = new Selector(s);
      return s;
    };

    CanvasContext.prototype.childFromSelector = function(selector) {
      var c, i, _i, _len, _ref;
      selector = this.handleSelectorArg(selector);
      c = this;
      _ref = selector.array;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        c = c.elements != null ? c.elements[i] : c = c.children[i];
      }
      return c;
    };

    CanvasContext.prototype.changeInfoFromSelectors = function(selectors, info_key, info_value) {
      var c, el, selector, _i, _len;
      if (selectors === "all") {
        selectors = (function() {
          var _i, _len, _ref, _results;
          _ref = this.elements;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            el = _ref[_i];
            _results.push(el.selector);
          }
          return _results;
        }).call(this);
      } else if (!selectors instanceof Array || typeof selectors === 'string') {
        selectors = [selectors];
      }
      for (_i = 0, _len = selectors.length; _i < _len; _i++) {
        selector = selectors[_i];
        selector = this.handleSelectorArg(selector);
        try {
          c = this.childFromSelector(selector);
        } catch (error) {
          alert("Child from selector " + selector.str + " does not exist");
        }
        try {
          c.info[info_key] = info_value.toLowerCase();
        } catch (error) {
          alert("Error: " + error + " with " + info_key + " to " + info_value);
        }
        c.propogateInfo(c.info);
      }
      this.clear();
      if (c.info.drawMethod !== 'points') this.findBonds();
      this.drawAll();
      return null;
    };

    return CanvasContext;

  })();

  tol = 2;

  boundMouseMotion = function(dz) {
    if (dz > tol) {
      return tol;
    } else if (dz < -1 * tol) {
      return -1 * tol;
    } else {
      return dz;
    }
  };

  Element = (function() {

    function Element(parent, name, cc) {
      this.parent = parent;
      this.name = name;
      if (cc == null) cc = null;
      this.findBonds = __bind(this.findBonds, this);
      this.translateTo = __bind(this.translateTo, this);
      this.avgCenter = __bind(this.avgCenter, this);
      this.restoreToOriginal = __bind(this.restoreToOriginal, this);
      this.rotateAboutXYZ = __bind(this.rotateAboutXYZ, this);
      this.rotateAboutX = __bind(this.rotateAboutX, this);
      this.rotateAboutY = __bind(this.rotateAboutY, this);
      this.rotateAboutZ = __bind(this.rotateAboutZ, this);
      this.drawPoints = __bind(this.drawPoints, this);
      this.drawLines = __bind(this.drawLines, this);
      this.draw = __bind(this.draw, this);
      this.writeContextInfo = __bind(this.writeContextInfo, this);
      this.constructorName = __bind(this.constructorName, this);
      this.children = [];
      if (parent != null) this.parent.addChild(this);
      this.cc = cc != null ? cc : this.parent.cc;
      this.info = {};
      this.selector = null;
    }

    Element.prototype.constructorName = function() {
      return this.constructor.name;
    };

    Element.prototype.writeContextInfo = function() {
      var bothLink, c, cartoonLink, child_type_name, children_info, ctx_info, dropdown, linesLink, plural, pointsLink, shortenName;
      shortenName = function(n) {
        if (n.length > 20) {
          return n.substr(0, 17) + "...";
        } else {
          return n;
        }
      };
      if (this.constructorName() !== "Atom") {
        plural = this.children.length === 1 ? '' : 's';
        pointsLink = genIFSLink(this.selector.str, "drawMethod", "points", "Points");
        linesLink = genIFSLink(this.selector.str, "drawMethod", "lines", "Lines");
        bothLink = genIFSLink(this.selector.str, "drawMethod", "both", "Points + lines");
        cartoonLink = genIFSLink(this.selector.str, "drawMethod", "cartoon", "Cartoon");
        child_type_name = this.children[0].constructorName();
        dropdown = "<span class='fake-button open-dropdown'>Draw</span><span class='dropdown " + this.selector.str + "'>" + pointsLink + " " + linesLink + " " + bothLink + " " + cartoonLink + "</span>";
        ctx_info = "<span class='element-desc " + (this.constructorName()) + " fake-button'>" + (this.constructorName()) + ": " + (shortenName(this.name)) + " with " + this.children.length + " " + child_type_name + plural + "</span> " + dropdown;
        children_info = (function() {
          var _i, _len, _ref, _results;
          _ref = this.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            _results.push(c.writeContextInfo());
          }
          return _results;
        }).call(this);
        return "<div class='element-controller " + (this.constructorName()) + "'>" + ctx_info + (children_info.join("")) + "</div>";
      }
    };

    Element.prototype.init = function() {
      return this.atoms = this.getOfType(Atom);
    };

    Element.prototype.addChild = function(child) {
      return this.children.push(child);
    };

    Element.prototype.propogateInfo = function(info) {
      var c, _i, _len, _ref;
      this.info = deepCopy(info);
      if (this.info.drawColor != null) {
        this.info.drawColor = hexToRGBArray(this.info.drawColor);
      } else {
        this.info.drawColor = randomRGB();
      }
      if (this.info.borderColor != null) {
        this.info.borderColor = hexToRGBArray(this.info.borderColor);
      } else {
        this.info.borderColor = [0, 0, 0];
      }
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        c.propogateInfo(info);
      }
      return null;
    };

    Element.prototype.stashInfo = function() {
      var c, _i, _len, _ref, _results;
      this.old_info = deepCopy(this.info);
      _ref = this.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        _results.push(c.stashInfo());
      }
      return _results;
    };

    Element.prototype.retrieveStashedInfo = function() {
      var c, _i, _len, _ref, _results;
      this.info = deepCopy(this.old_info);
      _ref = this.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        _results.push(c.retrieveStashedInfo());
      }
      return _results;
    };

    Element.prototype.getOfType = function(type) {
      var recursor, ret;
      ret = [];
      recursor = function(children) {
        var c, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          c = children[_i];
          if (c instanceof type) {
            _results.push(ret.push(c));
          } else {
            _results.push(recursor(c.children));
          }
        }
        return _results;
      };
      recursor(this.children);
      return ret;
    };

    Element.prototype.draw = function() {
      var c, _ref;
      if (_ref = this.info.drawMethod, __indexOf.call(supported_draw_methods, _ref) < 0) {
        c = supported_draw_methods.join(", ");
        alert("drawMethod " + this.info.drawMethod + " not supported! Choose: " + c);
      }
      this.drawLines();
      return this.drawPoints();
    };

    Element.prototype.drawLines = function() {
      var b, c, color, _i, _len, _ref;
      this.bonds.sort(sortBondsByZ);
      _ref = this.bonds;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        b = _ref[_i];
        if (b.a1.info.drawMethod !== 'points') continue;
        this.cc.context.beginPath();
        this.cc.context.moveTo(b.a1.x, b.a1.y);
        this.cc.context.lineTo(b.a2.x, b.a2.y);
        if (b.a1.info.drawMethod !== 'both') {
          color = (function() {
            var _j, _len2, _ref2, _results;
            _ref2 = b.a1.info.drawColor;
            _results = [];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              c = _ref2[_j];
              _results.push(c + b.a1.z);
            }
            return _results;
          })();
        } else {
          color = (function() {
            var _j, _len2, _ref2, _results;
            _ref2 = b.a1.info.drawColor;
            _results = [];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              c = _ref2[_j];
              _results.push(100 - b.a1.z);
            }
            return _results;
          })();
        }
        this.cc.context.strokeStyle = arrayToRGB(color);
        this.cc.context.lineWidth = 2 / this.cc.zoom;
        this.cc.context.closePath();
        this.cc.context.stroke();
      }
      return null;
    };

    Element.prototype.drawPoints = function() {
      var a, sorted_atoms, _i, _len, _ref;
      sorted_atoms = this.atoms.slice();
      sorted_atoms.sort(sortByZ);
      for (_i = 0, _len = sorted_atoms.length; _i < _len; _i++) {
        a = sorted_atoms[_i];
        if ((_ref = a.info.drawMethod) !== "lines" && _ref !== "cartoon") {
          a.drawPoint();
        }
      }
      return null;
    };

    Element.prototype.rotateAboutZ = function(theta) {
      var a, cos, sin, _i, _len, _ref;
      cos = Math.cos(theta);
      sin = Math.sin(theta);
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        a.rotateAboutZ(sin, cos);
      }
      return null;
    };

    Element.prototype.rotateAboutY = function(theta) {
      var a, cos, sin, _i, _len, _ref;
      cos = Math.cos(theta);
      sin = Math.sin(theta);
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        a.rotateAboutY(sin, cos);
      }
      return null;
    };

    Element.prototype.rotateAboutX = function(theta) {
      var a, cos, sin, _i, _len, _ref;
      cos = Math.cos(theta);
      sin = Math.sin(theta);
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        a.rotateAboutX(sin, cos);
      }
      return null;
    };

    Element.prototype.rotateAboutXYZ = function(dx, dy, dz) {
      var a, _i, _len, _ref;
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        a.rotateAboutXYZ(dx, dy, dz);
      }
      return null;
    };

    Element.prototype.restoreToOriginal = function() {
      var a, _i, _len, _ref;
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        a.restoreToOriginal();
      }
      return null;
    };

    Element.prototype.avgCenter = function() {
      var a, avgs, _i, _j, _len, _len2, _ref, _results;
      avgs = [0.0, 0.0, 0.0];
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        avgs[0] += a.x;
        avgs[1] += a.y;
        avgs[2] += a.z;
      }
      _results = [];
      for (_j = 0, _len2 = avgs.length; _j < _len2; _j++) {
        a = avgs[_j];
        _results.push(a / this.atoms.length);
      }
      return _results;
    };

    Element.prototype.translateTo = function(center) {
      var a, _i, _len, _ref;
      _ref = this.atoms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        a.x -= center[0];
        a.y -= center[1];
        a.z -= center[2];
      }
      return null;
    };

    Element.prototype.findBonds = function() {
      var a1, a2, b, i, j, j_step, _ref, _results;
      this.bonds = [];
      _results = [];
      for (i = 2, _ref = this.atoms.length - 1; 2 <= _ref ? i <= _ref : i >= _ref; 2 <= _ref ? i++ : i--) {
        a1 = this.atoms[i];
        j_step = a1.info.drawMethod === 'cartoon' ? 30 : 10;
        _results.push((function() {
          var _ref2, _ref3, _results2;
          _results2 = [];
          for (j = _ref2 = i + 1, _ref3 = i + j_step; _ref2 <= _ref3 ? j <= _ref3 : j >= _ref3; _ref2 <= _ref3 ? j++ : j--) {
            if (!(j < this.atoms.length - 1)) continue;
            a2 = this.atoms[j];
            if (isBonded(a1, a2)) {
              b = new Bond(a1, a2);
              _results2.push(this.bonds.push(b));
            } else {
              _results2.push(void 0);
            }
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    return Element;

  })();

  Structure = (function(_super) {

    __extends(Structure, _super);

    function Structure(parent, name, cc) {
      this.attachTitle = __bind(this.attachTitle, this);
      this.toString = __bind(this.toString, this);
      var n;
      if (name.search("/" > 0)) {
        n = name.split("/");
        name = n[n.length - 1];
      }
      if (name.endswith(".pdb")) {
        n = name.split(".");
        name = n[0];
      }
      Structure.__super__.constructor.call(this, parent, name, cc);
      cc.addElement(this);
    }

    Structure.prototype.toString = function() {
      var n;
      n = this.title != null ? this.title : this.name;
      return "<Structure " + n + " with " + this.children.length + " chains>";
    };

    Structure.prototype.attachTitle = function(str) {
      str = str.replace("TITLE ", "");
      if (!(this.title != null)) {
        return this.title = str;
      } else {
        return this.title += str.slice(2, str.length + 1 || 9e9);
      }
    };

    return Structure;

  })(Element);

  Chain = (function(_super) {

    __extends(Chain, _super);

    function Chain(parent, name) {
      Chain.__super__.constructor.call(this, parent, name);
    }

    Chain.prototype.toString = function() {
      return "<Chain " + this.name + " with " + this.children.length + " residues>";
    };

    return Chain;

  })(Element);

  Residue = (function(_super) {

    __extends(Residue, _super);

    function Residue(parent, name, id) {
      this.id = id;
      Residue.__super__.constructor.call(this, parent, name);
    }

    Residue.prototype.toString = function() {
      return "<Residue " + this.name + " with " + this.children.length + " atoms>";
    };

    Residue.prototype.isDNA = function() {
      var _ref;
      if (_ref = this.name, __indexOf.call(nuc_acids, _ref) >= 0) {
        return true;
      } else {
        return false;
      }
    };

    Residue.prototype.isProtein = function() {
      if (!this.isDNA()) {
        return true;
      } else {
        return false;
      }
    };

    Residue.prototype.typeName = function() {
      if (this.isDNA) return "DNA";
    };

    return Residue;

  })(Element);

  Atom = (function(_super) {

    __extends(Atom, _super);

    function Atom(parent, name, cc, x, y, z, original_atom_name) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.original_atom_name = original_atom_name;
      this.atomInfo = __bind(this.atomInfo, this);
      this.asArray = __bind(this.asArray, this);
      this.restoreToOriginal = __bind(this.restoreToOriginal, this);
      this.rotateAboutXYZ = __bind(this.rotateAboutXYZ, this);
      this.rotateAboutZ = __bind(this.rotateAboutZ, this);
      this.rotateAboutX = __bind(this.rotateAboutX, this);
      this.rotateAboutY = __bind(this.rotateAboutY, this);
      this.drawPoint = __bind(this.drawPoint, this);
      this.toString = __bind(this.toString, this);
      Atom.__super__.constructor.call(this, parent, name, cc);
      this.original_position = [this.x, this.y, this.z];
    }

    Atom.prototype.toString = function() {
      return "<Atom: " + this.name + " [" + (this.x.toFixed(2)) + ", " + (this.y.toFixed(2)) + ", " + (this.z.toFixed(2)) + "]>";
    };

    Atom.prototype.drawPoint = function() {
      var c, color, zz;
      color = !(this.info.drawColor != null) ? atom_colors[this.name] : this.info.drawColor;
      this.cc.context.beginPath();
      zz = ATOM_SIZE / this.cc.zoom;
      this.cc.context.arc(this.x, this.y, zz, 0, 2 * Math.PI, false);
      this.cc.context.lineWidth = 1 / this.cc.zoom;
      this.cc.context.strokeStyle = arrayToRGB([0, 0, 0]);
      this.cc.context.fillStyle = arrayToRGB((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = color.length; _i < _len; _i++) {
          c = color[_i];
          _results.push(c + this.z);
        }
        return _results;
      }).call(this));
      this.cc.context.stroke();
      return this.cc.context.fill();
    };

    Atom.prototype.rotateAboutY = function(sin, cos) {
      this.x = this.x * cos + this.z * sin;
      return this.z = -this.x * sin + this.z * cos;
    };

    Atom.prototype.rotateAboutX = function(sin, cos) {
      this.y = this.y * cos - this.z * sin;
      return this.z = this.y * sin + this.z * cos;
    };

    Atom.prototype.rotateAboutZ = function(sin, cos) {
      this.x = this.x * cos - this.y * sin;
      return this.y = this.x * sin + this.y * cos;
    };

    Atom.prototype.rotateAboutXYZ = function(j, k, l) {
      this.x = this.x * Math.cos(k) * Math.cos(l) + this.z * Math.sin(k) - this.y * Math.cos(k) * Math.sin(l);
      this.y = -this.z * Math.cos(k) * Math.sin(j) + this.x * (Math.cos(l) * Math.sin(j) * Math.sin(k) + Math.cos(j) * Math.sin(l)) + this.y * (Math.cos(j) * Math.cos(l) - Math.sin(j) * Math.sin(k) * Math.sin(l));
      return this.z = this.z * Math.cos(j) * Math.cos(k) + this.x * (-Math.cos(j) * Math.cos(l) * Math.sin(k) + Math.sin(j) * Math.sin(l)) + this.y * (Math.cos(l) * Math.sin(j) + Math.cos(j) * Math.sin(k) * Math.sin(l));
    };

    Atom.prototype.restoreToOriginal = function() {
      this.x = this.original_position[0];
      this.y = this.original_position[1];
      return this.z = this.original_position[2];
    };

    Atom.prototype.asArray = function() {
      return [this.x, this.y, this.z];
    };

    Atom.prototype.atomInfo = function(index, oldhtml) {
      var i, p, parents, s;
      s = this.selector;
      parents = [this];
      for (i = 1; i <= 10; i++) {
        s = s.up();
        if (!(s != null)) {
          break;
        } else {
          parents.push(this.cc.childFromSelector(s));
        }
      }
      try {
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = parents.length; _i < _len; _i++) {
            p = parents[_i];
            _results.push(encodeHTML(p.toString()));
          }
          return _results;
        })()).join("<br>");
      } catch (error) {
        return console.log(parents);
      }
    };

    return Atom;

  })(Element);

  atom_colors = {
    'C': [51, 255, 51],
    'O': [255, 76, 76],
    'N': [51, 51, 255],
    'P': [255, 128, 0],
    'H': [229, 229, 229],
    'S': [229, 198, 64]
  };

  sortBondsByZ = function(b1, b2) {
    return b1.zCenter() - b2.zCenter();
  };

  sortByZ = function(a1, a2) {
    return a1.z - a2.z;
  };

  atomAtomDistance = function(a1, a2) {
    return Math.sqrt((a1.x - a2.x) * (a1.x - a2.x) + (a1.y - a2.y) * (a1.y - a2.y) + (a1.z - a2.z) * (a1.z - a2.z));
  };

  Bond = (function() {

    function Bond(a1, a2) {
      this.a1 = a1;
      this.a2 = a2;
      this.zCenter = __bind(this.zCenter, this);
      this.computeLength = __bind(this.computeLength, this);
      this.toString = __bind(this.toString, this);
      this.computeLength();
    }

    Bond.prototype.toString = function() {
      return "<Bond of Length: " + (this.computeLength().toFixed(3)) + " between " + (this.a1.toString()) + " and " + (this.a2.toString()) + ">";
    };

    Bond.prototype.computeLength = function() {
      if (this.length != null) {
        return this.length;
      } else {
        return this.length = atomAtomDistance(this.a1, this.a2);
      }
    };

    Bond.prototype.zCenter = function() {
      return (this.a1.z + this.a2.z) / 2.0;
    };

    return Bond;

  })();

  selector_delimiter = "/";

  Selector = (function() {

    function Selector(s) {
      if (s == null) s = null;
      this.up = __bind(this.up, this);
      this.down = __bind(this.down, this);
      this.left = __bind(this.left, this);
      this.right = __bind(this.right, this);
      if (!s) {
        this.str = "0";
        this.array = [0];
      } else if (s instanceof Array) {
        this.str = s.join(selector_delimiter);
        this.array = s;
      } else if (typeof s === "string") {
        this.str = s;
        this.array = this.str.split(selector_delimiter);
      }
    }

    Selector.prototype.right = function() {
      var aNext;
      aNext = this.array;
      aNext[aNext.length - 1] = aNext[aNext.length - 1] + 1;
      return new Selector(aNext.join(selector_delimiter));
    };

    Selector.prototype.left = function() {
      var aNext;
      aNext = this.array;
      aNext[aNext.length - 1] = aNext[aNext.length - 1] - 1;
      return new Selector(aNext.join(selector_delimiter));
    };

    Selector.prototype.down = function() {
      var aNext;
      aNext = this.array;
      aNext.push(0);
      return new Selector(aNext.join(selector_delimiter));
    };

    Selector.prototype.up = function() {
      var aNext, n;
      aNext = this.array.slice(0, (this.array.length - 2) + 1 || 9e9);
      n = new Selector(aNext.join(selector_delimiter));
      if (n.str === this.str) {
        return null;
      } else {
        return n;
      }
    };

    return Selector;

  })();

  ATOM_SIZE = 3;

  DEBUG = true;

  if (typeof String.prototype.startswith !== 'function') {
    String.prototype.startswith = function(str) {
      return this.slice(0, str.length) === str;
    };
  }

  if (typeof String.prototype.endswith !== 'function') {
    String.prototype.endswith = function(str) {
      return this.slice(-str.length) === str;
    };
  }

  if (typeof Array.prototype.norm !== 'function') {
    Array.prototype.norm = function() {
      return Math.sqrt(this.dot(this));
    };
  }

  if (typeof Array.prototype.dot !== 'function') {
    Array.prototype.dot = function(v) {
      var i;
      if (v.length !== this.length) alert("Lengths for dot product must be equal");
      return summation((function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = v.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          _results.push(v[i] * this[i]);
        }
        return _results;
      }).call(this));
    };
  }

  nuc_acids = ["A", "C", "G", "T", "DA", "DC", "DG", "DT", "RA", "RC", "RG", "RT"];

  supported_draw_methods = ["both", "lines", "points", "cartoon"];

  summation = function(v) {
    var r, x, _i, _len;
    r = 0;
    for (_i = 0, _len = v.length; _i < _len; _i++) {
      x = v[_i];
      r += x;
    }
    return r;
  };

  encodeHTML = function(s) {
    return s.replace("<", "&lt;").replace(">", "&gt;");
  };

  timeIt = function(fn) {
    var t_start;
    t_start = new Date;
    fn();
    return (new Date) - t_start;
  };

  hexToRGBArray = function(h) {
    var i, t, temp, _i, _len, _results;
    if (h instanceof Array) return h;
    if (h.startswith("0x")) h = h.substring(2);
    temp = (function() {
      var _results;
      _results = [];
      for (i = 0; i <= 4; i += 2) {
        _results.push(h.substring(i, i + 2));
      }
      return _results;
    })();
    _results = [];
    for (_i = 0, _len = temp.length; _i < _len; _i++) {
      t = temp[_i];
      _results.push(parseInt(t, 16));
    }
    return _results;
  };

  arrayToRGB = function(a) {
    var fixer, x;
    if (typeof a === 'string') {
      if (a.startswith("#")) {
        return a;
      } else {
        alert("Improperly formatted string -> color. \					Must be of the form #XXXXXX");
      }
    }
    if (!(a != null)) {
      a = randomRGB();
      if (DEBUG) {
        alert("No color defined for " + (a.toString()) + ". Using a random color");
      }
    }
    if (a.length !== 3) {
      alert("Array To RGB must be of length 3, it is length " + a.length + ": " + a);
    }
    fixer = function(c) {
      c = c > 255 ? c = 255 : c;
      c = c < 0 ? c = 0 : c;
      return parseInt(c);
    };
    a = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        _results.push(fixer(x));
      }
      return _results;
    })();
    return "rgb(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
  };

  isBonded = function(a1, a2) {
    var aad;
    if (a1.parent.typeName() !== a2.parent.typeName()) return false;
    aad = atomAtomDistance(a1, a2);
    if (a1.info.drawMethod === 'cartoon') {
      if (aad < 4 && a1.parent.isProtein() && a1.original_atom_name === "CA" && a2.original_atom_name === "CA") {
        return true;
      } else if (aad < 10 && a1.parent.isDNA() && a1.original_atom_name === "P" && a2.original_atom_name === "P") {
        return true;
      } else {
        return false;
      }
    } else {
      if (aad < 2) {
        return true;
      } else {
        return false;
      }
    }
  };

  degToRad = function(deg) {
    return deg * 0.0174532925;
  };

  radToDeg = function(rad) {
    return rad * 57.2957795;
  };

  delay = function(ms, f) {
    return setInterval(f, ms);
  };

  pdbAtomToDict = function(a_str) {
    var handleAtomName, handleResiName;
    handleResiName = function(r) {
      if (__indexOf.call(nuc_acids.slice(4, nuc_acids.length + 1 || 9e9), r) >= 0) {
        return r.substr(1, 2);
      } else {
        return r;
      }
    };
    handleAtomName = function(a) {
      return a.substr(0, 1);
    };
    return {
      original_atom_name: $.trim(a_str.substring(13, 16)),
      atom_name: handleAtomName($.trim(a_str.substring(13, 16))),
      resi_name: handleResiName($.trim(a_str.substring(17, 20))),
      chain_id: $.trim(a_str.substring(21, 22)),
      resi_id: parseInt(a_str.substring(23, 26)),
      x: parseFloat(a_str.substring(31, 38)),
      y: parseFloat(a_str.substring(38, 45)),
      z: parseFloat(a_str.substring(46, 53))
    };
  };

  randomInt = function(maxInt) {
    return Math.floor(Math.random() * maxInt);
  };

  randomRGB = function() {
    var rr;
    rr = function() {
      return randomInt(255);
    };
    return [rr(), rr(), rr()];
  };

  deepCopy = function(o) {
    return $.extend(true, {}, o);
  };

  randomDrawMethod = function() {
    return supported_draw_methods[randomInt(supported_draw_methods.length)];
  };

  defaultInfo = function() {
    return {
      drawMethod: randomDrawMethod(),
      drawColor: randomRGB(),
      borderColor: [0, 0, 0]
    };
  };

  genIFSLink = function(selector_str, key, val, pretty) {
    var link;
    link = "javascript:window.coffeemol.changeInfoFromSelectors('" + selector_str + "', 			'" + key + "', '" + val + "');";
    return "<div class='dropdown-option'><a href=\"" + link + "\">" + pretty + "</a></div>";
  };

  mousePosition = function(e) {
    if (!(e.offsetX != null) || !(e.offsetY != null)) {
      return {
        x: e.layerX - $(e.target).position().left,
        y: e.layerY - $(e.target).position().top
      };
    } else {
      return {
        x: e.offsetX,
        y: e.offsetY
      };
    }
  };

  addNewStructure = function(e) {
    var filepath;
    filepath = $("#add-new-structure .text").val();
    return coffeemol.addNewStructure(filepath);
  };

  fromSplashLink = function(filename) {
    return coffeemol.addNewStructure(filename, {
      drawMethod: 'cartoon'
    });
  };

  coffeemol = new CanvasContext("#coffeemolCanvas");

  window.coffeemol = coffeemol;

  window.fromSplashLink = fromSplashLink;

}).call(this);
