export type SzAttrClass      = "NAME" | "OBSERVATION" | "ATTRIBUTE" | "IDENTIFIER" | "ADDRESS" | "PHONE" | "RELATIONSHIP" | "OTHER"
export const SzAttrClass     = {
    NAME: "NAME" as SzAttrClass,
    OBSERVATION: "OBSERVATION" as SzAttrClass,
    ATTRIBUTE: "ATTRIBUTE" as SzAttrClass,
    IDENTIFIER: "IDENTIFIER" as SzAttrClass,
    ADDRESS: "ADDRESS" as SzAttrClass,
    PHONE: "PHONE" as SzAttrClass,
    RELATIONSHIP: "RELATIONSHIP" as SzAttrClass,
    OTHER: "OTHER" as SzAttrClass
}
export type SzFeatureType   = "ADDRESS" | "CHARACTERISTIC" | "IDENTIFIER" | "NAME" | "OBSERVATION" | "PHONE" | "RELATIONSHIP" | "OTHER"
export const SzFeatureType = {
    ADDRESS: "ADDRESS" as SzFeatureType,
    CHARACTERISTIC: "CHARACTERISTIC" as SzFeatureType,
    IDENTIFIER: "IDENTIFIER" as SzFeatureType,
    NAME: "NAME" as SzFeatureType,
    OBSERVATION: "OBSERVATION" as SzFeatureType,
    PHONE: "PHONE" as SzFeatureType,
    RELATIONSHIP: "RELATIONSHIP" as SzFeatureType,
    OTHER: "OTHER" as SzFeatureType
}