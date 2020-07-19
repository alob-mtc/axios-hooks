/* eslint-disable no-param-reassign */
/*eslint consistent-return:0*/
'use strict';
/**
 *  This adds hook functionality to the Axios
 *
 * 1. beforeRequest
 * 4. afterResponse
 */

// TODO: beforeRedirect, beforeError, beforeRetry

var utils = require('../utils');

function Hooks() {}

Hooks.prototype.register = function register(hooks, fn) {
  var curremtSelf = this;
  if (utils.isUndefined(hooks)) {
    return false;
  }
  var hasHook = false;
  if (utils.isObject(hooks)) {
    // TODO: need to extract the hook verbs from the hook object and register them
    if (hooks.beforeRequest && hooks.beforeRequest.length > 0) {
      hasHook = true;
      // register the pre hook
      hooks.beforeRequest.map(function registerPreHooks(pre) {
        curremtSelf.pre(fn.name, pre, null);
      });
    }
    if (hooks.beforeError && hooks.beforeError.length > 0) {
      hasHook = true;
      hooks.beforeError.map(function registerBeforeErrorHooks(post) {
        curremtSelf.beforeError(fn.name, post, null);
      });
    }
    if (hooks.afterResponse && hooks.afterResponse.length > 0) {
      hasHook = true;
      // register the post hook
      hooks.afterResponse.map(function registerPostHooks(post) {
        curremtSelf.post(fn.name, post, null);
      });
    }
    // register the function to the hook
    if (hasHook) {
      curremtSelf.hook(fn.name, fn, hooks.errorHandler);
    }
  }
  return hasHook;
};

/**
 *  Declares a new hook to which you can add pres and posts
 *  @param {String} name of the function
 *  @param {Function} fn method
 *  @param {Function} err error handler callback
 */
Hooks.prototype.hook = function hook(name, fn, err) {
  if (arguments.length === 1 && utils.isString(arguments[0])) {
    //* lookup the function
    fn = this[name] || null;
    if (!fn) {
      throw new Error('no function with the name ' + name + ' found');
    }
  }
  // ? why is the function(fn) asigned to the err if no err is passed
  if (!err) {
    err = function errorHandler() {
      throw new Error('add an Error Handler to handle error thrown in hooks');
    };
  }
  var currentSelf = this;
  var pres = (currentSelf._pres = currentSelf._pres || {});
  var posts = (currentSelf._posts = currentSelf._posts || {});
  var beforeErrors = (currentSelf._beforeErrors =
    currentSelf._beforeErrors || {});
  pres[name] = pres[name] || [];
  posts[name] = posts[name] || [];
  beforeErrors[name] = beforeErrors[name] || [];

  /**
   * TODO: add better documentation for the function
   */
  currentSelf[name] = function mainFunction(config) {
    var result = new Promise(function defaultReturnValue() {});
    var finishValue = null; // this is the value returned at the end this funtion call
    var self = this;
    pres = self._pres[name];
    posts = self._posts[name];
    beforeErrors = self._beforeErrors[name];
    var hookArgs = [].slice.call(arguments);
    // this is called by the last post hook => what ever value was passed over by the last post hook is set as the result value
    function noop() {
      // TODO: do some validation befor reasigning it to the result
      if (arguments[0] instanceof Error) return err(arguments[0]);
      if (arguments.length) hookArgs = [].slice.call(arguments);
      if (hookArgs.length) {
        if (hookArgs[0] instanceof Promise) {
          result = hookArgs[0];
        } else {
          result = new Promise(function createReturnValue(res) {
            res(hookArgs[0]);
          });
        }
      }
    }
    function allPresDone() {
      if (arguments[0] instanceof Error) return err(arguments[0]);
      hookArgs = [config];
      result = fn.apply(self, hookArgs);
      // asign the result promise to the finishValue
      finishValue = result
        .then(function handlePostHooks(value) {
          hookArgs = [
            value,
            function retryWithMergedOptions(updatedOptions) {
              // overwrite the hookArgs with the new fn return value
              hookArgs[0] = fn(Object.assign(config, updatedOptions));
            }
          ];
          var postChain = posts.map(function createPostHookWrapper(post, i) {
            function wrapper() {
              if (arguments[0] instanceof Error) return err(arguments[0]);
              if (arguments.length) hookArgs = [].slice.call(arguments);
              post.apply(self, [postChain[i + 1] || noop].concat(hookArgs));
            } // end wrapper = function () {...
            return wrapper;
          }); // end posts.map(...)noop
          if (postChain.length) {
            postChain[0]();
          }
          // TODO: return a promise
          // return the result promise
          return result;
        })
        .catch(function errorHandler(error) {
          // TODO: check if there is an error => run any before-error hook that is registered
          // TODO: add the befor error hook
          var beforeErrorChain = beforeErrors.map(
            function createBeforeErrorHookWrapper(post, i) {
              function wrapper() {
                if (arguments[0] instanceof Error) error = arguments[0];
                post.apply(
                  self,
                  [
                    beforeErrorChain[i + 1] ||
                      function doNothing() {
                        if (arguments[0] instanceof Error) error = arguments[0];
                      }
                  ].concat(error)
                );
              }
              return wrapper;
            }
          );
          beforeErrorChain[0]();
          return new Promise(function newPromise(_, rej) {
            rej(error);
          });
        });
    }
    var preChain = pres.map(function createPreHookWrapper(pre, i) {
      function wrapper() {
        if (arguments[0] instanceof Error) return err(arguments[0]);

        if (arguments.length) hookArgs = [].slice.call(arguments);
        return pre.apply(
          self,
          [preChain[i + 1] || allPresDone].concat(hookArgs)
        );
      } // end wrapper = function () {...
      return wrapper;
    }); // end posts.map(...)

    (preChain[0] || allPresDone)();
    return finishValue;
  };
};

/**
 * this added pre function to the pres queue
 * @param {*} name
 * @param {*} fn
 */
Hooks.prototype.pre = function pre(name, fn) {
  var currentSelf = this;
  var pres = (currentSelf._pres = currentSelf._pres || {});
  (pres[name] = pres[name] || []).push(fn);
  return this;
};

/**
 * this
 * @param {*} name
 * @param {*} fn
 */
Hooks.prototype.post = function post(name, fn) {
  var currentSelf = this;
  var posts = (currentSelf._posts = currentSelf._posts || {});
  (posts[name] = posts[name] || []).push(fn);
  return this;
};

/**
 *  this
 * @param {*} name
 * @param {*} fn
 */
Hooks.prototype.beforeError = function beforeError(name, fn) {
  var currentSelf = this;
  var beforeErrors = (currentSelf._beforeErrors =
    currentSelf._beforeErrors || {});
  (beforeErrors[name] = beforeErrors[name] || []).push(fn);
};

var AxiosHooks = new Hooks();
module.exports = AxiosHooks;
