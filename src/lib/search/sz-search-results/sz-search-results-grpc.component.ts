import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { SzEntitySearchParams } from '../../models/entity-search';
import {
  EntityDataService,
  SzAttributeSearchResult,
  SzAttributeSearchResultType,
  SzEntityIdentifier
} from '@senzing/rest-api-client-ng';
import { SzPrefsService, SzSearchResultsPrefs } from '../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { SzWhyEntitiesDialog } from '../../why/sz-why-entities.component';
import { SzAlertMessageDialog } from '../../shared/alert-dialog/sz-alert-dialog.component';
import { parseBool } from '../../common/utils';
import { howClickEvent } from '../../models/data-how';
import { SzSdkSearchMatchLevel, SzSdkSearchResolvedEntity, SzSdkSearchResponse, SzSdkSearchResult } from '../../models/grpc/engine';
import { SzSearchResultCardGrpcComponent } from '../sz-search-result-card/sz-search-result-card-grpc.component';

@Component({
    selector: 'sz-search-results-grpc',
    templateUrl: './sz-search-results-grpc.component.html',
    styleUrls: ['./sz-search-results-grpc.component.scss'],
    imports: [CommonModule, SzSearchResultCardGrpcComponent]
})
export class SzSearchResultsGrpcComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public searchResultsJSON; // TODO: remove after debugging
    public _searchResults: SzSdkSearchResult[];
    public _searchValue: SzEntitySearchParams;
    public attributeDisplay: { attr: string, value: string }[];
    private _entitySelectActive = false;
    /** @internal */
    private _selectedEntities:SzSdkSearchResult[] = [];
    private _showWhyComparisonButton: boolean = false;
    private _showHowButton: boolean = false;
    private _openWhyComparisonModalOnClick: boolean = true;
    // the api service only allows two entities at a time to be compared
    // if this changes in the future change this to match
    private _maximumEntitiesSelected = 2;
    // used to prevent annoying the user with multiple alert messages
    private _maximumAlertAlreadyShown = false;
    /** (Event Emitter) when the user clicks on the "Why" button */
    @Output() whyButtonClick = new EventEmitter<SzEntityIdentifier[]>();
    /** (Event Emitter) when the user clicks on the "How" button */
    @Output() howButtonClick = new EventEmitter<howClickEvent>();
    /**
     * Shows or hides the datasource lists in the result items header.
     * @memberof SzSearchResultsComponent
     */
    @Input() showDataSources: boolean = true;

    /**
     * Total number of search results being displayed.
     *
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    get searchResultsTotal(): number {
        return (this.searchResults && this.searchResults.length) ? this.searchResults.length : 0;
    }

  

    /**
     * Shows or hides the match keys in the result items header.
     * @memberof SzSearchResultsComponent
     */
    @Input() set showMatchKeys(value: boolean) {
        if(value && this.prefs.searchResults.showMatchKeys === undefined) {
        // current pref is undefined, set it only once so user
        // can override this value
        this.prefs.searchResults.showMatchKeys = value;
        }
    }
    public get showMatchKeys(): boolean {
        return this.prefs.searchResults.showMatchKeys !== undefined ? this.prefs.searchResults.showMatchKeys : false;
    }

    /**
     * Shows or hides the multi-select "Why" comparison button.
     * @memberof SzSearchResultsComponent
     */
    @Input() set showWhyComparisonButton(value: boolean | string) {
        this._showWhyComparisonButton = parseBool(value);
    }
    public get showWhyComparisonButton(): boolean {
        return this._showWhyComparisonButton;
    }
    /** whether or not to automatically open a modal with the entity comparison on 
     * "Why" button click. (disable for custom implementation/action)
     */
    @Input() openWhyComparisonModalOnClick(value: boolean) {
        this._openWhyComparisonModalOnClick = value;
    }
    /**
     * Shows or hides the multi-select "Why" comparison button.
     * @memberof SzSearchResultsComponent
     */
    @Input() set showHowButton(value: boolean | string) {
        this._showHowButton = parseBool(value);
        if(value !== undefined) {
        this.prefs.searchResults.showHowButton = parseBool(value);
        }
    }
    public get showHowButton(): boolean {
        return this._showHowButton;
    }

    public get entitySelectActive(): boolean {
        return this._entitySelectActive;
    }
    /**
     * get the entities selected during a multi-select operation such as when 
     * "Why" comparison mode select is active.
     */
    public get selectedEntities():SzSdkSearchResult[] {
        return this._selectedEntities;
    }
    
    /**
     * The results of a search response to display in the component.
     * @memberof SzSearchResultsComponent
     */
    @Input('results')
    public set searchResults(value: SzSdkSearchResult[]){
        // value set from webcomponent attr comes in as string
        this._searchResults = (typeof value == 'string') ? JSON.parse(value) : value;
        console.log(`set results: `, this._searchResults);
        let no_matches = this._searchResults.filter((sr) => {
            return sr.MATCH_INFO.MATCH_LEVEL_CODE == SzSdkSearchMatchLevel.POSSIBLE_MATCH
        })
        console.log(`no matches? ${no_matches.length}`);
        //this.searchResultsJSON = JSON.stringify(this._searchResults, null, 4);
    };
    /**
     * The search results being displayed in the component.
     *
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    public get searchResults(): SzSdkSearchResult[] {
        return this._searchResults;
    }

    // ----------- getters for different grouping/filtering of search results ----------

    /**
     * A list of the search results that are matches.
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    public get matches(): SzSdkSearchResult[] {
        return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
            return sr.MATCH_INFO.MATCH_LEVEL_CODE == SzSdkSearchMatchLevel.MATCH;
        }) : undefined;
    }
    /**
     * A list of the search results that are possible matches.
     *
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    public get possibleMatches(): SzSdkSearchResult[] {
        return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
            return sr.MATCH_INFO.MATCH_LEVEL_CODE == SzSdkSearchMatchLevel.POSSIBLE_MATCH;
        }) : undefined;
    }
    /**
     * A list of the search results that are related.
     *
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    public get discoveredRelationships(): SzSdkSearchResult[] {
        return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
            return sr.MATCH_INFO.MATCH_LEVEL_CODE == SzSdkSearchMatchLevel.POSSIBLY_RELATED;
        }) : undefined;
    }
    /**
     * A list of the search results that are name only matches.
     *
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    public get nameOnlyMatches(): SzSdkSearchResult[] {
        return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
            return sr.MATCH_INFO.MATCH_LEVEL_CODE == SzSdkSearchMatchLevel.NAME_ONLY_MATCH && sr.MATCH_INFO.ERRULE_CODE === 'SNAME';
        }) : undefined;
    }

    /**
     * The current search parameters being used.
     * used for displaying the parameters being searched on above result list.
     * @memberof SzSearchResultsComponent
     */
    @Input('parameters')
    public set searchValue(value: SzEntitySearchParams){
        this._searchValue = value;

        if(value){
        this.attributeDisplay = Object.keys(this._searchValue)
        .filter((key, index, self) => {
            if(key === 'IDENTIFIER_TYPE'){
            return Object.keys(self).includes('IDENTIFIER');
            }
            if(key === 'NAME_TYPE'){
            return false;
            }
            if(key === 'ADDR_TYPE'){
            return false;
            }
            if(key === 'COMPANY_NAME_ORG'){
            return false;
            }

            return true;
        })
        .map(key => {
            const humanKeys = {
            'PHONE_NUMBER':'PHONE',
            'NAME_FULL':'NAME',
            'PERSON_NAME_FULL':'NAME',
            'NAME_FIRST':'FIRST NAME',
            'NAME_LAST':'LAST NAME',
            'EMAIL_ADDRESS': 'EMAIL',
            'ADDR_CITY':'CITY',
            'ADDR_STATE':'STATE',
            'ADDR_POSTAL_CODE':'ZIP CODE',
            'SSN_NUMBER':'SSN',
            'DRIVERS_LICENSE_NUMBER':'DL#'
            }
            let retVal = {attr: key, value: this._searchValue[key]};                  // temp const
            if(humanKeys[retVal.attr]){ retVal.attr = humanKeys[retVal.attr]; };      // repl enum val with human readable
            retVal.attr = this.titleCasePipe.transform(retVal.attr.replace(/_/g,' ')); // titlecase trans

            return retVal
        })
        .filter(i => !!i);
        }
        console.log(`set search value: `, this._searchValue);
    }
    /**
     * The current search parameters being used.
     * @readonly
     * @memberof SzSearchResultsComponent
     */
    public get searchValue(): SzEntitySearchParams {
        return this._searchValue;
    }
    /**
     * Occurs when a search result item is clicked.
     *
     * @memberof SzSearchResultsComponent
     */
    @Output()
    public resultClick: EventEmitter<SzSdkSearchResolvedEntity> = new EventEmitter<SzSdkSearchResolvedEntity>();
    /**
     * DOM click handler which then triggers the "resultClick" event emitter.
     *
     * @memberof SzSearchResultsComponent
     */
    public onResultClick(evt: any, resData: SzSdkSearchResult): void
    {
        /*if(this._entitySelectActive){
            this.toggleSelected( resData );
            return;
        }*/

        // preflight check to see if user is trying to select text
        if(window && window.getSelection){
        var selection = window.getSelection();
        if(selection.toString().length === 0) {
            // evt proxy
            this.resultClick.emit(resData.ENTITY.RESOLVED_ENTITY);
        }
        } else {
        this.resultClick.emit(resData.ENTITY.RESOLVED_ENTITY);
        }
    }

    /** when the user clicks the multi-select button to enable/disable click to select behavior this handler is invoked */
    public onComparisonModeActiveChange(isActive: boolean) {
        this._entitySelectActive = isActive;
    }
    /** for multi-select the user has to click the button to change the default row behavior from 
     * click->go to detail to click->select for comparison
     */
    public onComparisonModeToggleClick(evt: any) {
        this._entitySelectActive = !this._entitySelectActive;
    }
    /** when the compare button is clicked */
    public onCompareClick(evt: any) {
        console.log('onCompareClicked: ', this._selectedEntities);
        let selectedEntityIds = this._selectedEntities.map((entityResult: SzSdkSearchResult) => {
        return entityResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
        });

        this.whyButtonClick.emit(selectedEntityIds);
        if(this._openWhyComparisonModalOnClick) {
        this.dialog.open(SzWhyEntitiesDialog, {
            panelClass: 'why-entities-dialog-panel',
            minWidth: 800,
            height: 'var(--sz-why-dialog-default-height)',
            data: {
            entities: selectedEntityIds,
            showOkButton: false,
            okButtonText: 'Close'
            }
        });
        }
    }
    /** when the "how" button is clicked */
    public onHowClicked(event: howClickEvent) {
        //console.log('@senzing/sz-search-results/onHowClicked: ', entityId);
        this.howButtonClick.emit(event);
    }
    /** clear any selected entity results if "_showWhyComparisonButton" set to true */
    public clearSelected() {
        this._selectedEntities = [];
    }
    /** add entity to selection if not already in it. remove entity from selection if already in selection */
    public toggleSelected(entityResult: SzSdkSearchResult) {
        if(entityResult) {
        let existingPosition = this._selectedEntities.findIndex((entityToMatch: SzSdkSearchResult) => {
            return entityToMatch &&  entityResult && entityToMatch.ENTITY.RESOLVED_ENTITY.ENTITY_ID === entityResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
        })
        if(existingPosition > -1 && this._selectedEntities && this._selectedEntities[ existingPosition ]) {
            // remove from array
            this._selectedEntities.splice(existingPosition, 1);
        } else if(this._selectedEntities.length < this._maximumEntitiesSelected) {
            // add to array
            this._selectedEntities.push( entityResult );
        } else if(this._selectedEntities.length >= this._maximumEntitiesSelected && !this._maximumAlertAlreadyShown) {
            let alertDialog = this.dialog.open(SzAlertMessageDialog, {
            panelClass: 'alert-dialog-panel',
            height: '240px',
            width: '338px',
            data: {
                'title':`${this._maximumEntitiesSelected} Already Selected`,
                'text':'the maximum number of entities that can be compared has been reached.',
                'buttonText':'Ok'
            }
            });
            alertDialog.afterClosed().pipe(
            take(1)
            ).subscribe((closedWithButton) => {
            if(closedWithButton) this._maximumAlertAlreadyShown = true;
            })
        }
        }
    }
    /** is a search result already selected */
    public isSelected(entityResult: SzSdkSearchResult) {
        if(entityResult) {
        let existingPosition = this._selectedEntities.findIndex((entityToMatch: SzSdkSearchResult) => {
            return entityToMatch &&  entityResult && entityToMatch.ENTITY.RESOLVED_ENTITY.ENTITY_ID === entityResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
        })
        if(existingPosition > -1) {
            return true;
        }
        }
        return false;
    }

    constructor(
        private titleCasePipe: TitleCasePipe,
        private prefs: SzPrefsService,
        private cd: ChangeDetectorRef,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
        this.prefs.searchResults.prefsChanged.pipe(
        takeUntil(this.unsubscribe$)
        ).subscribe( (pJson: SzSearchResultsPrefs)=>{
        //console.warn('SEARCH RESULTS PREF CHANGE!', pJson);
        this.cd.detectChanges();
        });
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}