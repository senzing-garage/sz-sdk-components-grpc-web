export interface SzSdkSearchResolvedEntity {
    ENTITY: {
        RESOLVED_ENTITY: {
            ENTITY_ID: number
        }
    },
    MATCH_INFO: {
        ERRULE_CODE: string
        MATCH_KEY: string
        MATCH_LEVEL_CODE: string
    }
}
export interface SzSdkSearchRelatedEntity {

}

export interface SzSdkSearchResponse {
    RESOLVED_ENTITIES: SzSdkSearchResolvedEntity[],
    RELATED_ENTITIES: SzSdkSearchRelatedEntity[]
}

