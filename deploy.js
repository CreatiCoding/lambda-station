require("dotenvrc");
const AWS = require("aws-sdk");
const fs = require("fs");
const zl = require("zip-lib");
const copy = require("recursive-copy");
const rimraf = require("rimraf");

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
      const { exec } = require("child_process");
      await ((child) =>
        new Promise((resolve, reject) => {
          child.addListener("error", reject);
          child.addListener("exit", resolve);
        }))(exec(`cd ${target} && npm init -y && yarn install`));

      fs.mkdirSync(`${target}/nodejs`);
      await copy(`${target}/libs`, `${target}/node_modules`);
      await copy(`${target}/node_modules`, `${target}/nodejs`);

      zip.addFolder(`${target}/node_modules`);
      zip.addFolder(`${target}/nodejs`);
      zip.addFile(`${target}/package.json`);
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
      fs.unlinkSync(`${target}/package.json`);
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
