(function() {
  var ATOM_SIZE, Atom, Bond, CanvasContext, Chain, DEBUG, Element, Residue, Selector, Structure, addNewStructure, arrayToRGB, atomAtomDistance, atom_colors, ctx, defaultInfo, degToRad, delay, dismissWelcomeSplash, encodeHTML, fade, fitCtxInfo, fromSplashLink, genIFSLink, hexToRGBArray, isBonded, loadFromDict, loadPDBAsStructure, mousePosition, nuc_acids, pdbAtomToDict, radToDeg, randomDrawMethod, randomInt, randomRGB, selector_delimiter, sortBondsByZ, sortByZ, structuresToLoad, summation, supported_draw_methods, timeIt,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

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

  CanvasContext = (function() {

    function CanvasContext(canvas_tag) {
      var _this = this;
      this.canvas_tag = canvas_tag;
      this.timedRotation = __bind(this.timedRotation, this);
      this.findBonds = __bind(this.findBonds, this);
      this.changeInfoFromSelectors = __bind(this.changeInfoFromSelectors, this);
      this.childFromSelector = __bind(this.childFromSelector, this);
      this.handleSelectorArg = __bind(this.handleSelectorArg, this);
      this.avgCenterOfAllElements = __bind(this.avgCenterOfAllElements, this);
      this.writeContextInfo = __bind(this.writeContextInfo, this);
      this.translateOrigin = __bind(this.translateOrigin, this);
      this.restoreToOriginal = __bind(this.restoreToOriginal, this);
      this.mousemove = __bind(this.mousemove, this);
      this.mouseup = __bind(this.mouseup, this);
      this.changeZoom = __bind(this.changeZoom, this);
      this.mousedown = __bind(this.mousedown, this);
      this.clear = __bind(this.clear, this);
      this.changeAllDrawMethods = __bind(this.changeAllDrawMethods, this);
      this.drawAll = __bind(this.drawAll, this);
      this.drawGridLines = __bind(this.drawGridLines, this);
      this.findBestZoom = __bind(this.findBestZoom, this);
      this.assignSelectors = __bind(this.assignSelectors, this);
      this.showAtomInfo = __bind(this.showAtomInfo, this);
      this.determinePointGrid = __bind(this.determinePointGrid, this);
      this.init = __bind(this.init, this);
      this.resizeToWindow = __bind(this.resizeToWindow, this);
      this.elements = [];
      try {
        this.canvas = $(this.canvas_tag)[0];
        this.context = this.canvas.getContext('2d');
      } catch (error) {
        alert(error);
      }
      if ($("#debug-info").length) {
        this.resizeToWindow();
        $(window).resize(function() {
          _this.resizeToWindow();
          return _this.drawAll();
        });
      }
      this.background_color = [255, 255, 255];
      $(this.canvas).css({
        "user-select": "none",
        "-moz-user-select": "none",
        "-webkit-user-select": "none"
      });
    }

    CanvasContext.prototype.resizeToWindow = function() {
      this.canvas.width = window.innerWidth;
      return this.canvas.height = window.innerHeight;
    };

    CanvasContext.prototype.init = function() {
      var el, _i, _len, _ref;
      if ($("#debug-info").length) {
        this.canvas.addEventListener('mousemove', this.showAtomInfo);
      }
      this.mouse_x_prev = 0;
      this.mouse_y_prev = 0;
      _ref = this.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.init();
      }
      $("#reset").on("click", this.restoreToOriginal);
      this.canvas.addEventListener('mousedown', this.mousedown);
      this.canvas.addEventListener('mousewheel', this.changeZoom);
      this.canvas.addEventListener('dblclick', this.translateOrigin);
      this.findBonds();
      this.assignSelectors();
      this.determinePointGrid();
      return this.restoreToOriginal();
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
      _ref5 = this.elements;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        el = _ref5[_i];
        _ref6 = el.atoms;
        for (_j = 0, _len2 = _ref6.length; _j < _len2; _j++) {
          a = _ref6[_j];
          w = parseInt(a.x);
          h = parseInt(a.y);
          dx = parseInt(ATOM_SIZE / this.zoom);
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
      var a, click, xx, yy, _ref;
      if (this.a_prev != null) {
        this.a_prev.info.drawColor = this.a_prev.info.prevDrawColor;
        this.a_prev.info.borderColor = this.a_prev.info.prevBorderColor;
        this.a_prev.drawPoint();
      }
      click = mousePosition(e);
      xx = parseInt((click.x - this.x_origin) / this.zoom);
      yy = parseInt((click.y - this.y_origin) / this.zoom);
      if ((this.grid[xx] != null) && (this.grid[xx][yy] != null)) {
        a = this.grid[xx][yy];
        if ((_ref = a.info.drawMethod) === 'lines' || _ref === 'cartoon') {
          return null;
        }
        a.info.prevDrawColor = a.info.drawColor;
        a.info.prevBorderColor = a.info.prevBorderColor;
        a.info.drawColor = [0, 255, 0];
        a.info.borderColor = [0, 0, 255];
        a.drawPoint();
        this.a_prev = a;
        $("#atom-info").html(a.atomInfo());
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

    CanvasContext.prototype.addElement = function(el) {
      return this.elements.push(el);
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

    CanvasContext.prototype.clear = function() {
      this.canvas.width = this.canvas.width;
      return this.context.translate(this.x_origin, this.y_origin);
    };

    CanvasContext.prototype.mousedown = function(e) {
      this.mouse_x_prev = e.clientX;
      this.mouse_y_prev = e.clientY;
      this.canvas.removeEventListener('mousemove', this.showAtomInfo);
      this.canvas.addEventListener('mousemove', this.mousemove);
      this.canvas.addEventListener('mouseout', this.mouseup);
      return this.canvas.addEventListener('mouseup', this.mouseup);
    };

    CanvasContext.prototype.changeZoom = function(e) {
      if (e instanceof WheelEvent) {
        this.zoom = this.zoom_prev - e.wheelDelta / 50;
      } else {
        this.zoom = this.zoom_prev - e;
      }
      this.clear();
      if (this.zoom > 0) {
        this.drawAll();
        return this.zoom_prev = this.zoom;
      }
    };

    CanvasContext.prototype.mouseup = function(e) {
      this.canvas.removeEventListener('mousemove', this.mousemove);
      this.canvas.addEventListener('mousemove', this.showAtomInfo);
      return this.determinePointGrid();
    };

    CanvasContext.prototype.mousemove = function(e) {
      var boundMouseMotion, ds, dx, dy, el, fps, low_fps_warning, time_start, tol, _i, _len, _ref;
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
      if (fps < 15) {
        low_fps_warning = '<p style="color: red;">It appears this molecule is too large to handle smoothly, consider using "C"/Cartoon mode, a faster computer, or upgrade your browser</p>';
      } else {
        low_fps_warning = "";
      }
      $("#debug-info").html("" + low_fps_warning + "FPS: " + (fps.toFixed(2)) + ", ds: " + (ds.toFixed(2)) + ",				dx: " + (dx.toFixed(2)) + ", dy: " + (dy.toFixed(2)));
      this.mouse_x_prev = e.clientX;
      return this.mouse_y_prev = e.clientY;
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
      if ($("#debug-info").length) this.x_origin += $(".cc-size").width() / 2;
      this.clear();
      return this.drawAll();
    };

    CanvasContext.prototype.translateOrigin = function(e) {
      var click;
      click = mousePosition(e);
      this.x_origin = click.x;
      this.y_origin = click.y;
      this.clear();
      return this.drawAll();
    };

    CanvasContext.prototype.writeContextInfo = function() {
      var htmlInfo,
        _this = this;
      htmlInfo = function(index, oldhtml) {
        var el, el_info;
        el_info = (function() {
          var _i, _len, _ref, _results;
          _ref = this.elements;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            el = _ref[_i];
            _results.push("<p>" + (el.writeContextInfo()) + "</p>");
          }
          return _results;
        }).call(_this);
        return el_info.join(" ");
      };
      $("#ctx-info").html(htmlInfo);
      return $(".element-desc").on("click", function() {
        var cc, shown;
        cc = $(this).siblings().next();
        cc = cc.add(cc.find(".element-desc"));
        shown = cc.css("display");
        if (shown === "none") {
          return cc.fadeIn("fast");
        } else {
          return cc.fadeOut("fast");
        }
      });
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
        if (c.elements != null) {
          c = c.elements[i];
        } else {
          c = c.children[i];
        }
      }
      return c;
    };

    CanvasContext.prototype.changeInfoFromSelectors = function(selectors, info_key, info_value) {
      var c, selector, _i, _len, _results;
      if (!selectors instanceof Array || typeof selectors === 'string') {
        selectors = [selectors];
      }
      _results = [];
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
        this.clear();
        if (c.info.drawMethod !== 'points') this.findBonds();
        this.drawAll();
        _results.push(null);
      }
      return _results;
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

    return CanvasContext;

  })();

  Element = (function() {

    function Element(parent, name, cc) {
      this.parent = parent;
      this.name = name;
      if (cc == null) cc = null;
      this.findBonds = __bind(this.findBonds, this);
      this.translateTo = __bind(this.translateTo, this);
      this.avgCenter = __bind(this.avgCenter, this);
      this.restoreToOriginal = __bind(this.restoreToOriginal, this);
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
      this.info = $.extend(true, {}, info);
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
        if (!(b.a1.info.drawMethod !== 'points')) continue;
        "@cc.context.beginPath()\n@cc.context.moveTo b.a1.x, b.a1.y\n@cc.context.lineTo b.a2.x, b.a2.y\n@cc.context.strokeStyle = arrayToRGB [10,10,10] \n@cc.context.lineWidth = .1/@cc.zoom+2/@cc.zoom\n@cc.context.closePath()\n@cc.context.stroke()";
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
        j_step = a1.info.drawMethod === 'cartoon' ? 30 : 5;
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

    function Atom(parent, name, x, y, z, original_atom_name) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.original_atom_name = original_atom_name;
      this.atomInfo = __bind(this.atomInfo, this);
      this.asArray = __bind(this.asArray, this);
      this.restoreToOriginal = __bind(this.restoreToOriginal, this);
      this.rotateAboutZ = __bind(this.rotateAboutZ, this);
      this.rotateAboutX = __bind(this.rotateAboutX, this);
      this.rotateAboutY = __bind(this.rotateAboutY, this);
      this.drawPoint = __bind(this.drawPoint, this);
      this.toString = __bind(this.toString, this);
      Atom.__super__.constructor.call(this, parent, name);
      this.original_position = [this.x, this.y, this.z];
    }

    Atom.prototype.toString = function() {
      return "<Atom: " + this.name + " [" + (this.x.toFixed(2)) + ", " + (this.y.toFixed(2)) + ", " + (this.z.toFixed(2)) + "]>";
    };

    Atom.prototype.drawPoint = function() {
      var c, color, zz;
      if (!(this.info.drawColor != null)) {
        color = atom_colors[this.name];
      } else {
        color = this.info.drawColor;
      }
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
      return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = parents.length; _i < _len; _i++) {
          p = parents[_i];
          _results.push(encodeHTML(p.toString()));
        }
        return _results;
      })()).join("<br>");
    };

    return Atom;

  })(Element);

  sortBondsByZ = function(b1, b2) {
    return b1.a2.z - b2.a2.z;
  };

  Bond = (function() {

    function Bond(a1, a2) {
      this.a1 = a1;
      this.a2 = a2;
      this.computeLength = __bind(this.computeLength, this);
      this.toString = __bind(this.toString, this);
      this.computeLength();
    }

    Bond.prototype.toString = function() {
      return "<Bond of Length: " + (this.computeLength().toFixed(3)) + " between " + (this.a1.toString()) + " and " + (this.a2.toString()) + ">";
    };

    Bond.prototype.computeLength = function() {
      return this.length = atomAtomDistance(this.a1, this.a2);
    };

    return Bond;

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

  atom_colors = {
    'C': [51, 255, 51],
    'O': [255, 76, 76],
    'N': [51, 51, 255],
    'P': [255, 128, 0],
    'H': [229, 229, 229],
    'S': [229, 198, 64]
  };

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
      if (a.startswith("#" && a.length === 7)) {
        console.log("hex");
        return a;
      } else {
        alert("Improperly formatted string -> color. Must be of the form #XXXXXX");
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

  sortByZ = function(a1, a2) {
    return a1.z - a2.z;
  };

  atomAtomDistance = function(a1, a2) {
    return Math.sqrt((a1.x - a2.x) * (a1.x - a2.x) + (a1.y - a2.y) * (a1.y - a2.y) + (a1.z - a2.z) * (a1.z - a2.z));
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
    link = "javascript:window.ctx.changeInfoFromSelectors('" + selector_str + "', 			'" + key + "', '" + val + "');";
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

  loadPDBAsStructure = function(filepath, cc, info) {
    if (info == null) info = null;
    $.ajax({
      async: false,
      type: "GET",
      url: filepath,
      success: function(data) {
        var a, a_str, c, chain_id_prev, d, r, resi_id_prev, s, _i, _len, _ref;
        s = new Structure(null, filepath, cc);
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
          a = new Atom(r, d.atom_name, d.x, d.y, d.z, d.original_atom_name);
          chain_id_prev = d.chain_id;
          resi_id_prev = d.resi_id;
        }
        if (info === null) {
          info = defaultInfo();
          if (s.atoms.length > 100) info.drawMethod = 'cartoon';
        }
        return s.propogateInfo(info);
      }
    });
    return null;
  };

  addNewStructure = function(e) {
    var filepath;
    filepath = $("#add-new-structure .text").val();
    loadPDBAsStructure(filepath, ctx);
    ctx.init();
    return ctx.writeContextInfo();
  };

  loadFromDict = function(structuresToLoad) {
    var filepath, info, _results;
    _results = [];
    for (filepath in structuresToLoad) {
      info = structuresToLoad[filepath];
      _results.push(loadPDBAsStructure(filepath, ctx, info));
    }
    return _results;
  };

  fromSplashLink = function(filename) {
    loadPDBAsStructure(filename, window.ctx, {
      drawMethod: 'cartoon'
    });
    ctx.init();
    return ctx.writeContextInfo();
  };

  delay = function(ms, f) {
    return setInterval(f, ms);
  };

  ctx = new CanvasContext("#coffeemolCanvas");

  window.ctx = ctx;

  window.loadFromDict = loadFromDict;

  window.loadPDBAsStructure = loadPDBAsStructure;

  window.fromSplashLink = fromSplashLink;

  if ($("#debug-info").length) {
    $("#add-new-structure .submit").on('click', addNewStructure);
    fitCtxInfo = function() {
      var c, top, w_height;
      c = $("#ctx-info");
      top = c.offset().top;
      w_height = $(window).height();
      return c.height(w_height - top - 100);
    };
    fitCtxInfo();
    $(window).resize(fitCtxInfo);
    fade = "out";
    $("#show-ctx-container").on("click", function() {
      if (fade === "in") {
        return $(".cc-size").fadeIn("fast", function() {
          fade = "out";
          return $("#show-ctx-container").html("<< Options");
        });
      } else if (fade === "out") {
        return $(".cc-size").fadeOut("fast", function() {
          fade = "in";
          return $("#show-ctx-container").html("Options >>");
        });
      }
    });
    $("#help-area").on("click", function() {
      return $(this).css("display", "none");
    });
    structuresToLoad = {
      "PDBs/A1_open_2HU_78bp_1/out-1-16.pdb": {
        drawMethod: "cartoon",
        drawColor: [47, 254, 254]
      },
      "PDBs/A1_open_2HU_78bp_1/half1_0.pdb": {
        drawMethod: "cartoon",
        drawColor: [254, 0, 254]
      },
      "PDBs/A1_open_2HU_78bp_1/half2-78bp-ID0_B1-16.pdb": {
        drawMethod: "cartoon",
        drawColor: [254, 0, 254]
      },
      "PDBs/A1_open_2HU_78bp_1/proteins-78bp-ID0_B1-16.pdb": {
        drawMethod: "cartoon",
        drawColor: [251, 251, 1]
      }
    };
    "structuresToLoad =\n	\"PDBs/half1_0.pdb\":\n		drawMethod: \"cartoon\"\n\nstructuresToLoad =\n	\"http://www.rcsb.org/pdb/files/1MMS.pdb\":\n		drawMethod: \"both\"\n		#drawColor: [47, 254, 254]";
    dismissWelcomeSplash = function() {
      $("#show-ctx-container").css("display", "block");
      $(".cc-size").css("display", "block");
      return $("#welcome-splash").fadeOut("fast");
    };
    if (!(structuresToLoad != null)) {
      $("#show-ctx-container").css("display", "none");
      $(".cc-size").css("display", "none");
      $("#welcome-splash").css({
        left: $(window).width() / 2 - $("#welcome-splash").outerWidth() / 2,
        top: $(window).height() / 2 - $("#welcome-splash").outerHeight() / 2
      });
      $("#welcome-splash").fadeIn("fast", function() {
        $("#show-ctx-container").fadeIn("fast");
        $(".sample-pdb-link").on("click", dismissWelcomeSplash);
        return $("#welcome-splash #dismiss").on("click", dismissWelcomeSplash);
      });
    } else {
      loadFromDict(structuresToLoad);
    }
    ctx.init();
    ctx.writeContextInfo();
    $(".open-dropdown").on("click", function(e) {
      var d;
      d = $(this).next();
      if ((d.filter(":hidden")).length === 1) {
        d.css({
          'top': e.pageY,
          'left': e.pageX
        });
        return d.fadeIn("fast");
      } else {
        return d.fadeOut("fast");
      }
    });
  }

}).call(this);
