import { SzAttrClass } from '../SzFeatureTypes';

export interface SzSdkDataSource {
    DSRC_ID: number,
    DSRC_CODE: string
}

export type YesOrNo = "No" | "Yes";

export interface SzSdkConfigAttr {
    ATTR_ID: number,
    ATTR_CODE: string,
    ATTR_CLASS: SzAttrClass,
    FTYPE_CODE: string,
    FELEM_CODE: string,
    FELEM_REQ: YesOrNo,
    DEFAULT_VALUE?: string,
    INTERNAL: YesOrNo
}

export interface SzSdkConfigFeatureClass {
    "FCLASS_ID": number,
    "FCLASS_CODE": string,
    "FCLASS_DESC": string
}
export interface SzSdkConfigFeatureElement {
    "FELEM_ID": number,
    "FELEM_CODE": string,
    "FELEM_DESC": string,
    "DATA_TYPE": string
}

export interface SzSdkConfigFeatureType {
    "FTYPE_ID": number,
    "FTYPE_CODE": string,
    "FTYPE_DESC": string,
    "FCLASS_ID": number,
    "FTYPE_FREQ": string,
    "FTYPE_EXCL": YesOrNo,
    "FTYPE_STAB": YesOrNo,
    "PERSIST_HISTORY": YesOrNo,
    "USED_FOR_CAND": YesOrNo,
    "DERIVED": YesOrNo,
    "RTYPE_ID": number,
    "ANONYMIZE": YesOrNo,
    "VERSION": number,
    "SHOW_IN_MATCH_KEY": YesOrNo
}

export interface SzSdkConfigDataSource extends SzSdkDataSource {
    DSRC_DESC?: string,
    RETENTION_LEVEL?: string
}

