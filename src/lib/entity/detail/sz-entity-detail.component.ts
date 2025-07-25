import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef, TemplateRef, ViewContainerRef } from '@angular/core';
import { SzSearchService } from '../../services/sz-search.service';
import { tap, takeUntil, filter, take } from 'rxjs/operators';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

import {
  SzEntityData,
  EntityDataService as SzEntityDataService,
  SzRelatedEntity,
  SzEntityRecord,
  SzRelationshipType,
  SzEntityIdentifier,
  SzRecordId
} from '@senzing/rest-api-client-ng';
import { MatDialog } from '@angular/material/dialog';

import { SzEntityDetailGraphComponent } from './sz-entity-detail-graph/sz-entity-detail-graph.component';
import { SzWhyEntityDialog } from '../../why/sz-why-entity.component';
import { SzWhyEntitiesDialog } from '../../why/sz-why-entities.component';

import { SzPrefsService } from '../../services/sz-prefs.service';
import { parseBool } from '../../common/utils';
import { SzDataSourceRecordsSelection, SzWhySelectionModeBehavior, SzWhySelectionMode } from '../../models/data-source-record-selection';
import { SzMatchKeyTokenFilterScope } from '../../models/graph';
import { howClickEvent } from '../../models/data-how';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzAlertMessageDialog } from '../../shared/alert-dialog/sz-alert-dialog.component';

/**
 * The Entity Detail Component.
 * Generates a complex detail page from input parameters.
 *
 * @example
 * <!-- (Angular) -->
 * <sz-entity-detail
 *   [showGraphMatchKeys]="true"
 *   (entityIdChanged)="entityChangedHandler($event)"
 *   [entityId]="currentlySelectedEntityId"></sz-entity-detail>
 *
 * @example
 * <!-- (WC) by attribute -->
 * <sz-wc-entity-detail
 *   show-graph-match-keys="true"
 *   entity-id="1002"></sz-wc-entity-detail>
 *
 * @example
 * <!-- (WC) by DOM -->
 * <sz-wc-entity-detail id="sz-ent-detail"></sz-wc-entity-detail>
 * <script>
 * document.getElementById('sz-ent-detail').entityId = 1002;
 * document.getElementById('sz-ent-detail').addEventListener('entityIdChanged', (entId) => { console.log('entity id changed!', entId); })
 * </script>
 */
