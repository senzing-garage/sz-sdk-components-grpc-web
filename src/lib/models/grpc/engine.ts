export type SzSdkSearchMatchLevel = 'RESOLVED' | 'POSSIBLY_SAME' | 'NAME_ONLY'| 'POSSIBLY_RELATED' | 'DISCLOSED';
/** the possible values of a `SzResolutionStepListItemType` is */
export const SzSdkSearchMatchLevel = {
    MATCH: 'RESOLVED' as SzSdkSearchMatchLevel,
    NAME_ONLY_MATCH: 'NAME_ONLY' as SzSdkSearchMatchLevel,
    POSSIBLE_MATCH: 'POSSIBLY_SAME' as SzSdkSearchMatchLevel,
    POSSIBLY_RELATED: 'POSSIBLY_RELATED' as SzSdkSearchMatchLevel,
    DISCLOSED: 'DISCLOSED' as SzSdkSearchMatchLevel,
};
export interface SzSdkEntityFeature {
    FEAT_DESC: string
    FEAT_DESC_VALUES: {
        FEAT_DESC: string, LIB_FEAT_ID: number
    }[]
    LIB_FEAT_ID: number
    USAGE_TYPE?: string
}
export interface SzSdkSearchRecordSummary {DATA_SOURCE: string, RECORD_COUNT: number}
export interface SzSdkSearchResolvedEntity{
    ENTITY_ID: number,
    ENTITY_NAME: string,
    FEATURES?: {[key: string]: SzSdkEntityFeature[]},
    RECORDS?: {DATA_SOURCE: string, RECORD_ID: string}[],
    RECORD_SUMMARY?: SzSdkSearchRecordSummary[]
}

export interface SzSdkSearchResult {
    ENTITY: {
        RESOLVED_ENTITY: SzSdkSearchResolvedEntity
    },
    MATCH_INFO: {
        ERRULE_CODE: string
        MATCH_KEY: string
        MATCH_LEVEL_CODE: SzSdkSearchMatchLevel
    }
}
export interface SzSdkSearchRelatedEntity {

}

export interface SzSdkSearchResponse {
    RESOLVED_ENTITIES: SzSdkSearchResult[],
    RELATED_ENTITIES: SzSdkSearchResult[]
}

export interface SzSdkEntityBaseRecord {
    "RECORD_ID": string,
    "DATA_SOURCE": string,
}
export interface SzSdkEntityRelatedRecord extends SzSdkEntityBaseRecord {}
export interface SzSdkEntityRecord extends SzSdkEntityBaseRecord {
    "INTERNAL_ID"?: number,
    "MATCH_KEY"?: string,
    "MATCH_LEVEL_CODE"?: SzSdkSearchMatchLevel,
    "ERRULE_CODE"?: string,
    "FIRST_SEEN_DT"?: string,
    "LAST_SEEN_DT"?: string
}

export interface SzSdkEntityRecordSummary {
    "DATA_SOURCE": string,
    "RECORD_COUNT": number
}

export interface SzSdkBaseEntity {
    ENTITY_ID: number,
    ENTITY_NAME:string,
    RECORD_SUMMARY?: SzSdkEntityRecordSummary[]
}

export interface SzSdkRelatedEntity  extends SzSdkBaseEntity {
    ERRULE_CODE?: string,
    IS_AMBIGUOUS?: 0 | 1,
    IS_DISCLOSED?: 0 | 1,
    MATCH_KEY: string,
    MATCH_LEVEL_CODE: SzSdkSearchMatchLevel,
    RECORDS?: SzSdkEntityRelatedRecord
}

export interface SzSdkResolvedEntity extends SzSdkBaseEntity {
    FEATURES?: {[key: string]: SzSdkEntityFeature[]},
    RECORDS?: SzSdkEntityRecord[],
}

export interface SzSdkEntityResponse {
    RELATED_ENTITIES: SzSdkRelatedEntity[],
    RESOLVED_ENTITY: SzSdkResolvedEntity[]
}

export interface SzSdkFindNetworkNetworkLink {
    "MIN_ENTITY_ID": number,
    "MAX_ENTITY_ID": number,
    "MATCH_LEVEL_CODE": SzSdkSearchMatchLevel,
    "MATCH_KEY": string,
    "ERRULE_CODE"?: string,
    "IS_DISCLOSED"?: 0 | 1,
    "IS_AMBIGUOUS"?: 0 | 1
}

export interface SzSdkFindNetworkResponse {
    ENTITIES: {
        RELATED_ENTITIES: SzSdkRelatedEntity[],
        RESOLVED_ENTITY: SzSdkResolvedEntity
    }[],
    ENTITY_NETWORK_LINKS: SzSdkFindNetworkNetworkLink[],
    ENTITY_PATHS: any
}