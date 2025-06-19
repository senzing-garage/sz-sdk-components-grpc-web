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
    FEATURES?: {
        ADDRESS?: SzSdkEntityFeature[],
        DOB?: SzSdkEntityFeature[],
        NAME?: SzSdkEntityFeature[],
        REL_LINK?: SzSdkEntityFeature[],
    },
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

