require("dotenvrc");
const AWS = require("aws-sdk");
const fs = require("fs");
const zl = require("zip-lib");
const rimraf = require("rimraf");
const { exec } = require("child_process");

const { AWS_REGION } = process.env;
let [node, main, type, target] = process.argv;

if (target[target.length - 1] === "/") {
  target = target.slice(0, target.length - 1);
}

const Constant = Object.freeze({
  LAMBDA: "-l",
  LAMBDA_EDGE: "-le",
  LAMBDA_LAYER: "-ll",
});

AWS.config.update({ region: AWS_REGION });

const function_name = target.split("/").pop();
const lambda = new AWS.Lambda();
const zip = new zl.Zip();

const shell = (cmd) =>
  ((child) =>
    new Promise((resolve, reject) => {
      child.addListener("error", reject);
      child.addListener("exit", resolve);
      child.stdout.on("data", (data) => console.log(data));
    }))(exec(cmd));
try {
  if (type === Constant.LAMBDA) {
    (async () => {
      zip.addFile(`${target}/index.js`);
      await zip.archive(`${target}/lambda.zip`);
      console.log(`✅ [zip source] ${target}/lambda.zip is created!`);

      await new Promise((resolve, reject) =>
        lambda.updateFunctionCode(
          {
            FunctionName: function_name,
            ZipFile: fs.readFileSync(`${target}/lambda.zip`),
          },
          (error, data) => (error ? reject(error) : resolve(data))
        )
      );
      fs.unlinkSync(`lambda.zip`);
      console.log("✅ [updateFunctionCode] complete!");

      await new Promise((resolve, reject) =>
        lambda.publishVersion(
          {
            FunctionName: function_name,
          },
          (err, data) => (err ? reject(err) : resolve(data))
        )
      );
      console.log("✅ [publishVersion] complete!");
    })();
  } else if (type === Constant.LAMBDA_EDGE) {
  } else if (type === Constant.LAMBDA_LAYER) {
    (async () => {
      await shell(`cd ${target} && yarn install`);
      await shell(`pwd`);
      await shell(`mkdir ${target}/nodejs`);
      await shell(`cp -r ${target}/libs/* ${target}/node_modules`);
      await shell(`cp -r ${target}/node_modules ${target}/nodejs`);

      zip.addFolder(`${target}/node_modules`, "node_modules");
      zip.addFolder(`${target}/nodejs`, "nodejs");
      zip.addFile(`${target}/package.json`, "package.json");
      await zip.archive(`${target}/layer.zip`);

      console.log(`✅ [zip source] ${target}/layer.zip is created!`);

      const result = await lambda
        .publishLayerVersion({
          Content: {
            ZipFile: fs.readFileSync(`${target}/layer.zip`),
          },
          LayerName: function_name,
        })
        .promise();
      fs.unlinkSync(`${target}/layer.zip`);
      fs.unlinkSync(`${target}/yarn.lock`);
      rimraf.sync(`${target}/nodejs`);
      rimraf.sync(`${target}/node_modules`);
      console.log("✅ [publishLayerVersion] complete!");
      console.log(result);
    })();
  } else {
  }
} catch (error) {
  console.error("❌", error);
}
