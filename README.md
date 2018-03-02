# shjs

> Node.js shell command wrapper

## Usage

### Install

```shell
npm install --save shjs
```

### Create and execute a command

Create a javascript file named `bash-free.js` with the following code:

```js
var shjs = require('shjs');

// define "free" command class
var CMD_free = shjs.Executor.extend({
  name: 'free',
  args: []
});

// create a command object
var cmd = new CMD_free();

// execute the command
cmd.exec({timeout: 500}).then(function(result) {
  console.log('--------- free command output ---------');
  console.log(result.text);
  console.log('---------------------------------------');
})
```

The output is something like this:

```plain
--------- free command output ---------
             total       used       free     shared    buffers     cached
Mem:      16317884    4406468   11911416     334620     222912    1627268
-/+ buffers/cache:    2556288   13761596
Swap:     20971516          0   20971516
---------------------------------------
```