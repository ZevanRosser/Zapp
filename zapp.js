var Zapp = Zapp ||
function(a, b, c) {
  b = b || {};
  c = c || {};
  if (typeof a != "function") {
    b = a;
    a = Zapp._ctor;
  }
  if (typeof a == "function" && !b.prototype) {
    b.constructor = a;
    a.prototype = b;
    return a;
  } else if (typeof a == "function" && typeof b == "function") {

    b.prototype = new a();
    b.prototype.constructor = b;

    for (var i in c) {
      b.prototype[i] = c[i];
    }
    b.prototype.proto = a.prototype;
    b.prototype.sup = function() {
      a.apply(this, arguments);
    }
    return b;
  }
  return {};
};

Zapp.Object = Zapp;

Zapp._ctor = function() {};

Zapp.Events = function() {};

Zapp.Events.prototype = {
  constructor : Zapp.Events,
  _makeListeners: function() {
    this._listeners = this._listeners || [];
  },
  trigger: function(type, data) {
    this._makeListeners();
    var leng = this._listeners.length;
    for (var i = 0; i < leng; i++) {
      var listener = this._listeners[i];
      if (listener == undefined) continue;
      if (listener.type == type) {
        listener.callback.call(listener.ctx || this, data);
      }
    }
    return this;
  },
  on: function(type, callback, ctx) {
    this._makeListeners();
    this._listeners.push({
      type: type,
      callback: callback,
      ctx: ctx
    });
    return this;
  },
  off: function(type, callback) {
    this._makeListeners();
    for (var i = 0; i < this._listeners.length; i++) {
      var listener = this._listeners[i];
      if (listener == undefined) continue;

      if (listener.type == type && (listener.callback == callback || callback == undefined)) {
        this._listeners.splice(i, 1);
      }
    }
    return this;
  },
  allOff: function() {
    this._listeners = [];
    return this;
  }
};

// this code needs cleanup
//#path //exact match
//#path/name,name,name // values
//^path // regexp?
Zapp.Router = Zapp(Zapp.Events, function() {
  var self = this;
  if (Zapp.Router._instance) return Zapp.Router._instance;
  Zapp.Router._instance = self;

  var prevHash = "";
  var grabHash = /#(.*?)$/;
  var grabTrailingSlash = /\/$/;
  
  function getHash(){
    var hash = window.location.href.match(grabHash);
    return hash ? hash[1] : "";
  }
  
  if (getHash() == ""){
    setTimeout(function(){
      self.trigger("/");
      //self.trigger("change", {hash:"/"});
    }, 2);
    
  }else{
    setTimeout(checkHash, 2); 
  }
  
  function checkHash() {
    var hash = getHash();
    if (prevHash != hash) {
      if (hash == ""){
        self.trigger("/");
        return;
      }
      self.trigger("change", {hash:hash});
      for (var i = 0; i < self._listeners.length; i++) {
        var type = self._listeners[i].type;
        if (type == hash) {
         
          self.trigger(type);
          continue;
        }
        if (hash.match(new RegExp(type))) {
          self.trigger(type);
          continue;
        }
        var names = type.split(",");
        var startsWith = new RegExp("^" + names[0]);
        var starts = hash.match(startsWith);
        if (starts) {

          var values = hash.replace(startsWith, "");

          values = values.replace(grabTrailingSlash, "");

          values = values.substr(1).split("/");

          if (names.length - 1 == values.length) {
            var data = {};

            for (var j = 1; j < names.length; j++) {

              data[names[j]] = values[j - 1];

            }
            self.trigger(type, data);

          } else {
            continue;
          }
        }

      }
      prevHash = hash;
    }
  }
  setInterval(checkHash, 100);

}, {
  is: function() {
    var self = this;
    self.on.apply(self, arguments);
    return self;
  },
  clear: function() {
    var self = this;
    self.off.apply(self, arguments);
    return self;
  },
  clearAll: function() {
    var self = this;
    self.allOff.apply(self, arguments);
    return self;
  }
});