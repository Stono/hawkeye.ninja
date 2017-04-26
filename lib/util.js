'use strict';
const _ = require('lodash');
module.exports = {
  /* enforces mandatory arguments, accepts a hash and a singular
     or list of keys to enforce on that hash.
     for example, enforceArgs({ a: 'b' }, ['a']);
     would valiate that the hash has a key of a */
  enforceArgs: function(hash, args, limitToo) {
    ((args instanceof Array) ? args : [args]).forEach(arg => {
      const value = _.get(hash, arg);
      if(value === undefined || value === null) {
        throw new Error(arg + ' is a required argument');
      }
    });
    if(limitToo) {
      this.limitArgs(hash, args);
    }
  },
  isInt: function(value) {
    if (isNaN(value)) {
      return false;
    }
    var x = parseFloat(value);
    return (x || 0) === x;
  },
  enforceLimitArgs: function(hash, enforced, permitted) {
    this.enforceArgs(hash, enforced);
    this.limitArgs(hash, enforced.concat(permitted));
  },
  /* sets a list of acceptable yet optional arguments */
  permittedArgs: function(hash, args, limitToo) {
    let picked = _.pick(hash, args);
    if(limitToo) { this.limitArgs(picked, args); }
    return picked;
  },
  enforceValue: function(value, allowed) {
    if(allowed.indexOf(value) === -1) {
      throw new Error(value + ' is not in the accepted range of values: ' + allowed.join(','));
    }
  },
  /* this will limit the number of items in the args array.
     if you only pass a singular min, then itll be fixed length, otherwise
     it will be a range.
     for example: util.argsLength(arguments, 1, 2) would enforce the arguments
     has a length of between 1 and 2. NOTE: You cant use this inside
     an es6 lambda function, as the scope of arguments would be incorrect */
  argsLength: function(args, min, max, fromNew) {
    if(!fromNew) {
      console.warn('argsLength is deprecated, please use enforceArgsLength!');
    }
    /* jshint maxcomplexity: 5 */
    if(!max) { max = min; }
    if(args.length < min || args.length > max) {
      throw new Error('Unexpected number of arguments (' + args.length + ')');
    }
  },
  /* this is the correctly named function, but const the old one in
     so it isnt a breaking change */
  enforceArgsLength: function(args, min, max) {
    if(this.isEmpty(max)) { max = min; }
    return this.argsLength(args, min, max, true);
  },
  /* this will limit the keys that are avaialble on a hash, but
     not enforce them */
  limitArgs: function(hash, args) {
    hash = this.defaultValue(hash, {});
    args = (args instanceof Array) ? args : [args];
    Object.keys(hash).forEach(key => {
      if(args.indexOf(key) === -1) {
        throw new Error('Unexpected argument: ' + key);
      }
    });
  },
  /* this will check if a value is null or undefined.
     if you pass true as the second arg, it'll throw as well */
  isEmpty: function(value, throwError) {
    /* jshint maxcomplexity:  5 */
    const result = (value === undefined || value === null);
    if(result && throwError) {
      if(throwError instanceof Error) {
        throw throwError;
      }
      if(typeof throwError === 'string') {
        throw new Error(throwError);
      }
      throw new Error('Null or undefined value when one was expected');
    }
    return result;
  },
  defaultValue: function(thing, value) {
    const getValue = () => {
      if(typeof value === 'function') {
        return value();
      }
      return value;
    };
    thing = (this.isEmpty(thing) ? getValue() : thing);
    return thing;
  },
  /* this will always throw if the value is null or empty */
  enforceNotEmpty: function(args, error) {
    args = (args instanceof Array) ? args : [args];
    args.forEach(value => {
      this.isEmpty(value, error || true);
    });
  },
  /* this will enforce the type of the object */
  enforceType: function(value, type) {
    if(typeof value !== type) {
      throw new Error('Expected value to be of type: ' + type + ' but got ' + typeof value);
    }
  },
  enforceTypes: function(values, types) {
    /* jshint maxcomplexity: 5 */
    let clone = _.clone(values);
    if(typeof clone === 'object') {
      clone = Object.keys(clone).map(key => { return values[key] });
    }
    clone = (clone instanceof Array) ? clone : [clone];
    types = (types instanceof Array) ? types : [types];
    let self = this;
    clone.forEach(value => {
      const compare = types[clone.indexOf(value)];
      if(!self.isEmpty(compare)) {
        self.enforceType(value, compare);
      }
    });
  },
  clone: function(object) {
    return _.cloneDeep(object);
  },
  setProperty: function(self, name, func) {
    Object.defineProperty(self, name, { value: func, enumerable: false });
  }
};
