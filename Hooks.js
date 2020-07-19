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
  pres[name] = pres[name] || [];
  posts[name] = posts[name] || [];

  // this is called by the last post hook
  function noop() {}

  /**
   * TODO: add better documentation for the function
   */
  currentSelf[name] = function mainFunction(config) {
    var result = new Promise(function defaultReturnValue() {});
    var self = this;
    pres = this._pres[name];
    posts = this._posts[name];
    var hookArgs = [].slice.call(arguments);
    function allPresDone() {
      if (arguments[0] instanceof Error) return err(arguments[0]);
      hookArgs = [config];
      result = fn.apply(self, hookArgs);
      // TODO: check if there is an error => run any before-error hook that is registered
      //* shedule the post hooks to run in the next tick soo this does not block the return of fn call to the root function [name]
      process.nextTick(function shedulePosthooks() {
        result
          .then(function something(value) {
            hookArgs = [value, fn.bind(self, config)];
            var postChain = posts.map(function createPostHookWrapper(post, i) {
              function wrapper() {
                if (arguments[0] instanceof Error) return err(arguments[0]);
                if (arguments.length) hookArgs = [].slice.call(arguments);
                post.apply(self, [postChain[i + 1] || noop].concat(hookArgs));
              } // end wrapper = function () {...
              return wrapper;
            }); // end posts.map(...)noop
            // TODO: check if and error to fn call
            if (postChain.length) postChain[0]();
          })
          .catch(function errorHandler() {
            // ? if an error occurs => do i run the post hook
          });
      });
      return null;
    }
    var preChain = pres.map(function createPreHookWrapper(pre, i) {
      function wrapper() {
        if (arguments[0] instanceof Error) return err(arguments[0]);

        if (arguments.length) hookArgs = [].slice.call(arguments);
        pre.apply(self, [preChain[i + 1] || allPresDone].concat(hookArgs));
      } // end wrapper = function () {...
      return wrapper;
    }); // end posts.map(...)

    (preChain[0] || allPresDone)();
    return result;
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
Hooks.prototype.post = function pre(name, fn) {
  var currentSelf = this;
  var posts = (currentSelf._posts = currentSelf._posts || {});
  (posts[name] = posts[name] || []).push(fn);
  return this;
};

var AxiosHooks = new Hooks();
module.exports = AxiosHooks;