@Component({
    selector: 'sz-entity-detail',
    templateUrl: './sz-entity-detail.component.html',
    styleUrls: ['./sz-entity-detail.component.scss'],
    standalone: false
})
export class SzEntityDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** @internal */
  overlayRef: OverlayRef | null;

  private _entityId: number;
  private entityDetailJSON: string = "";
  private _requestDataOnIdChange = true;
  public entity: SzEntityData;


  // layout enforcers
  /** @internal */
  public _layoutEnforcers: string[] = [''];
  /** @internal */
  public _forceLayout = false;
  /**
   * Takes a collection or a single value of layout enum css classnames to pass
   * to all children components. this value overrides auto-responsive css adjustments.
   *
   * @example forceLayout='layout-narrow'
   *
   * @memberof SzEntityDetailComponent
   */
  @Input() public set forceLayout(value: string | string[]) {
    if(value){
      this._forceLayout = true;
      if(typeof value == 'string'){
        if(value.indexOf(',') > -1){
          this._layoutEnforcers = value.split(',');
        } else {
          this._layoutEnforcers = [value];
        }
      } else {
        this._layoutEnforcers = value;
      }
    }

  }
  /**
   * update prefs values when setter values change.
   * useful when you have multiple component instances but not
   * all of them should be setting prefs state.
   */
  private _updatePrefsOnChange: boolean = true;
  /**
   * update prefs values when setter values change.
   * useful when you have multiple component instances but not
   * all of them should be setting prefs state. OR if you have a specific
   * instance that shouldn't be updating pref state.
   */
  @Input() set updatePrefsOnChange(value: boolean) {
    this._updatePrefsOnChange = value;
  }

  // data views
  _discoveredRelationships: SzRelatedEntity[];
  _disclosedRelationships: SzRelatedEntity[];
  _possibleMatches: SzRelatedEntity[];
  _matches: SzEntityRecord[];

  // show | hide specific sections
  private _showGraphSection: boolean = true;
  private _showHowSection: boolean = false;
  private _showMatchesSection: boolean = true;
  private _showPossibleMatchesSection: boolean = true;
  private _showPossibleRelationshipsSection: boolean = true;
  private _showDisclosedSection: boolean = true;
  // collapse or expand specific sections
  private _graphSectionCollapsed: boolean = true;
  private _recordsSectionCollapsed: boolean = false;
  private _possibleMatchesSectionCollapsed: boolean = false;
  private _possibleRelationshipsSectionCollapsed: boolean = false;
  private _disclosedRelationshipsSectionCollapsed: boolean = false;
  // why utilities
  private _whySelectionMode: SzWhySelectionModeBehavior = SzWhySelectionMode.NONE;
  private _showEntityWhyFunction: boolean = false;
  private _showRecordWhyUtilities: boolean = false;
  private _showRelatedWhyNotUtilities: boolean = false;
  private _openWhyComparisonModalOnClick: boolean = true;
  // how utilities
  private _showEntityHowFunction: boolean       = false;
  private _enableReEvaluateFunction: boolean    = false;
  private _entityRequiresReEvaluation: boolean  = false;
  private _showReEvaluateButton: boolean        = false;
  private _reEvaluationMessage: string          = "Entity needs to be Re-Evaluated before the How Report can be generated. Contact your Senzing admin."
  private _showReEvaluateMessage: boolean       = true;
  private _entityHasHowSteps: boolean           = undefined;
  private _dynamicHowFeatures: boolean          = false;
  private _showHowFunctionWarnings: boolean     = false;
  private _howFunctionDisabled: boolean         = false;
  private _reEvaluateButtonDisabled: boolean    = false;
  private _entityNeedsReEvaluation: boolean     = false;
  // graph utilities
  private _showGraphNodeContextMenu: boolean = false;
  private _showGraphLinkContextMenu: boolean = false;

  /** @internal */
  private _headerHowButtonClicked: Subject<howClickEvent> = new Subject<howClickEvent>();
  /** (Observable) when the user clicks on the "how" button in header under the icon */
  public headerHowButtonClicked = this._headerHowButtonClicked.asObservable();
  /** (Event Emitter) when the user clicks on the "How" button in header under the icon */
  @Output() howButtonClick        = new EventEmitter<howClickEvent>();
  @Output() reEvaluateButtonClick = new EventEmitter<howClickEvent>();
  /** (Event Emitter) when the how report would have no resolution steps resulting in an empty report */
  @Output() howReportUnavailable  = new EventEmitter<boolean>();
  @Output() requiresReEvaluation  = new EventEmitter<boolean>();

  /** @internal */
  private _headerWhyButtonClicked: Subject<SzEntityIdentifier> = new Subject<SzEntityIdentifier>();
  /** (Observable) when the user clicks on the "Why" button in header under the icon */
  public headerWhyButtonClicked = this._headerWhyButtonClicked.asObservable();
  /** @internal */
  private _headerReEvaluateButtonClicked: Subject<howClickEvent> = new Subject<howClickEvent>();
  /** (Observable) when the user clicks on the "reevaluate" button in header under the icon */
  public headerReEvaluateButtonClicked = this._headerReEvaluateButtonClicked.asObservable();
  /** (Event Emitter) when the user clicks on the "Why" button in header under the icon */
  @Output() headerWhyButtonClick = new EventEmitter<SzEntityIdentifier>();
  /** (Event Emitter) when the user clicks on the "Re-Evaluate* button in header under the icon **/
  @Output() headerReEvaluateButtonClick = new EventEmitter<SzEntityIdentifier>();
  /** (Event Emitter) when the user clicks on the "Why" button in records section */
  @Output() recordsWhyButtonClick = new EventEmitter<SzRecordId[]>();
  /** (Event Emitter) when the user clicks on the "Why Not" button in a related entity card */
  @Output() relatedEntitiesWhyNotButtonClick = new EventEmitter<SzEntityIdentifier[]>();
  /** (Event Emitter) when the user clicks on a datasource record for either single-select
   * or multi-select operations.
   */
  @Output() dataSourceRecordsSelected = new EventEmitter<SzDataSourceRecordsSelection>();

  /** whether or not to show the built-in context menu on graph link right-click */
  public get showGraphLinkContextMenu(): boolean {
    return this._showGraphLinkContextMenu;
  }
  /** whether or not to show the built-in context menu on graph link right-click */
  @Input() set showGraphLinkContextMenu(value: boolean) {
    this._showGraphLinkContextMenu = value;
  }
  /** whether or not to show the built-in context menu on graph entity right-click */
  public get showGraphContextMenu(): boolean {
    return this._showGraphNodeContextMenu;
  }
  /** whether or not to show the built-in context menu on graph entity right-click */
  @Input() set showGraphContextMenu(value: boolean) {
    this._showGraphNodeContextMenu = value;
  }
  /** @internal */
  private _graphMatchKeyTokenSelectionScope: SzMatchKeyTokenFilterScope       = SzMatchKeyTokenFilterScope.EXTRANEOUS;
  /** sets the depth of what entities are shown when they match the
   * match key token filters. possible values are "CORE" and "EXTRANEOUS".
   * when "CORE" is selected only entities that are directly related to queried
   * entity/entities are filtered by match key tokens.
   * when "EXTRANEOUS" is selected ALL entities no matter how they are related
   * are filtered by match key tokens.
   */
  @Input() public set graphMatchKeyTokenSelectionScope(value: SzMatchKeyTokenFilterScope | string){
    if((value as string) === 'CORE') {
      this._graphMatchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.CORE;
    } else if((value as string) === 'EXTRANEOUS') {
      this._graphMatchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.EXTRANEOUS;
    } else {
      this._graphMatchKeyTokenSelectionScope = (value as SzMatchKeyTokenFilterScope);
    }
  }
  /**
   * get the value of match key token filterings scope. possible values are
   * "CORE" and "EXTRANEOUS".
   * core means the filtering is only being applied to entities that are directly
   * related to the primary entity/entities being displayed.
   */
  public get graphMatchKeyTokenSelectionScope() {
    return this._graphMatchKeyTokenSelectionScope as SzMatchKeyTokenFilterScope;
  }
  /** whether or not to show the "why" comparison button for records */
  public get showRecordWhyUtilities(): boolean {
    return this._showRecordWhyUtilities;
  }
  /** whether or not to show the "why" comparison button for records */
  @Input() set showRecordWhyUtilities(value: boolean) {
    this._showRecordWhyUtilities = value;
    // we default to selection mode "single" if set to true and selection mode not explicitly set
    if(value && this._whySelectionMode === SzWhySelectionMode.NONE) {
      this._whySelectionMode = SzWhySelectionMode.SINGLE;
    } else if(!value && this._whySelectionMode !== SzWhySelectionMode.NONE) {
      this._whySelectionMode = SzWhySelectionMode.NONE;
    }
  }
  /** if "showRecordWhyUtilities" set to true there is a "single-record" select behavior, and a
   * "multi-select" behavior. possible values are `SINGLE` and `MUTLI`
  */
  public get whySelectionMode(): SzWhySelectionModeBehavior {
    return this._whySelectionMode;
  }
  /** if "showRecordWhyUtilities" set to true there is a "single-record" select behavior, and a
   * "multi-select" behavior. possible values are `SINGLE` and `MUTLI`
  */
  @Input() set whySelectionMode(value: SzWhySelectionModeBehavior) {
    this._whySelectionMode = value;
  }
  /** when "dynamicHowFeatures" or "showHowFunctionWarnings" is set to true
   * an api request to the entity's how report is made and this value is set to true.
   */
  @Input() set howFunctionDisabled(value: boolean) {
    this._howFunctionDisabled = value;
  }
  /** when "dynamicHowFeatures" or "showHowFunctionWarnings" is set to true
   * an api request to the entity's how report is made and this value is set to true.
   */
  get howFunctionDisabled(): boolean {
    return this._howFunctionDisabled;
  }
  /**
   */
  @Input() set reEvaluateButtonDisabled(value: boolean) {
    this._reEvaluateButtonDisabled = value;
  }
  /**
   */
  get reEvaluateButtonDisabled(): boolean {
    return this._reEvaluateButtonDisabled;
  }
  /** if the entity's how report has no resolution steps and this value is set to true the button for the
   * how report in the header will be disabled and will not emit the click event when the user clicks it
   */
  @Input() set dynamicHowFeatures(value: boolean) {
    this._dynamicHowFeatures = value;
  }
  /** if the entity's how report has no resolution steps and this value is set to true the button for the
   * how report in the header will be disabled and will not emit the click event when the user clicks it
   */
  get dynamicHowFeatures(): boolean {
    return this._dynamicHowFeatures;
  }
  /** whether or not the "how" button for the entire entity is shown */
  public get showEntityHowFunction(): boolean {
    return this._showEntityHowFunction;
  }
  /** whether or not to show the "how" button for the entire entity */
  @Input() set showEntityHowFunction(value: boolean) {
    if(value !== this._showEntityHowFunction &&
      value === true &&
      this._entityId !== undefined &&
      (this._dynamicHowFeatures === true ||
      this._showHowFunctionWarnings === true)
      ) {
        // check to see if entity has how steps, if not disable how functions
        this.checkIfEntityHasHowSteps();
    }
    this._showEntityHowFunction = value;
  }
  /** whether or not to show the "re-evaluate" button AND/OR message when needed */
  public get enableReEvaluateFunction(): boolean {
    return this._enableReEvaluateFunction;
  }
  /** whether or not to show the "re-evaluate" button AND/OR message when needed */
  @Input() set enableReEvaluateFunction(value: boolean) {
    this._enableReEvaluateFunction = value;
  }

  /** whether or not the "reevaluate" messaging shows when needed*/
  public get showReEvaluateMessage(): boolean {
    return this._showReEvaluateMessage;
  }
  /** whether or not the "reevaluate" messaging shows when needed*/
  @Input() set showReEvaluateMessage(value: boolean) {
    this._showReEvaluateMessage = value;
  }
  /** whether or not the "reevaluate" button shows when needed*/
  public get showReEvaluateButton(): boolean {
    return this._showReEvaluateButton;
  }
  /** whether or not the "reevaluate" button shows when needed*/
  @Input() set showReEvaluateButton(value: boolean) {
    this._showReEvaluateButton = value;
  }
  /** whether or not the "reevaluate" messaging */
  public get entityRequiresReEvaluation(): boolean {
    return this._entityRequiresReEvaluation;
  }
  /** message to show when re-evaluation is required */
  public get reEvaluateMessage(): string {
    return this._reEvaluationMessage;
  }
  /** message to show when re-evaluation is required */
  @Input() set reEvaluateMessage(value: string) {
    this._reEvaluationMessage = value;
  }
  /** when set to true a request to the how report for the entity is made to check whether or not anything
   * would be displayed and if the result has no steps in it's "resolutionSteps" collection when the user clicks
   * the how report button an alert will be displayed telling the user that the report is unavailable.
   */
  @Input() set showHowFunctionWarnings(value: boolean) {
    this._showHowFunctionWarnings = value;
    if(value === true) { this.dynamicHowFeatures = true; }
  }
  /** when set to true a request to the how report for the entity is made to check whether or not anything
   * would be displayed and if the result has no steps in it's "resolutionSteps" collection when the user clicks
   * the how report button an alert will be displayed telling the user that the report is unavailable.
   */
  get showHowFunctionWarnings(): boolean {
    return this._showHowFunctionWarnings;
  }
  /** whether or not the "why" comparison button for the entire entity is shown */
  public get showEntityWhyFunction(): boolean {
    return this._showEntityWhyFunction;
  }
  /** whether or not to show the "why" comparison button for the entire entity */
  @Input() set showEntityWhyFunction(value: boolean) {
    this._showEntityWhyFunction = value;
  }
  /** whether or not the "why" comparison button on "possible matches" */
  public get showRelatedWhyNotFunction(): boolean {
    return this._showRelatedWhyNotUtilities;
  }
  /** whether or not to show the "why not" comparison button on "possible matches" */
  @Input() set showRelatedWhyNotFunction(value: boolean) {
    this._showRelatedWhyNotUtilities = value;
  }
  /** whether or not to automatically open a modal with the entity comparison on
   * "Why" button click. (disable for custom implementation/action)
   */
  @Input() openWhyComparisonModalOnClick(value: boolean) {
    this._openWhyComparisonModalOnClick = value;
  }

  /** used for print and pdf support, allows fetching DOM HTMLElement */
  @ViewChild('nativeElementRef') nativeElementRef: ElementRef;
  public get nativeElement(): HTMLElement {
    return this.nativeElementRef.nativeElement;
  }
  @ViewChild(SzEntityDetailGraphComponent)
  public graphComponent: SzEntityDetailGraphComponent;

  /** built-in graph context menus */
  @ViewChild('graphNodeContextMenu') graphNodeContextMenu: TemplateRef<any>;
  @ViewChild('graphLinkContextMenu') graphLinkContextMenu: TemplateRef<any>;

  /**
   * emitted when the component begins a request for an entities data.
   * @returns entityId of the request being made.
   */
  @Output() requestStart: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when a search is done being performed.
   * @returns the result of the entity request OR an Error object if something went wrong.
   */
  @Output() requestEnd: EventEmitter<SzEntityData|Error> = new EventEmitter<SzEntityData|Error>();
  /**
   * emitted when a search encounters an exception
   * @returns error object.
   */
  @Output() exception: EventEmitter<Error> = new EventEmitter<Error>();
  /**
   * emitted when the entity data to display has been changed.
   */
  @Output('dataChanged')
  dataChanged: Subject<SzEntityData> = new Subject<SzEntityData>();
  /**
   * emitted when the entity id has been changed.
   */
  @Output('entityIdChanged')
  entityIdChanged: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when the user right clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphContextMenuClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user right clicks a relationship link line or label.
   * @returns object with various entity and ui properties.
   */
  @Output() graphRelationshipContextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphEntityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user clicks a relationship link line or label.
   * @returns object with various entity and ui properties.
   */
  @Output() graphRelationshipClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphEntityDblClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphPopOutClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphScrollWheelEvent: EventEmitter<any> = new EventEmitter<any>();
  /**
   * Allow users to scroll to zoom the graph area
   */
  @Input() graphAllowScrollingZoom: boolean = false;

  /** what position the pop-out icon should be displayed
   * ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left')
  */
  @Input() graphPopOutIconPosition = 'bottom-left';
  /** what position the pop-out icon should be displayed
   * ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left')
  */
  @Input() graphZoomControlPosition = 'top-left';
  /** show the small 'show match keys' control in the bottom right */
  @Input() graphShowMatchKeyControl = true;
  /** show the pop-out icon control */
  @Input() graphShowPopOutIcon = false;
  /** show the pop-out icon control */
  @Input() graphShowFiltersControl = false;
  /** show the pop-out icon control */
  @Input() graphShowZoomControl = false;

  /**
   * set the entity data directly, instead of via entityId lookup.
   */
  @Input('data')
  public set entityData(value: SzEntityData) {
    this.entity = value;
    this.onEntityDataChanged();
  }
  /**
   * set the entity data by passing in an entity id number.
   */
  @Input()
  public set entityId(value: number) {
    const _hasChanged = (value !== this._entityId) ? true : false;
    this._entityId = value;
    // safety check
    if(_hasChanged && this._requestDataOnIdChange) { this.onEntityIdChange(); }
  }

  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showGraphSection(value: any) {
    this._showGraphSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showGraphSection !== this._showGraphSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showGraphSection = this._showGraphSection;
    }
  }
  public get showGraphSection(): any {
    return this._showGraphSection;
  }
  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showHowSection(value: any) {
    this._showHowSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showHowSection !== this.showHowSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showHowSection = this.showHowSection;
    }
  }
  public get showHowSection(): any {
    return this._showHowSection;
  }
  /**
   * show or hide the "Records" section.
   */
  @Input()
  public set showMatchesSection(value: any) {
    this._showMatchesSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showMatchesSection !== this._showMatchesSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showMatchesSection = this._showMatchesSection;
    }
  }
  public get showMatchesSection(): any {
    return this._showMatchesSection;
  }
    /**
   * show or hide the "Possible Matches" section.
   */
  @Input()
  public set showPossibleMatchesSection(value: any) {
    this._showPossibleMatchesSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showPossibleMatchesSection !== this._showPossibleMatchesSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showPossibleMatchesSection = this._showPossibleMatchesSection;
    }
  }
  public get showPossibleMatchesSection(): any {
    return this._showPossibleMatchesSection;
  }
    /**
   * show or hide the "Possible Relationships" section.
   */
  @Input()
  public set showPossibleRelationshipsSection(value: any) {
    this._showPossibleRelationshipsSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showPossibleRelationshipsSection !== this._showPossibleRelationshipsSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showPossibleRelationshipsSection = this._showPossibleRelationshipsSection;
    }
  }
  public get showPossibleRelationshipsSection(): any {
    return this._showPossibleRelationshipsSection;
  }
    /**
   * show or hide the "Disclosed Relationships" section.
   */
  @Input()
  public set showDisclosedSection(value: any) {
    this._showDisclosedSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showDisclosedSection !== this._showDisclosedSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showDisclosedSection = this._showDisclosedSection;
    }
  }
  public get showDisclosedSection(): any {
    return this._showDisclosedSection;
  }


  /** there is a use case where we don't want to show name data, like when it's already listing names in the headers */
  private _showBestNameOnlyInMatchesSection               = false;
  private _showBestNameOnlyInDisclosedSection             = this._showBestNameOnlyInMatchesSection;
  private _showBestNameOnlyInPossibleMatchesSection       = this._showBestNameOnlyInMatchesSection;
  private _showBestNameOnlyInPossibleRelationshipsSection = this._showBestNameOnlyInMatchesSection;
  private _showNameDataInMatchesSection                   = true;
  private _showNameDataInDisclosedSection                 = this._showNameDataInMatchesSection;
  private _showNameDataInPossibleMatchesSection           = this._showNameDataInMatchesSection;
  private _showNameDataInPossibleRelationshipsSection     = this._showNameDataInMatchesSection;
  private _showOtherDataInMatchesSection                  = false;
  private _showOtherDataInDisclosedSection                = this._showOtherDataInMatchesSection;
  private _showOtherDataInPossibleMatchesSection          = this._showOtherDataInMatchesSection;
  private _showOtherDataInPossibleRelationshipsSection    = this._showOtherDataInMatchesSection;

  @Input()
  public set showBestNameOnlyInMatchesSection(value: any)                 { this._showBestNameOnlyInMatchesSection = parseBool(value);}
  public get showBestNameOnlyInMatchesSection(): any                      { return this._showBestNameOnlyInMatchesSection; }
  @Input()
  public set showBestNameOnlyInDisclosedSection(value: any)               { this._showBestNameOnlyInDisclosedSection = parseBool(value);}
  public get showBestNameOnlyInDisclosedSection(): any                    { return this._showBestNameOnlyInDisclosedSection; }
  @Input()
  public set showBestNameOnlyInPossibleMatchesSection(value: any)         { this._showBestNameOnlyInPossibleMatchesSection = parseBool(value);}
  public get showBestNameOnlyInPossibleMatchesSection(): any              { return this._showBestNameOnlyInPossibleMatchesSection; }
  @Input()
  public set showBestNameOnlyInPossibleRelationshipsSection(value: any)   { this._showBestNameOnlyInPossibleRelationshipsSection = parseBool(value);}
  public get showBestNameOnlyInPossibleRelationshipsSection(): any        { return this._showBestNameOnlyInPossibleRelationshipsSection; }

  @Input()
  public set showNameDataInMatchesSection(value: any)                     { this._showNameDataInMatchesSection = parseBool(value);}
  public get showNameDataInMatchesSection(): any                          { return this._showNameDataInMatchesSection; }
  @Input()
  public set showNameDataInDisclosedSection(value: any)                   { this._showNameDataInDisclosedSection = parseBool(value);}
  public get showNameDataInDisclosedSection(): any                        { return this._showNameDataInDisclosedSection; }
  @Input()
  public set showNameDataInPossibleMatchesSection(value: any)             { this._showNameDataInPossibleMatchesSection = parseBool(value);}
  public get showNameDataInPossibleMatchesSection(): any                  { return this._showNameDataInPossibleMatchesSection; }
  @Input()
  public set showNameDataInPossibleRelationshipsSection(value: any)       { this._showNameDataInPossibleRelationshipsSection = parseBool(value);}
  public get showNameDataInPossibleRelationshipsSection(): any            { return this._showNameDataInPossibleRelationshipsSection; }

  @Input()
  public set showOtherDataInMatchesSection(value: any)                    { this._showOtherDataInMatchesSection = parseBool(value);}
  public get showOtherDataInMatchesSection(): any                         { return this._showOtherDataInMatchesSection; }
  @Input()
  public set showOtherDataInDisclosedSection(value: any)                  { this._showOtherDataInDisclosedSection = parseBool(value);}
  public get showOtherDataInDisclosedSection(): any                       { return this._showOtherDataInDisclosedSection; }
  @Input()
  public set showOtherDataInPossibleMatchesSection(value: any)            { this._showOtherDataInPossibleMatchesSection = parseBool(value);}
  public get showOtherDataInPossibleMatchesSection(): any                 { return this._showOtherDataInPossibleMatchesSection; }
  @Input()
  public set showOtherDataInPossibleRelationshipsSection(value: any)      { this._showOtherDataInPossibleRelationshipsSection = parseBool(value);}
  public get showOtherDataInPossibleRelationshipsSection(): any           { return this._showOtherDataInPossibleRelationshipsSection; }

  /**
   * collapse or expand the "At a Glance" section.
   */
  @Input()
  public set graphSectionCollapsed(value: any) {
    this._graphSectionCollapsed = parseBool(value);
  }
  public get graphSectionCollapsed(): any {
    return this._graphSectionCollapsed;
  }
    /**
   * show or hide the "Records" section.
   */
  @Input()
  public set recordsSectionCollapsed(value: any) {
    this._recordsSectionCollapsed = parseBool(value);
  }
  public get recordsSectionCollapsed(): any {
    return this._recordsSectionCollapsed;
  }
    /**
   * show or hide the "Possible Matches" section.
   */
  @Input()
  public set possibleMatchesSectionCollapsed(value: any) {
    this._possibleMatchesSectionCollapsed = parseBool(value);
  }
  public get possibleMatchesSectionCollapsed(): any {
    return this._possibleMatchesSectionCollapsed;
  }
    /**
   * show or hide the "Possible Relationships" section.
   */
  @Input()
  public set possibleRelationshipsSectionCollapsed(value: any) {
    this._possibleRelationshipsSectionCollapsed = parseBool(value);
  }
  public get possibleRelationshipsSectionCollapsed(): any {
    return this._possibleRelationshipsSectionCollapsed;
  }
    /**
   * show or hide the "Disclosed Relationships" section.
   */
  @Input()
  public set disclosedRelationshipsSectionCollapsed(value: any) {
    this._disclosedRelationshipsSectionCollapsed = parseBool(value);
  }
  public get disclosedRelationshipsSectionCollapsed(): any {
    return this._disclosedRelationshipsSectionCollapsed;
  }

  public _graphTitle: string = "Relationships at a Glance";
  /**
   * graph section title
   */
  @Input()
  public set graphTitle(value: string) {
    this._graphTitle = value;
  }
  /**
   * graph section title
   */
  public get graphTitle() {
    return this._graphTitle;
  }

  public _showGraphLinkLabels: boolean = true;
  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showGraphMatchKeys(value: any) {
    this._showGraphLinkLabels = parseBool(value);
  }
  /**
   * whether or not the graph component is displaying match keys
   */
  public get showGraphMatchKeys() {
    if(this.graphComponent && this.graphComponent.graphControlComponent && this.graphComponent.graphControlComponent.showLinkLabels) {
      return this.graphComponent.graphControlComponent.showLinkLabels;
    } else {
      return this._showGraphLinkLabels;
    }
  }


  /**
   * set the entity data by passing in an entity id number.
   */
  @Input()
  public set requestDataOnIdChange(value: any) {
    this._requestDataOnIdChange = parseBool(value);
  }

  /**
   * Gets the data in the model shape used by the relationship network graph.
   */
  public get graphData() {
    if(!this.entity || this.entity == null) {
      return undefined;
    }
    return {
      resolvedEntity: this.entity.resolvedEntity,
      relatedEntities: this.entity.relatedEntities
    };
  }

  /**
   * Get the entity Id of the current entity being displayed.
   */
  public get entityId(): number {
    return this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.entityId ? this.entity.resolvedEntity.entityId : this._entityId;
  }

  /**
   * A list of the search results that are matches.
   * @readonly
   */
  public get matches(): SzEntityRecord[] {
    return this.entity && this.entity.resolvedEntity.records ? this.entity.resolvedEntity.records : undefined;
  }
  /**
   * A list of the search results that are possible matches.
   *
   * @readonly
   */
  public get possibleMatches(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are related.
   *
   * @readonly
   */
  public get discoveredRelationships(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    }) : undefined;
  }
  /**
   * A list of the search results that are name only matches.
   *
   * @readonly
   */
  public get disclosedRelationships(): SzRelatedEntity[] {

    return this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    }) : undefined;
  }

  constructor(
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    private howUIService: SzHowUIService,
    private entityDataService: SzEntityDataService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    private searchService: SzSearchService,
    public viewContainerRef: ViewContainerRef,
  ) {}

  ngOnInit() {
    // show or hide sections based on pref change
    if(this._updatePrefsOnChange){
      // if were not saving prefs then do not initialize with values
      this.showHowSection     = this.prefs.entityDetail.showHowSection;
      this.showGraphSection   = this.prefs.entityDetail.showGraphSection;
      this.showMatchesSection = this.prefs.entityDetail.showMatchesSection;
      this.showPossibleMatchesSection       = this.prefs.entityDetail.showPossibleMatchesSection;
      this.showPossibleRelationshipsSection = this.prefs.entityDetail.showPossibleRelationshipsSection;
      this.showDisclosedSection             = this.prefs.entityDetail.showDisclosedSection;
    }
    // get and listen for prefs change
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => this._updatePrefsOnChange ),
    ).subscribe( this.onPrefsChange.bind(this) );
  }


  ngAfterViewInit() {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    // show or hide sections based on pref change
    this.showHowSection     = prefs.showHowSection;
    this.showGraphSection   = prefs.showGraphSection;
    this.showMatchesSection = prefs.showMatchesSection;
    this.showPossibleMatchesSection = prefs.showPossibleMatchesSection;
    this.showPossibleRelationshipsSection = prefs.showPossibleRelationshipsSection;
    this.showDisclosedSection = prefs.showDisclosedSection;

    // collapse or expand specific sections
    this.graphSectionCollapsed = prefs.graphSectionCollapsed;
    this.recordsSectionCollapsed = prefs.recordsSectionCollapsed;
    this.possibleMatchesSectionCollapsed = prefs.possibleMatchesSectionCollapsed;
    this.possibleRelationshipsSectionCollapsed = prefs.possibleRelationshipsSectionCollapsed;
    this.disclosedRelationshipsSectionCollapsed = prefs.disclosedRelationshipsSectionCollapsed;

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  /**
   * after entity data has been changed, regenerate the filtered lists.
   *  matches, possible matches, possible relationships, and disclosed relationships.
   */
  private onEntityDataChanged() {
    // doing the set on these manually because pulling directly from setter(s)
    // causes render change cycle to break mem and hammer redraw
    if(this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.records) this._matches = this.entity.resolvedEntity.records;
    if(this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter) this._possibleMatches = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    });
    if(this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter) this._discoveredRelationships = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    });
    if(this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter) this._disclosedRelationships = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    });
    // redraw graph on entity change
    if(this.graphComponent && this.graphComponent.reload) {
      this.graphComponent.reload(this.entityId);
    }
    this.dataChanged.next(this.entity);
  }

  /**
   * internal handler for when a entity record displayed inside of widget is
   * clicked on.
   */
  public onEntityRecordClick(entityId: number): void {
    this.entityId = entityId;
  }
  public onDataSourceRecordsSelected(records: SzDataSourceRecordsSelection) {
    console.log('onDataSourceRecordsSelected: ', records);
    this.dataSourceRecordsSelected.emit(records);
  }

  /**
   * proxies internal graph component entity click to "graphEntityClick" event.
   */
  public onGraphEntityClick(event: any) {
    this.graphEntityClick.emit(event);
  }
  /**
   * proxies internal graph component entity double click to "graphEntityDblClick" event.
   */
  public onGraphEntityDblClick(event: any) {
    this.graphEntityDblClick.emit(event);
  }
  /**
   * proxies internal graph component entity right-click to "graphContextMenuClick" event.
   */
  public onGraphRightClick(event: any) {
    if(this._showGraphNodeContextMenu) {
      this.openGraphContextMenu(event, this.graphNodeContextMenu);
    }
    this.graphContextMenuClick.emit(event);
  }
  /**
   * proxies internal graph component relationship link right-click to "graphRelationshipContextClick" event.
   */
  public onGraphRelationshipRightClick(event: any) {
    if(this._showGraphLinkContextMenu) {
      this.openGraphContextMenu(event, this.graphLinkContextMenu);
    }
    this.graphRelationshipContextMenuClick.emit(event);
  }
  /**
   * proxies internal graph component relationship link click to "graphRelationshipClick" event.
   */
  public onGraphRelationshipClick(event: any) {
    this.graphRelationshipClick.emit(event);
  }
  /**
   * proxies internal graph component pop-out click to "graphPopOutClick" event.
   */
  public onGraphPopoutClick(event: any) {
    this.graphPopOutClick.emit(event);
  }

  /**
   * proxies internal "how button" header click to "headerHowButtonClick" event.
   */
  public onHeaderHowButtonClick(event: howClickEvent){
    //console.log(`SzEntityDetailComponent.onHeaderHowButtonClick()`, event);
    if(this._showHowFunctionWarnings && !this._entityHasHowSteps){
      this.dialog.open(SzAlertMessageDialog, {
        panelClass: 'alert-dialog-panel',
        width: '350px',
        height: '200px',
        data: {
          title: 'Not Available',
          text: 'How not available. No resolution was required.',
          showOkButton: false,
          buttonText: 'Close'
        }
      });
    } else {
      // do pre-flight check
      this.checkIfEntityHasHowSteps(false).pipe(
        takeUntil(this.unsubscribe$),
        take(1)
      ).subscribe((hasResults) => {
        if(hasResults) {
          this.howButtonClick.emit(event);
        } else {
          this.howReportUnavailable.emit(true);
        }
      })
    }
  }
  /**
   * proxies internal "why button" header click to "onHeaderWhyButtonClick" event.
   */
  public onHeaderWhyButtonClick(entityId: SzEntityIdentifier){
    this.headerWhyButtonClick.emit(entityId);
    //console.log('SzEntityDetailComponent.onHeaderWhyButtonClick: ', entityId);
    let _data: any = {
      entityId: entityId
    }
    if(this.entity && this.entity.resolvedEntity && (this.entity.resolvedEntity.bestName || this.entity.resolvedEntity.entityName)) {
      _data.entityName = this.entity.resolvedEntity.bestName ? this.entity.resolvedEntity.bestName : this.entity.resolvedEntity.entityName;
    }
    if(this._openWhyComparisonModalOnClick){
      this.dialog.open(SzWhyEntityDialog, {
        panelClass: 'why-entity-dialog-panel',
        minWidth: 800,
        height: 'var(--sz-why-dialog-default-height)',
        data: _data
      });
    }
  }
  /**
   * proxies internal "reevaluate button" header click to "onHeaderReEvaluateButtonClick" event.
   */
  public onHeaderReEvaluateButtonClick(event: howClickEvent){
    let entityId: SzEntityIdentifier = event.entityId;
    this.headerReEvaluateButtonClick.emit(entityId);
    console.log('SzEntityDetailComponent.onHeaderReEvaluateButtonClick: ', entityId);
    this._reEvaluateButtonDisabled = true;
    // periodically check if how report available

    // trigger re-evaluation
    this.entityDataService.reevaluateEntity(entityId as number).pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    )
    .subscribe((res)=>{
      console.info('re-evaluating record..', res);
    });
  }

  public onCompareRecordsForWhy(records: SzRecordId[]) {
    //console.log('SzEntityDetailComponent.onCompareRecordsForWhy: ', records);
    this.recordsWhyButtonClick.emit(records);
    if(this._openWhyComparisonModalOnClick) {
      this.dialog.open(SzWhyEntityDialog, {
        panelClass: 'why-entity-dialog-panel',
        minWidth: 800,
        height: 'var(--sz-why-dialog-default-height)',
        data: {
          entityId: this.entity.resolvedEntity.entityId,
          showOkButton: false,
          okButtonText: 'Close',
          records: records
        }
      });
    }
  }

  public onCompareEntitiesForWhyNot(entityIds: any) {
    //console.log('SzEntityDetailComponent.onCompareEntitiesForWhyNot: ', entityIds, this._openWhyComparisonModalOnClick);
    if(entityIds && entityIds.length > 0 && entityIds.push){
      entityIds.push(this.entity.resolvedEntity.entityId);
    }

    this.relatedEntitiesWhyNotButtonClick.emit(entityIds);
    if(this._openWhyComparisonModalOnClick) {
      this.dialog.open(SzWhyEntitiesDialog, {
        panelClass: 'why-entities-dialog-panel',
        minWidth: 800,
        height: 'var(--sz-why-dialog-default-height)',
        data: {
          entities: entityIds,
          showOkButton: false,
          okButtonText: 'Close'
        }
      });
    }
  }

  public onSectionCollapsedChange(prefsKey: string, isCollapsed: boolean) {
    // console.log('SzEntityDetailComponent.onSectionCollapsedChange: ', prefsKey, isCollapsed);
    if( prefsKey && this.prefs.entityDetail) {
      this.prefs.entityDetail[prefsKey] = isCollapsed;
    }
    /*
    private _graphSectionCollapsed: boolean = true;
    private _recordsSectionCollapsed: boolean = false;
    private _possibleMatchesSectionCollapsed: boolean = false;
    private _possibleRelationshipsSectionCollapsed: boolean = false;
    private _disclosedRelationshipsSectionCollapsed: boolean = false;
    */
  }

  /**
   * when entityId property is changed, request the data from the api
   * and display the result.
   *
   * @memberof SzEntityDetailComponent
   */
  public onEntityIdChange() {
    this.entityIdChanged.emit(this._entityId);

    if (this._entityId) {
      this.requestStart.emit(this._entityId);

      this.searchService.getEntityById(this._entityId, true).
      pipe(
        tap(res => console.log('SzSearchService.getEntityById: ' + this._entityId, res)),
        takeUntil(this.unsubscribe$),
        take(1)
      ).
      subscribe({
        next: (entityData: SzEntityData) => {
          // console.log('sz-entity-detail.onEntityIdChange: ', entityData);
          this.entityDetailJSON = JSON.stringify(entityData, null, 4);
          this.entity = entityData;
          this.onEntityDataChanged();
          this.requestEnd.emit( entityData );
          this.dataChanged.next( entityData );
          if(this._showEntityHowFunction && (this._dynamicHowFeatures === true ||
            this._showHowFunctionWarnings === true)) {
            // check to see if entity has how steps, if not disable how functions
            this.checkIfEntityHasHowSteps();
          }
        },
        error: (err)=> {
          this.requestEnd.emit( err );
          this.exception.next( err );
        }
      });
    }
  }

  /** @internal */
  private _graphContextMenuSub: Subscription;
  /**
   * shows a graph context menu when triggered by an appropriate event
   * @internal
   */
  private openGraphContextMenu(event: any, contextMenu: TemplateRef<any>) {
    console.log('SzEntityDetailComponent.openGraphContextMenu: ', event);
    this.closeGraphContextMenu();
    let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    const positionStrategy = this.overlay.position().global();
    positionStrategy.top(Math.ceil(event.eventPageY - scrollY)+'px');
    positionStrategy.left(Math.ceil(event.eventPageX)+'px');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(contextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    this._graphContextMenuSub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(evt => {
          const clickTarget = evt.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.closeGraphContextMenu());

    return false;
  }
  /**
   * closes any active graph context menu
   * @internal
   */
  private closeGraphContextMenu() {
    if (this._graphContextMenuSub){
      this._graphContextMenuSub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  /** can a specific entity node be removed from canvas */
  public isGraphEntityRemovable(entityId: SzEntityIdentifier): boolean {
    return this.graphComponent.canRemoveNode(entityId);
  }
  /** show any entities that are related to a specific entity that are
   * currently not on the canvas
   */
  public showGraphEntityRelationships(entityId: SzEntityIdentifier) {
    this.graphComponent.expandNode(entityId);
  }
  /** hide all visible(expanded) entities related to a specific entity
   * that are themselves not related to any other visible entities
   */
  public hideGraphEntityRelationships(entityId: SzEntityIdentifier) {
    this.graphComponent.collapseNode(entityId);
  }
  /** remove single node and any directly related nodes that are only related to the entity specified */
  public hideGraphEntity(entityId: SzEntityIdentifier) {
    this.graphComponent.removeNode(entityId);
  }
  /** the built-in graph link context menu has an option to show
   * a "Why Not" report modal on select.
   * @internal
   */
  public openWhyReportForGraphRelationship(event: any) {
    if(event && event.sourceEntityId && event.targetEntityId) {
      this.closeGraphContextMenu();
      this.dialog.open(SzWhyEntitiesDialog, {
        panelClass: 'why-entities-dialog-panel',
        minWidth: 800,
        height: 'var(--sz-why-dialog-default-height)',
        data: {
          entities: [event.sourceEntityId, event.targetEntityId],
          showOkButton: false,
          okButtonText: 'Close'
        }
      });
    }
  }
  /**
   * when a entity id has been changed and the "" flag is set to true we run a
   * pre-click check to make sure that the how button returns a valid report.
   * @internal
  */
  private checkIfEntityHasHowSteps(emitEvents?: boolean) {
    let _retObs = new Subject<[boolean, boolean]>();
    let retObs  = _retObs.asObservable();
    retObs.pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    ).subscribe((results) => {
      this._entityHasHowSteps       = results[0];
      this._entityNeedsReEvaluation = results[1];
      if(emitEvents !== false) {
        this.howReportUnavailable.emit(!results[0]);
      }
      if(this._dynamicHowFeatures) {
        this._howFunctionDisabled         = (this._dynamicHowFeatures && !results[0]);
        this._entityRequiresReEvaluation  = (this._dynamicHowFeatures && results[1]);
      }
    })
    if(this._entityId){
      // check to see if entity has how steps, if not disable how functions
      this.howUIService.getHowDataForEntity(this._entityId).pipe(
        takeUntil(this.unsubscribe$),
        take(1)
      ).subscribe({
        next: (resp)=>{
          let hasSteps = (resp && resp.data && resp.data.resolutionSteps && Object.keys(resp.data.resolutionSteps).length > 0);
          let numberOfFinalStates = resp && resp.data && resp.data.finalStates && resp.data.finalStates.length ? resp.data.finalStates.length : 0
          let isSingleton = (numberOfFinalStates === 1 && resp && resp.data && resp.data.finalStates && resp.data.finalStates[0]) ? resp.data.finalStates[0].singleton: false;

          if(isSingleton) {
            // entity only has one record,
            // don't show re-eval
            _retObs.next([false, false]);
          } else if (!hasSteps || numberOfFinalStates > 1){
            // no resolution steps and more than one final state
            // needs re-evaluation
            _retObs.next([false, true]);
            //console.warn(`needs re-evaluation`);
          } else if(hasSteps && numberOfFinalStates < 1) {
            // has resolution steps but no final states???
            // disable the button
            _retObs.next([hasSteps, true]);
          } else {
            // resolution was normal
            _retObs.next([hasSteps, false]);
          }
        },
        error: (err) => {
          console.warn(`checkIfEntityHasHowSteps: ERROR!`, err);
          this.exception.next( err );
          _retObs.next([false, false]);
        }
      });
    } else {
      setTimeout(() => {
        _retObs.next([false, false]);
      }, 1000);
    }
    return _retObs.asObservable();
  }

}
