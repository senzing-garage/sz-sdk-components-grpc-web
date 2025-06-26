import { SzSdkRelatedEntity, SzSdkResolvedEntity, SzSdkSearchMatchLevel } from "./grpc/engine"

export type SzRelatedEntityMatchLevel = 'RESOLVED' | 'POSSIBLY_SAME' | 'NAME_ONLY'| 'POSSIBLY_RELATED' | 'DISCLOSED';
/** the possible values of a `SzResolutionStepListItemType` is */
export const SzRelatedEntityMatchLevel = {
    MATCH: 'RESOLVED' as SzSdkSearchMatchLevel,
    NAME_ONLY_MATCH: 'NAME_ONLY' as SzSdkSearchMatchLevel,
    POSSIBLE_MATCH: 'POSSIBLY_SAME' as SzSdkSearchMatchLevel,
    POSSIBLY_RELATED: 'POSSIBLY_RELATED' as SzSdkSearchMatchLevel,
    DISCLOSED: 'DISCLOSED' as SzSdkSearchMatchLevel,
};

export interface SzResumeRelatedEntity extends SzSdkResolvedEntity {
    ERRULE_CODE?: string,
    IS_AMBIGUOUS?: 0 | 1,
    IS_DISCLOSED?: 0 | 1,
    MATCH_KEY: string,
    MATCH_LEVEL_CODE: SzRelatedEntityMatchLevel
}

export interface SzResumeEntity extends SzSdkResolvedEntity {
  BEST_NAME?: string,
  RELATED_ENTITIES: SzResumeRelatedEntity[]
}