const crypto = require("crypto");
const fs = require("fs").promises;
const forge = require("node-forge");
const path = require("path");
const yaml = require("js-yaml");
const pemJwk = require("pem-jwk");
const utils = require("../utils");

// Generate a private key and public key
function generateKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

// Generate a self-signed certificate
function generateCertificate(keys) {
  const { privateKey, publicKey } = keys;

  // Create a new certificate
  const cert = forge.pki.createCertificate();
  cert.publicKey = forge.pki.publicKeyFromPem(publicKey);

  // Set certificate attributes
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    {
      name: "commonName",
      value: "example.org",
    },
    {
      name: "countryName",
      value: "US",
    },
    {
      shortName: "ST",
      value: "California",
    },
    {
      name: "localityName",
      value: "San Francisco",
    },
    {
      name: "organizationName",
      value: "Example Organization",
    },
    {
      shortName: "OU",
      value: "Test",
    },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Sign the certificate with its own private key
  cert.sign(forge.pki.privateKeyFromPem(privateKey), forge.md.sha256.create());

  // Convert the certificate to PEM format
  const pemCert = forge.pki.certificateToPem(cert);

  return { pemCert, privateKey, publicKey };
}

// Function to convert PEM to JWK
async function convertPemToJwk(publicKey) {
  const jwk = pemJwk.pem2jwk(publicKey);
  return JSON.stringify(jwk);
}

// Main function to handle the script
async function main() {
  try {
    // Generate keys and certificate
    const keys = generateKeys();
    const { pemCert, privateKey, publicKey } = generateCertificate(keys);

    // Save keys and certificate
    await fs.mkdir("keys", { recursive: true });

    await fs.writeFile("keys/privateKey.pem", privateKey);
    await fs.writeFile("keys/publicKey.pem", publicKey);
    await fs.writeFile("keys/certificate.crt", pemCert);

    console.log("Keys and certificate generated and saved.");
    const jwk = await convertPemToJwk(publicKey);
    process.env.PGRST_JWT_SECRET = jwk;

    process.env.initCert = pemCert;
    process.env.initKey = privateKey;

    const config = await utils.readConfig();
    config.PGRST_JWT_SECRET = process.env.PGRST_JWT_SECRET;
    config.PERMS_KEY = privateKey.replace(/\n/g, "\\\\n");

    const template = await utils.readTemplate("/generate_script", "hcce.yam");
    const replacedContent = utils.replacePlaceholders(template, config);
    await utils.writeOutputFile(replacedContent, "", "hcce.yaml");
    console.log("Environment variables set and keys generated successfully.");
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();
