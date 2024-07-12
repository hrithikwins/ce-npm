const inquirer = require("inquirer");
const { exec } = require("child_process");
const path = require("path");

const choices = ["Generate a new config", "SSL Script"];

const scripts = {
  "Generate a new config": path.join(__dirname, "../generate_script/index.js"),
  "SSL Script": path.join(__dirname, "../ssl_script/index.js"),
};

const prompt = inquirer.createPromptModule();

  prompt([
    {
      type: "list",
      name: "script",
      message: "Which script would you like to run?",
      choices: choices,
    },
  ])
  .then((answers) => {
    const scriptPath = scripts[answers.script];
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Script error output: ${stderr}`);
        return;
      }
      console.log(`Script output:\n${stdout}`);
    });
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
  });
