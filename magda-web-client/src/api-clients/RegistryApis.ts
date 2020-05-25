import { config } from "config";
import request from "helpers/request";
import { Publisher } from "helpers/record";
import { RawDataset } from "helpers/record";
import ServerError from "./ServerError";
import flatMap from "lodash/flatMap";

import dcatDatasetStringsAspect from "@magda/registry-aspects/dcat-dataset-strings.schema.json";
import spatialCoverageAspect from "@magda/registry-aspects/spatial-coverage.schema.json";
import temporalCoverageAspect from "@magda/registry-aspects/temporal-coverage.schema.json";
import datasetDistributionsAspect from "@magda/registry-aspects/dataset-distributions.schema.json";
import dcatDistributionStringsAspect from "@magda/registry-aspects/dcat-distribution-strings.schema.json";
import accessAspect from "@magda/registry-aspects/access.schema.json";
import provenanceAspect from "@magda/registry-aspects/provenance.schema.json";
import informationSecurityAspect from "@magda/registry-aspects/information-security.schema.json";
import datasetPublisherAspect from "@magda/registry-aspects/dataset-publisher.schema.json";
import currencyAspect from "@magda/registry-aspects/currency.schema.json";
import datasetPublishingAspect from "@magda/registry-aspects/publishing.schema.json";
import datasetAccessControlAspect from "@magda/registry-aspects/dataset-access-control.schema.json";
import organizationDetailsAspect from "@magda/registry-aspects/organization-details.schema.json";
import sourceAspect from "@magda/registry-aspects/source.schema.json";
import datasetDraftAspect from "@magda/registry-aspects/dataset-draft.schema.json";

export const aspectSchemas = {
    publishing: datasetPublishingAspect,
    "dcat-dataset-strings": dcatDatasetStringsAspect,
    "spatial-coverage": spatialCoverageAspect,
    "temporal-coverage": temporalCoverageAspect,
    "dataset-distributions": datasetDistributionsAspect,
    "dcat-distribution-strings": dcatDistributionStringsAspect,
    access: accessAspect,
    provenance: provenanceAspect,
    "information-security": informationSecurityAspect,
    "dataset-access-control": datasetAccessControlAspect,
    "dataset-publisher": datasetPublisherAspect,
    "organization-details": organizationDetailsAspect,
    currency: currencyAspect,
    source: sourceAspect,
    "dataset-draft": datasetDraftAspect
};

export function createPublisher(inputRecord: Publisher) {
    return createRecord(inputRecord);
}

export function fetchOrganization(publisherId: string): Promise<Publisher> {
    let url: string =
        config.registryReadOnlyApiUrl +
        `records/${encodeURIComponent(
            publisherId
        )}?aspect=organization-details`;

    return fetch(url, config.fetchOptions).then(response => {
        if (!response.ok) {
            let statusText = response.statusText;
            // response.statusText are different in different browser, therefore we unify them here
            if (response.status === 404) {
                statusText = "Not Found";
            }
            throw Error(statusText);
        }
        return response.json();
    });
}

export async function ensureAspectExists(id: string, jsonSchema?: any) {
    if (!jsonSchema) {
        jsonSchema = aspectSchemas[id];
    }

    if (!jsonSchema) {
        throw new Error(`Cannot locate json schema for ${id}`);
    }

    await request("PUT", `${config.registryFullApiUrl}aspects/${id}`, {
        id,
        name: jsonSchema.title,
        jsonSchema
    });
}

export async function fetchRecord(
    id: string,
    optionalAspects: string[] = [
        "dcat-distribution-strings",
        "dataset-distributions",
        "temporal-coverage&",
        "usage",
        "access",
        "dataset-publisher",
        "source",
        "source-link-status",
        "dataset-quality-rating",
        "spatial-coverage",
        "publishing",
        "dataset-access-control",
        "provenance",
        "information-security",
        "currency"
    ],
    aspects: string[] = ["dcat-dataset-strings"],
    dereference: boolean = true
): Promise<RawDataset> {
    const parameters: string[] = [];

    if (dereference) {
        parameters.push("dereference=true");
    }
    if (aspects?.length) {
        parameters.push(aspects.map(item => `aspect=${item}`).join("&"));
    }
    if (optionalAspects?.length) {
        parameters.push(
            optionalAspects.map(item => `optionalAspect=${item}`).join("&")
        );
    }

    const url =
        config.registryReadOnlyApiUrl +
        `records/${encodeURIComponent(id)}${
            parameters.length ? `?${parameters.join("&")}` : ""
        }`;

    const response = await fetch(url, config.fetchOptions);

    if (!response.ok) {
        let statusText = response.statusText;
        // response.statusText are different in different browser, therefore we unify them here
        if (response.status === 404) {
            statusText = "Not Found";
        }
        throw new ServerError(statusText, response.status);
    }
    const data = await response.json();
    if (data.records) {
        if (data.records.length > 0) {
            return data.records[0];
        } else {
            throw new ServerError("Not Found", 404);
        }
    } else {
        return data;
    }
}

export async function doesRecordExist(id: string) {
    try {
        await fetchRecord(id, [], [], false);
        return true;
    } catch (e) {
        if (e.statusCode === 404) {
            return false;
        }
        throw e;
    }
}

export type Record = {
    id: string;
    name: string;
    aspects: { [aspectId: string]: any };
};

function createRecord(inputRecord: Record) {
    return request("POST", `${config.registryFullApiUrl}records`, inputRecord);
}

export type JsonSchema = {
    $schema?: string;
    title?: string;
    description?: string;
    type: string;
    [k: string]: any;
};

function getAspectIds(record: Record): string[] {
    if (!record.aspects) {
        return [];
    }
    return Object.keys(record.aspects);
}

function getRecordsAspectIds(records: Record[]): string[] {
    return flatMap(records.map(item => getAspectIds(item)));
}

export async function createDataset(
    inputDataset: Record,
    inputDistributions: Record[]
) {
    // make sure all the aspects exist (this should be improved at some point, but will do for now)
    const aspectPromises = Object.keys(
        getRecordsAspectIds([inputDataset].concat(inputDistributions))
    ).map(aspectId => ensureAspectExists(aspectId));

    await Promise.all(aspectPromises);

    for (const distribution of inputDistributions) {
        await request(
            "POST",
            `${config.registryFullApiUrl}records`,
            distribution
        );
    }
    const json = (await request(
        "POST",
        `${config.registryFullApiUrl}records`,
        inputDataset
    )) as Record;

    return json;
}

export async function updateDataset(
    inputDataset: Record,
    inputDistributions: Record[]
) {
    // make sure all the aspects exist (this should be improved at some point, but will do for now)
    const aspectPromises = Object.keys(
        getRecordsAspectIds([inputDataset].concat(inputDistributions))
    ).map(aspectId => ensureAspectExists(aspectId));

    await Promise.all(aspectPromises);

    for (const distribution of inputDistributions) {
        if (await doesRecordExist(distribution.id)) {
            await request(
                "PUT",
                `${config.registryFullApiUrl}records/${distribution.id}`,
                distribution
            );
        } else {
            await request(
                "POST",
                `${config.registryFullApiUrl}records`,
                distribution
            );
        }
    }
    const json = (await request(
        "PUT",
        `${config.registryFullApiUrl}records/${inputDataset.id}`,
        inputDataset
    )) as Record;

    return json;
}
