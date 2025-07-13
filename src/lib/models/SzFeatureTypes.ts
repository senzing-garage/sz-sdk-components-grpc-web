//export type SzAttrClass      = "NAME" | "OBSERVATION" | "ATTRIBUTE" | "IDENTIFIER" | "ADDRESS" | "PHONE" | "RELATIONSHIP" | "OTHER"
export type SzAttrClass      = "ADDRESS" | "ATTRIBUTE" | "CHARACTERISTIC" | "IDENTIFIER" | "NAME" | "OBSERVATION" | "OTHER" | "PHONE" | "RELATIONSHIP";
export const SzAttrClass     = {
    ADDRESS: "ADDRESS" as SzAttrClass,
    ATTRIBUTE: "ATTRIBUTE" as SzAttrClass,
    CHARACTERISTIC: "CHARACTERISTIC" as SzAttrClass,
    IDENTIFIER: "IDENTIFIER" as SzAttrClass,
    NAME: "NAME" as SzAttrClass,
    OBSERVATION: "OBSERVATION" as SzAttrClass,
    OTHER: "OTHER" as SzAttrClass,
    PHONE: "PHONE" as SzAttrClass,
    RELATIONSHIP: "RELATIONSHIP" as SzAttrClass,
}
export type SzFeatureType   = "ADDRESS" | "ATTRIBUTE" | "CHARACTERISTIC" | "IDENTIFIER" | "NAME" | "OBSERVATION" | "OTHER" | "PHONE" | "RELATIONSHIP";
//export type SzFeatureType   = "ADDRESS" | "CHARACTERISTIC" | "IDENTIFIER" | "NAME" | "OBSERVATION" | "PHONE" | "RELATIONSHIP" | "OTHER"
export const SzFeatureType = {
    ADDRESS: "ADDRESS" as SzFeatureType,
    ATTRIBUTE: "ATTRIBUTE" as SzFeatureType,
    CHARACTERISTIC: "CHARACTERISTIC" as SzFeatureType,
    IDENTIFIER: "IDENTIFIER" as SzFeatureType,
    NAME: "NAME" as SzFeatureType,
    OBSERVATION: "OBSERVATION" as SzFeatureType,
    OTHER: "OTHER" as SzFeatureType,
    PHONE: "PHONE" as SzFeatureType,
    RELATIONSHIP: "RELATIONSHIP" as SzFeatureType
}
//Type '"ATTRIBUTE"' is not assignable to type 'SzFeatureType'.ts(2345)
