import { SzResolvedEntity } from "@senzing/rest-api-client-ng";
import { SzSdkConfigAttr } from "../models/grpc/config";
import { SzSdkEntityFeature, SzSdkSearchResolvedEntity } from "../models/grpc/engine";
import { SzAttrClass, SzFeatureType } from "../models/SzFeatureTypes";
import { SzGrpcConfigManagerService } from "../services/grpc/configManager.service";
import { SzResumeEntity } from "../models/SzResumeEntity";


export function getStringEntityFeatures(features: {
   [key: string] : SzSdkEntityFeature[]
}, groupByAttributeClass = false, fTypeToAttrClassMap?: Map<string, SzAttrClass | SzAttrClass[]>): Map<string, string[]> {
    let retMap = new Map<string, string[]>();
    for(let fTypeCode in features){
        let groupKey = (groupByAttributeClass && fTypeToAttrClassMap && fTypeToAttrClassMap.has(fTypeCode)) ? fTypeToAttrClassMap.get(fTypeCode) as SzAttrClass : fTypeCode;
        /*if(groupByAttributeClass && fTypeToAttrClassMap && fTypeToAttrClassMap.has(fTypeCode)) {
            // get attribute class(es) by fTypeCode
            let attrClassesForFType = SzGrpcConfigManagerService.getAttrClassFromFeatureTypeCode(fTypeCode, attributes);
            if(attrClassesForFType) {
                if(attrClassesForFType.length == 1) {
                    groupKey = attrClassesForFType[0];
                } else {
                    console.warn(`more than 1 ATTR_CLASS result for "${fTypeCode}"`, attrClassesForFType);
                }
            }
        }*/
        let _values     = retMap.has(groupKey) ? retMap.get(groupKey) : [];
        let _featValues = features[fTypeCode];
        _featValues.forEach((feat)=> {
            feat.FEAT_DESC_VALUES.forEach((featDesc)=>{
                _values.push(featDesc.FEAT_DESC);
            })
        });
        retMap.set(groupKey, _values);
    }
    return retMap;
}

export function getEntityFeaturesByType(features: {
    [key: string] : SzSdkEntityFeature[]
 }, fTypeToAttrClassMap: Map<SzFeatureType, SzAttrClass | SzAttrClass[]>): Map<SzFeatureType, SzSdkEntityFeature[]> {
     let retMap = new Map<SzFeatureType, SzSdkEntityFeature[]>();
     for(let fTypeCode in features){
        let _fTypeCodeAsType = fTypeCode as SzFeatureType;
         let groupKey = (fTypeToAttrClassMap && fTypeToAttrClassMap.has(_fTypeCodeAsType)) ? fTypeToAttrClassMap.get(_fTypeCodeAsType) as SzAttrClass : _fTypeCodeAsType;
         let _values     = retMap.has(groupKey) ? retMap.get(groupKey) : [];
         let _featValues = features[fTypeCode];
         _featValues.forEach((feat)=> {
            _values.push(feat);
         });
         retMap.set(groupKey, _values);
     }
     return retMap;
 }



export function bestEntityName(entity: SzResumeEntity | SzSdkSearchResolvedEntity): string {
    let retVal = undefined;
    if((entity as SzResumeEntity).BEST_NAME) {
        retVal = (entity as SzResumeEntity).BEST_NAME;
    }    
    if((entity as SzSdkSearchResolvedEntity).ENTITY_NAME) {
        retVal = (entity as SzSdkSearchResolvedEntity).ENTITY_NAME;
    }
    return retVal;
}