export interface SzSdkConfigJson {
    G2_CONFIG: {
        CFG_ATTR: SzSdkConfigAttr[],
        CFG_CFBOM: {
            "CFCALL_ID": number,
            "FTYPE_ID": number,
            "FELEM_ID": number,
            "EXEC_ORDER": number
        }[],
        CFG_CFCALL: {
            "CFCALL_ID": number,
            "FTYPE_ID": number,
            "CFUNC_ID": number
        }[],
        CFG_CFRTN: {
            "CFRTN_ID": number,
            "CFUNC_ID": number,
            "FTYPE_ID": number,
            "CFUNC_RTNVAL": string,
            "EXEC_ORDER": number,
            "SAME_SCORE": number,
            "CLOSE_SCORE": number,
            "LIKELY_SCORE": number,
            "PLAUSIBLE_SCORE": number,
            "UN_LIKELY_SCORE": number
        }[],
        CFG_CFUNC: {
            "CFUNC_ID": number,
            "CFUNC_CODE": string,
            "CFUNC_DESC": string,
            "CONNECT_STR": string,
            "ANON_SUPPORT": YesOrNo,
            "LANGUAGE"?: string
        }[],
        CFG_DFBOM: {
            "DFCALL_ID": number,
            "FTYPE_ID": number,
            "FELEM_ID": number,
            "EXEC_ORDER": number
        }[],
        CFG_DFCALL: {
            "DFCALL_ID": number,
            "FTYPE_ID": number,
            "DFUNC_ID": number
        }[],
        CFG_DFUNC: {
            "DFUNC_ID": number,
            "DFUNC_CODE": string,
            "DFUNC_DESC": string,
            "CONNECT_STR": string,
            "ANON_SUPPORT": YesOrNo,
            "LANGUAGE"?: string
        }[],
        CFG_DSRC: SzSdkConfigDataSource[],
        CFG_DSRC_INTEREST: [],
        CFG_EFBOM: {
            "EFCALL_ID": number,
            "FTYPE_ID": number,
            "FELEM_ID": number,
            "EXEC_ORDER": number,
            "FELEM_REQ": YesOrNo
        }[],
        CFG_EFCALL: {
            "EFCALL_ID": number,
            "FTYPE_ID": number,
            "FELEM_ID": number,
            "EFUNC_ID": number,
            "EXEC_ORDER": number,
            "EFEAT_FTYPE_ID": number,
            "IS_VIRTUAL": YesOrNo
        }[],
        CFG_EFUNC: {
            "EFUNC_ID": number,
            "EFUNC_CODE": string,
            "EFUNC_DESC": string,
            "CONNECT_STR": string,
            "LANGUAGE": null
        }[],
        CFG_ERFRAG: {
            "ERFRAG_ID": number,
            "ERFRAG_CODE": string,
            "ERFRAG_DESC": string,
            "ERFRAG_SOURCE": string,
            "ERFRAG_DEPENDS": string
        }[],
        CFG_ERRULE: {
            "ERRULE_ID": number,
            "ERRULE_CODE": string,
            "RESOLVE": YesOrNo,
            "RELATE": YesOrNo,
            "RTYPE_ID": number,
            "QUAL_ERFRAG_CODE": string,
            "DISQ_ERFRAG_CODE"?: string,
            "ERRULE_TIER": number
        }[],
        CFG_FBOM: {
            "FTYPE_ID": number,
            "FELEM_ID": number,
            "EXEC_ORDER": number,
            "DISPLAY_LEVEL": number,
            "DISPLAY_DELIM"?: string,
            "DERIVED": YesOrNo
        }[],
        CFG_FBOVR: {
            "FTYPE_ID": number,
            "UTYPE_CODE": string,
            "FTYPE_FREQ": string,
            "FTYPE_EXCL": YesOrNo,
            "FTYPE_STAB": YesOrNo
        }[],
        CFG_FCLASS: SzSdkConfigFeatureClass[],
        CFG_FELEM: SzSdkConfigFeatureElement[],
        CFG_FTYPE: SzSdkConfigFeatureType[],
        CFG_GENERIC_THRESHOLD: {
            "GPLAN_ID": number,
            "BEHAVIOR": string,
            "FTYPE_ID": number,
            "CANDIDATE_CAP": number,
            "SCORING_CAP": number,
            "SEND_TO_REDO": YesOrNo
        }[],
        CFG_GPLAN: {
            "GPLAN_ID": number,
            "GPLAN_CODE": string,
            "GPLAN_DESC": string
        }[],
        CFG_RCLASS: {
            "RCLASS_ID": number,
            "RCLASS_CODE": string,
            "RCLASS_DESC": string,
            "IS_DISCLOSED": string
        }[],
        CFG_RTYPE: {
            "RTYPE_ID": number,
            "RTYPE_CODE": string,
            "RTYPE_DESC": string,
            "RCLASS_ID": number,
            "BREAK_RES": YesOrNo
        }[],
        CFG_SFCALL: {
            "SFCALL_ID": number,
            "FTYPE_ID": number,
            "FELEM_ID": number,
            "SFUNC_ID": number,
            "EXEC_ORDER": number
        }[],
        CFG_SFUNC: {
            "SFUNC_ID": number,
            "SFUNC_CODE": string,
            "SFUNC_DESC": string,
            "CONNECT_STR": string,
            "LANGUAGE": null
        }[],
        SYS_OOM: {
            "OOM_TYPE": string,
            "OOM_LEVEL": string,
            "FTYPE_ID": number,
            "THRESH1_CNT": number,
            "THRESH1_OOM": number,
            "NEXT_THRESH": number
        }[],
        SETTINGS: {
            "METAPHONE_VERSION": number
        }[],
        CONFIG_BASE_VERSION: {
            "VERSION": string,
            "BUILD_VERSION": string,
            "BUILD_DATE": string,
            "BUILD_NUMBER": string,
            "COMPATIBILITY_VERSION": {
                "CONFIG_VERSION": string
            }
        }
    }
}