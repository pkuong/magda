#!/usr/bin/env node
const pkg = require("../package.json");
const program = require("commander");
const chalk = require("chalk");
const NestedSetModelQueryer = require("@magda/authorization-api/dist/NestedSetModelQueryer")
    .default;
const getDBPool = require("./getDBPool");
const getNodeIdFromNameOrId = require("./getNodeIdFromNameOrId");

program
    .description(
        "Insert a node as a child node of the specified the parent node with specified name. " +
            "\nIf the parent node name is given instead of the parent node Id, the newly created child node will be inserted to the first located parent node."
    )
    .option("<nodeName>", "insert node name")
    .option("<parentNodeNameOrId>", "parent node id or name")
    .version(pkg.version)
    .action(async (nodeName, parentNodeNameOrId) => {
        try {
            if (process.argv.slice(2).length < 2) {
                program.help();
            }
            nodeName = nodeName ? nodeName.trim() : "";
            if (nodeName === "") throw new Error("Node Name can't be empty!");
            parentNodeNameOrId = parentNodeNameOrId
                ? parentNodeNameOrId.trim()
                : "";
            if (parentNodeNameOrId === "")
                throw new Error("Parent Node Name or Id can't be empty!");
            const pool = getDBPool();
            const queryer = new NestedSetModelQueryer(pool, "org_units");

            const parentNodeId = await getNodeIdFromNameOrId(
                parentNodeNameOrId,
                queryer
            );
            const nodeId = await queryer.insertNode(
                {
                    name: nodeName
                },
                parentNodeId
            );
            console.log(
                chalk.green(
                    `A node with name: ${nodeName} has been inserted to parent node. \n Id: ${nodeId}`
                )
            );
        } catch (e) {
            console.error(chalk.red(`Error: ${e}`));
        }
        process.exit(0);
    })
    .parse(process.argv);
