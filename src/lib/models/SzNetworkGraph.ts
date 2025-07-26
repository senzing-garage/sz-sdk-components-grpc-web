import { SzSdkEntityResponse, SzSdkFindNetworkResponse } from "../models/grpc/engine"

export interface SzNetorkGraphCompositeResponse {
    ENTITY_RESPONSES: SzSdkEntityResponse[],
    NETWORK_RESPONSES: SzSdkFindNetworkResponse[]
}

