import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { 
  SzAttributeSearchResult,
  SzEntityDetailComponent, SzEntityIdentifier, SzEntitySearchParams, 
  SzSdkSearchResolvedEntity, SzSearchGrpcComponent, 
  SzSearchResultsGrpcComponent,
  SzSdkSearchResult,
  SzGrpcConfig,
  SzGrpcConfigManagerService
} from '@senzing/sdk-components-grpc-web';
//import { SzSdkSearchResult } from 'src/lib/models/grpc/engine';
//import { SzGrpcConfig } from 'src/lib/services/grpc/config.service';
//import { SzGrpcConfigManagerService } from 'src/lib/services/grpc/configManager.service';

@Component({
  selector: 'app-root',
  imports: [SzSearchGrpcComponent, SzSearchResultsGrpcComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public currentSearchResults: SzSdkSearchResult[];
  public currentlySelectedEntityId: number; // = 39001;
  public currentSearchParameters: SzEntitySearchParams;
  public howReportEntityId: SzEntityIdentifier;
  public _showSearchResults  = false;
  public _showEntityDetail   = false;
  public _showHowReport      = false;
  public set showGraphMatchKeys(value: boolean) {
    if (this.entityDetailComponent){
      this.entityDetailComponent.showGraphMatchKeys = value;
    }
  }
  public get showGraphMatchKeys(): boolean {
    if (this.entityDetailComponent){
      // console.log('showGraphMatchKeys: ', this.entityDetailComponent.showGraphMatchKeys);
      return this.entityDetailComponent.showGraphMatchKeys;
    }
   return false;
  }

  public get showSearchResults(): boolean {
    return this._showSearchResults && this.currentSearchResults && this.currentSearchResults.length > 0;
  }

  public get showSearchResultDetail(): boolean {
    if (this._showEntityDetail && this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }
  public get showHowReport(): boolean {
    if(this.howReportEntityId !== undefined && this._showHowReport && !this._showSearchResults && !this._showEntityDetail){
      return true;
    }
    return false;
  }
  @ViewChild('searchBox') searchBox: SzSearchGrpcComponent;
  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;

  onSearchException(err: Error) {
    throw (err.message);
  }
  onSearchResults(evt: SzSdkSearchResult[]){
    console.log(`onSearchResults: `, evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // show results
    this._showSearchResults = true;
    this._showHowReport     = false;
    this._showEntityDetail  = false;
  }
  public onSearchResultClick(entityData: SzSdkSearchResolvedEntity){
    console.log('onSearchResultClick: ', entityData);
    /*
    if (entityData && entityData.entityId > 0) {
      this.currentlySelectedEntityId = entityData.entityId;
      this._showSearchResults = false;
      this._showEntityDetail  = true;
      this._showHowReport     = false;
    } else {
      this._showSearchResults = true;
      this._showEntityDetail  = false;
      this._showHowReport     = false;
    }*/
  }

  public onHowButtonClick(howEvent) {
    console.log('onHowButtonClick: ', howEvent.entityId);
    this.loadHowReport(howEvent.entityId);
  }

  public loadHowReport(entityId) {
    this.howReportEntityId  = entityId;
    this._showSearchResults = false;
    this._showEntityDetail  = false;
    this._showHowReport     = true;
  }

  public onSearchResultsCleared(searchParams: SzEntitySearchParams | void){
    // hide search results
    this.currentSearchResults       = undefined;
    this.currentlySelectedEntityId  = undefined;
    this.howReportEntityId          = undefined;
    this._showSearchResults = false;
    this._showEntityDetail  = false;
    this._showHowReport     = false;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    console.log('onSearchParameterChange: ', searchParams);
    this.currentSearchParameters = searchParams;
  }

  public getConfig() {
    this.configManager.config.then((grpcConf: SzGrpcConfig)=>{
      console.log(`config: `, grpcConf.definition);
    })
  }

  constructor(
    private configManager: SzGrpcConfigManagerService
  ) {

  }

}
