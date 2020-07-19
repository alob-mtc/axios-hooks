# axios-hooks

### Example usage

#### beforeRequest Hooks

```js
const axios = require("axios");

axios({
  method: "get",
  url: "http://localhost:3000/threats",
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
        next({msg: 'message from pre1});
      },
      function (next, arg) {  //value is the value passed from the previous pre hook
        console.log("pre2");
        next();
      },
      (next) => {
        console.log("pre3");
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
    // response.data.pipe(fs.createWriteStream("ada_lovelace.jpg"));
    console.log("fn() => ", response.data);
  })
  .catch((err) => {
    console.log("====", err);
  });
```

#### afterResponse Hooks

```js
const axios = require("axios");

axios({
  method: "get",
  url: "http://localhost:3000/threats",
  token: "JWT irierijeriheirheirhierh",
  // Hooks
  hooks: {
    // the afterResponse hook is executed after the network call is made
    afterResponse: [
      /**
       * this a afterResponse hook
       * @param {function} next this is the refrence to the next hook
       * @param {*} response this is the response gotten from the network call
       * @param {function} retryWithMergedOptions this is the retry function => you can updated request config with the function
       */
      (next, response, retryWithMergedOptions) => {
        if (response.statusCode === 401) {
          // Unauthorized
          const updatedOptions = {
            headers: {
              token: "", // Refresh the access token
            },
          };
          // Make a new retry
          retryWithMergedOptions(updatedOptions);
        }
        // No changes otherwise
        next();
      },
      function (next, response) {
        console.log("post1");
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
    // response.data.pipe(fs.createWriteStream("ada_lovelace.jpg"));
    console.log("fn() => ", response.data);
  })
  .catch((err) => {
    console.log("====", err);
  });
```

#### beforeError Hooks

```js
const axios = require("axios");

axios({
  method: "get",
  url: "http://localhost:3000/threats",
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
        console.log("==========ERROR===========", error);
        next(new Error("my new Error"));
      },
    ],
    // this is the error handler that handles any error passed to the next function
    errorHandler: (err) => {
      console.error("this is the error =>", err);
    },
  },
})
  .then(function (response) {
    // response.data.pipe(fs.createWriteStream("ada_lovelace.jpg"));
    console.log("fn() => ", response.data);
  })
  .catch((err) => {
    console.log("====", err);
  });
```
