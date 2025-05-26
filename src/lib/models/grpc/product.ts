export interface SzProductVersionResponse {
    "PRODUCT_NAME": string;
    "VERSION": string;
    "BUILD_VERSION": string;
    "BUILD_DATE": string;
    "BUILD_NUMBER": string;
    "COMPATIBILITY_VERSION": {
      "CONFIG_VERSION": string
    },
    "SCHEMA_VERSION": {
      "ENGINE_SCHEMA_VERSION": string,
      "MINIMUM_REQUIRED_SCHEMA_VERSION": string,
      "MAXIMUM_REQUIRED_SCHEMA_VERSION": string
    }
}

export interface SzProductLicenseResponse {
    "customer"?: string,
    "contract"?: string,
    "issueDate"?: string,
    "licenseType"?: string,
    "licenseLevel"?: string,
    "billing"?: string,
    "expireDate"?: string,
    "recordLimit"?: string
}