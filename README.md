# axios-hooks
[![Run on Repl.it](https://repl.it/badge/github/alob-mtc/axios-hooks)](https://repl.it/github/alob-mtc/axios-hooks)
### Example usage

###### beforeRequest Hooks

Type: `Function[]`\
Default: `[]`

The beforeRequest Hooks are trigered before the request is made.

```js
const axios = require("axios");

axios({
  method: "get",
  url: "http://localhost:3000/",
  token: "JWT irierijeriheirheirhierh",
  // Hooks
  hooks: {
    // the beforeRequest hook is executed befor the network call is made
    beforeRequest: [
      /**
       * this a beforeRequest hook
       * @param {function} next this is the refrence to the next hook
       * @param {*} options this is the request config passed to axios
       */
      (next, options) => {
        //option is the request config passed to axios
        if (!options.token) {
          next(new Error("Token required"));
          return;
        }
        options.headers = {};
        options.headers["Authorization"] = options.token;
        console.log("pre1");
        next({ msg: "message from pre1" });
      },
      function (next, arg) {
        //value is the value passed from the previous pre hook
        console.log("pre2");
        next();
      },
    ],
    // this is the error handler that handles any error passed to the next function
    errorHandler: (err) => {
      console.error("this is the error =>", err);
    },
  },
})
  .then(function (response) {
    console.log(response.data);
  })
  .catch((err) => {
    console.log(err);
  });
```

##### afterResponse Hooks

Type: `Function[]`\
Default: `[]`

**Note:** When using streams, this hook is ignored.

The afterResponse Hooks are trigered after the request is made.

```js
const axios = require("axios");

axios({
  method: "get",
  url: "http://localhost:3000/",
  // Hooks
  hooks: {
    // the afterResponse hook is executed after the network call is made
    afterResponse: [
      /**
       * this a afterResponse hook
       * @param {function} next this is the refrence to the next hook
       * @param {*} response this is the response gotten from the network call
       * @param {function} retryWithMergedOptions this is the retry request function.
       */
      (next, response, retryWithMergedOptions) => {
        if (response.statusCode === 401) {
          // Unauthorized
          const updatedOptions = {
            headers: {
              token: user.refreshToken(), // Refresh the access token
            },
          };
          // Make a new retry
          retryWithMergedOptions(updatedOptions);
        }
        console.log("post1");
        // No changes otherwise
        next();
      },
    ],
    // this is the error handler that handles any error passed to the next function
    errorHandler: (err) => {
      console.error("this is the error thrown from the hook", err);
    },
  },
})
  .then(function (response) {
    console.log("fn() => ", response.data);
  })
  .catch((err) => {
    console.log("====", err);
  });
```

##### beforeError Hooks

Type: `Function[]`\
Default: `[]`

**Note:**

```js
const axios = require("axios");

axios({
  method: "get",
  url: "http://localhost:3000/",
  token: "JWT irierijeriheirheirhierh",
  // Hooks
  hooks: {
    // the beforeError hook is executed after an error
    beforeError: [
      /**
       * this a beforeError hook
       * @param {function} next this is the refrence to the next hook
       * @param {*} error this is the error gotten from the network call or thrown in the pre Hooks
       */
      (next, error) => {
        const { response } = error;
        if (response && response.body) {
          error.name = "GitHubError";
          error.message = `${response.body.message} (${response.statusCode})`;
        }
        next(error);
      },
    ],
    // this is the error handler that handles any error passed to the next function
    errorHandler: (err) => {
      console.error("this is the error =>", err);
    },
  },
})
  .then(function (response) {
    console.log("fn() => ", response.data);
  })
  .catch((err) => {
    console.log("====", err);
  });
```
