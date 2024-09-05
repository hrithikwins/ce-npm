# README

## Description

This is a simple Node.js script that helps you to generate your hcce.yaml file and also provision/renew the SSL certificates. Follow the instructions below to run the script.

## Prerequisites

- Node.js installed on your system. You can download it from [here](https://nodejs.org/).

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/hubs-foundation/hubs-cloud#branch TODO
   ```
2. Navigate to the project directory:
   ```sh
   cd <hubs-cloud>
   ```
3. Install dependencies:
   ```sh
   npm install
   ```

## Config
Put all your config inside of input-values.yaml file

PERSISTENT_VOLUME_SIZE is only used when GENERATE_PERSISTENT_VOLUMES is set to true.
10Gi is 10 Gibibytes.

## Running the Script

For generating hcce.yaml file based on your values provided in input-values.yaml, run
```sh
 npm run gen-hcce
 ```

For provisioning the SSL certificates run
Note: you need to have kubectl installed for this step
```sh
npm run gen-ssl
```





## License

This project is licensed under the MIT License.
