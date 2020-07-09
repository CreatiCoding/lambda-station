require("dotenvrc");
const AWS = require("aws-sdk");
const fs = require("fs");
const zl = require("zip-lib");
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
  } else {
  }
} catch (error) {
  console.error("❌", error);
}
