const spawn = require("child_process").spawn;
const utils = require("../utils");


async function generate_ssl(config, template, url) {
    console.log(`Generating SSL certificate for: ${url}`);
    // Delete the certbotbot-http pod
    kubectl = await spawn("kubectl", ["-n", config.Namespace, "delete", "pod", "certbotbot-http"]);
    kubectl.stderr.on("data", data => {
        console.error(`${data}`);
    });
    kubectl.on("close", code => {
        if (code) {
            // The command encountered an error
            process.exit(1);
        }
    });
    // Generate the cbb.yaml file for this domain/subdomain and apply it
    const replacedContent = utils.replacePlaceholders(template, config);
    await utils.writeOutputFile(replacedContent, "ssl_script", "cbb.yaml");
    kubectl = await spawn("kubectl", ["apply", "-f", "cbb.yaml"], {cwd: "ssl_script"});
    kubectl.stderr.on("data", data => {
        console.error(`${data}`);
    });
    kubectl.on("close", code => {
        if (code) {
            // The command encountered an error
            process.exit(1);
        }
    });
    // check the status of the SSL certificate generation
    while (true) {
        // Wait for 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));
        //await sleep(10000);
        // Get the status of the certbotbot-http pod
        kubectl = await spawn("kubectl", ["get", "pod", "certbotbot-http", "-n", config.Namespace, "--no-headers", "-o", "custom-columns=STATUS:.status.phase"], {stdio: ["inherit", "inherit", "inherit"]});
        kubectl.stdout.on("data", data => {
            if (`${data}`.trim() == "Running") {
                process.stdout.write(".");
            }
            else if (`${data}`.trim() == "Succeeded") {
                console.log(":");
                kubectl = spawn("kubectl", ["-n", config.Namespace, "get", "secret", `cert-${url}`]);
                kubectl.stdout.on("data", data => {
                    console.log(`${data}`);
                });
                return
            }
            else {
                console.log(`bad pod status: ${data}`)
            }
        });
        kubectl.on("close", code => {
            // Check the if the program returned a non zero exit code
            if (code) {
                console.log("ERROR -- certbotbot-http pod is missing");
                process.exit(1);
            }
        });
    }
}

async function main() {
    try {
        console.log("starting script");
        const config = await utils.readConfig();
        const template = await utils.readTemplate("ssl_script", "cbb.yam");
        await generate_ssl(config, template, config.HUB_DOMAIN);
        await generate_ssl(config, template, `assets.${config.HUB_DOMAIN}`);
        await generate_ssl(config, template, `stream.${config.HUB_DOMAIN}`);
        await generate_ssl(config, template, `cors.${config.HUB_DOMAIN}`);
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();
