import { NgModule, Injector, ModuleWithProviders, SkipSelf, Optional, Provider, InjectionToken } from '@angular/core';
/* import { BrowserModule } from '@angular/platform-browser'; */
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, Location, LocationStrategy, PathLocationStrategy, TitleCasePipe } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import {
  ApiModule,
  Configuration as SzRestConfiguration,
  ConfigurationParameters as SzRestConfigurationParameters
} from '@senzing/rest-api-client-ng';
import { SzSdkMaterialModule } from './sdk.material.module';

/** services */
import { SzMessageBundleService } from './services/sz-message-bundle.service';
import { SzSearchService } from './services/sz-search.service';
import { SzConfigurationService } from './services/sz-configuration.service';
import { SzDataMartService } from './services/sz-datamart.service';
import { SzFoliosService } from './services/sz-folios.service';
import { SzUIEventService } from './services/sz-ui.service';
import { SzPrefsService } from './services/sz-prefs.service';
import { SzDataSourcesService } from './services/sz-datasources.service';
import { SzAdminService } from './services/sz-admin.service';
import { SzBulkDataService } from './services/sz-bulk-data.service';
import { SzCSSClassService } from './services/sz-css-class.service';
import { SzConfigDataService } from './services/sz-config-data.service';
import { SzElementResizeService } from './services/sz-element-resize-listener.service';
/** pipes */
import { SzShortNumberPipe } from './pipes/shortnumber.pipe'
import { SzDecimalPercentPipe } from './pipes/decimalpercent.pipe';
import { SzOrderedMapEntries } from './pipes/mapentries.pipe';
/** directives */
import { SzElementResizeObserverDirective } from './directives/sz-element-resize-observer.directive';
import { SzTooltipComponent } from './directives/sz-tooltip.component';
import { SzTooltipDirective } from './directives/sz-tooltip.directive';
/** common */
import { SzDataTable } from './shared/data-table/sz-data-table.component';
/** charts */
import { SzRecordStatsDonutChart } from './charts/records-by-datasources/sz-donut.component';
import { SzVennDiagramsComponent } from './charts/versus/sz-venn-diagram.component';
/** statistics */
import { SzCrossSourcePagingComponent } from './statistics/cross-source/sz-cross-source-results.pager';
import { SzCrossSourceResultsDataTable } from './statistics/cross-source/sz-cross-source-results.data-table'
import { SzCrossSourceStatistics } from './statistics/cross-source/sz-cross-source-statistics.component';
import { SzCrossSourceSummaryComponent } from './summary/cross-source/sz-cross-source-summary.component';
import { SzCrossSourceSummaryMatchKeyPickerDialog } from './summary/cross-source/sz-cross-source-matchkey-picker.component';

/** components */
import { SzAlertMessageDialog } from './shared/alert-dialog/sz-alert-dialog.component';
import { SzConfigurationAboutComponent } from './configuration/sz-configuration-about/sz-configuration-about.component';
import { SzConfigurationComponent } from './configuration/sz-configuration/sz-configuration.component';
import { SzCrossSourceSelectComponent } from './statistics/cross-source/sz-cross-source-select.component';
import { SzLicenseInfoComponent } from './configuration/sz-license/sz-license.component';
import { SzMultiSelectButtonComponent } from './shared/multi-select-button/multi-select-button.component';
import { SzPoweredByComponent } from './sz-powered-by/sz-powered-by.component';
import { SzPreferencesComponent } from './configuration/sz-preferences/sz-preferences.component';
import { SzPrefDictComponent } from './configuration/sz-preferences/sz-pref-dict/sz-pref-dict.component';
/** entity resume related */
import { SzEntityDetailComponent } from './entity/detail/sz-entity-detail.component';
import { SzEntityDetailHeaderComponent } from './entity/detail/sz-entity-detail-header/header.component';
import { SzEntityDetailSectionSummaryComponent } from './entity/detail/sz-entity-detail-header/summary.component';
import { SzEntityDetailHeaderContentComponent } from './entity/detail/sz-entity-detail-header/content.component';
import { SzEntityDetailsSectionComponent } from './entity/detail/sz-entity-details-section/sz-entity-details-section.component';
import { SzEntityDetailSectionHeaderComponent } from './entity/detail/sz-entity-details-section/header.component';
import { SzEntityDetailSectionCollapsibleCardComponent } from './entity/detail/sz-entity-details-section/collapsible-card.component';
import { SzEntityDetailGraphComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph.component';
import { SzEntityDetailHowReportComponent } from './entity/detail/sz-entity-detail-how-report/sz-entity-detail-how-report.component';
import { SzEntityMatchPillComponent } from './entity/sz-entity-match-pill/sz-entity-match-pill.component';
import { SzEntityRecordCardComponent } from './entity/sz-entity-record-card/sz-entity-record-card.component';
import { SzEntityRecordCardHeaderComponent } from './entity/sz-entity-record-card/sz-entity-record-card-header/sz-entity-record-card-header.component';
import { SzEntityRecordCardContentComponent } from './entity/sz-entity-record-card/sz-entity-record-card-content/sz-entity-record-card-content.component';
// graph components
import { SzRelationshipNetworkComponent } from './graph/sz-relationship-network/sz-relationship-network.component';
import { SzRelationshipNetworkInputComponent } from './graph/sz-relationship-network-input/sz-relationship-network-input.component';
import { SzRelationshipNetworkLookupComponent } from './graph/sz-relationship-network-lookup/sz-relationship-network-lookup.component';
import { SzRelationshipPathComponent } from './graph/sz-relationship-path/sz-relationship-path.component';
import { SzEntityDetailGraphControlComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-control.component';
import { SzEntityDetailGraphFilterComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-filter.component';
import { SzGraphControlComponent } from './graph/sz-graph-control.component';
import { SzStandaloneGraphComponent } from './entity/detail/sz-entity-detail-graph/sz-standalone-graph.component';
import { SzGraphFilterComponent } from './graph/sz-graph-filter.component';
import { SzGraphComponent } from './graph/sz-graph.component';
// search related
import { SzSearchComponent } from './search/sz-search/sz-search.component';
import { SzSearchIdentifiersPickerDialogComponent, SzSearchIdentifiersPickerSheetComponent } from './search/sz-search/sz-search-identifiers-picker.component';
import { SzSearchByIdComponent } from './search/sz-search/sz-search-by-id.component';
import { SzEntityRecordViewerComponent } from './record/sz-entity-record-viewer.component';
import { SzSearchResultsComponent } from './search/sz-search-results/sz-search-results.component';
import { SzSearchResultCardComponent } from './search/sz-search-result-card/sz-search-result-card.component';
import { SzSearchResultCardContentComponent } from './search/sz-search-result-card/sz-search-result-card-content/sz-search-result-card-content.component';
import { SzSearchResultCardHeaderComponent } from './search/sz-search-result-card/sz-search-result-card-header/sz-search-result-card-header.component';
// why related
import { SzWhyEntityComponent } from './why/sz-why-entity.component';
import { SzWhyEntitiesComparisonComponent } from './why/sz-why-entities.component';
import { SzWhyEntityDialog } from './why/sz-why-entity.component';
import { SzWhyEntitiesDialog } from './why/sz-why-entities.component';
import { SzWhyReportBaseComponent } from './why/sz-why-report-base.component';
// how related
import { SzHowEntityComponent } from './how/sz-how-entity.component';
import { SzHowFinalEntityCardComponent } from './how/cards/sz-how-final-entity-card.component';
import { SzHowNavComponent } from './how/sz-how-nav.component';
import { SzHowStepCardComponent } from './how/cards/sz-how-step-card.component';
import { SzHowSingletonCardComponent } from './how/cards/sz-how-singleton-card.component';
import { SzHowStepStackComponent } from './how/sz-how-step-stack.component';
import { SzHowUIService } from './services/sz-how-ui.service';
import { SzHowVirtualEntityCardComponent } from './how/cards/sz-how-virtual-entity-card.component';
import { SzHowVirtualEntityDialog } from './how/sz-how-virtual-entity-dialog.component';
import { SzHowStepNodeComponent } from './how/sz-how-step-node.component';

/**
 * Sets up a default set of service parameters for use
 * by the SDK Components.
 *
 * this is only used when no configuration parameters are set
 * via the forRoot static method.
 * @internal
 */
export function SzDefaultRestConfigurationFactory(): SzRestConfiguration {
  return new SzRestConfiguration({
    basePath: 'http://localhost:8080',
    withCredentials: true
  });
}
/**
 * Injection Token for the rest configuration class
 * @internal
 */
const SzRestConfigurationInjector = new InjectionToken<SzRestConfiguration>("SzRestConfiguration");

/**
 * Senzing SDK Components Module.
 * Add to your applications module imports array.
 */
@NgModule({ declarations: [
        SzAlertMessageDialog,
        SzConfigurationAboutComponent,
        SzConfigurationComponent,
        SzDataTable,
        SzCrossSourcePagingComponent,
        SzCrossSourceResultsDataTable,
        SzCrossSourceSelectComponent,
        SzCrossSourceStatistics,
        SzCrossSourceSummaryComponent,
        SzCrossSourceSummaryMatchKeyPickerDialog,
        SzDecimalPercentPipe,
        SzEntityDetailComponent,
        SzEntityDetailGraphControlComponent,
        SzEntityDetailGraphComponent,
        SzEntityDetailGraphFilterComponent,
        SzEntityDetailHeaderComponent,
        SzEntityDetailHeaderContentComponent,
        SzEntityDetailHowReportComponent,
        SzEntityDetailSectionSummaryComponent,
        SzEntityDetailSectionHeaderComponent,
        SzEntityDetailSectionCollapsibleCardComponent,
        SzEntityDetailsSectionComponent,
        SzEntityMatchPillComponent,
        SzEntityRecordCardComponent,
        SzEntityRecordViewerComponent,
        SzEntityRecordCardHeaderComponent,
        SzEntityRecordCardContentComponent,
        SzGraphControlComponent,
        SzGraphComponent,
        SzGraphFilterComponent,
        SzHowEntityComponent,
        SzHowFinalEntityCardComponent,
        SzHowNavComponent,
        SzHowSingletonCardComponent,
        SzHowStepCardComponent,
        SzHowStepNodeComponent,
        SzHowStepStackComponent,
        SzHowVirtualEntityCardComponent,
        SzHowVirtualEntityDialog,
        SzLicenseInfoComponent,
        SzOrderedMapEntries,
        SzMultiSelectButtonComponent,
        SzPoweredByComponent,
        SzPreferencesComponent,
        SzPrefDictComponent,
        SzRecordStatsDonutChart,
        SzRelationshipNetworkComponent,
        SzRelationshipNetworkInputComponent,
        SzRelationshipNetworkLookupComponent,
        SzRelationshipPathComponent,
        SzElementResizeObserverDirective,
        SzSearchComponent,
        SzSearchByIdComponent,
        SzSearchIdentifiersPickerDialogComponent,
        SzSearchIdentifiersPickerSheetComponent,
        SzSearchResultsComponent,
        SzSearchResultCardComponent,
        SzSearchResultCardContentComponent,
        SzSearchResultCardHeaderComponent,
        SzShortNumberPipe,
        SzStandaloneGraphComponent,
        SzTooltipComponent,
        SzTooltipDirective,
        SzVennDiagramsComponent,
        SzWhyEntitiesComparisonComponent,
        SzWhyEntityComponent,
        SzWhyEntitiesDialog,
        SzWhyEntityDialog,
        SzWhyReportBaseComponent
    ],
    exports: [
        SzAlertMessageDialog,
        SzConfigurationComponent,
        SzConfigurationAboutComponent,
        SzDataTable,
        SzCrossSourceResultsDataTable,
        SzCrossSourceSelectComponent,
        SzCrossSourceStatistics,
        SzCrossSourceSummaryComponent,
        SzDecimalPercentPipe,
        SzEntityDetailGraphComponent,
        SzEntityDetailComponent,
        SzEntityDetailHowReportComponent,
        SzEntityDetailGraphControlComponent,
        SzEntityDetailGraphFilterComponent,
        SzEntityRecordViewerComponent,
        SzGraphComponent,
        SzGraphControlComponent,
        SzGraphFilterComponent,
        SzHowEntityComponent,
        SzHowNavComponent,
        SzHowSingletonCardComponent,
        SzHowStepNodeComponent,
        SzHowStepStackComponent,
        SzHowVirtualEntityCardComponent,
        SzHowVirtualEntityDialog,
        SzLicenseInfoComponent,
        SzOrderedMapEntries,
        SzPoweredByComponent,
        SzPreferencesComponent,
        SzRecordStatsDonutChart,
        SzRelationshipNetworkComponent,
        SzRelationshipNetworkInputComponent,
        SzRelationshipNetworkLookupComponent,
        SzRelationshipPathComponent,
        SzShortNumberPipe,
        SzSearchComponent,
        SzSearchByIdComponent,
        SzSearchResultsComponent,
        SzSearchResultCardComponent,
        SzStandaloneGraphComponent,
        SzVennDiagramsComponent,
        SzWhyEntitiesComparisonComponent,
        SzWhyEntityComponent,
        SzWhyEntitiesDialog,
        SzWhyEntityDialog,
        SzPreferencesComponent
    ], imports: [CommonModule,
        DragDropModule,
        FormsModule,
        ReactiveFormsModule,
        LayoutModule,
        NgxJsonViewerModule,
        ApiModule,
        SzSdkMaterialModule], providers: [
        SzMessageBundleService,
        SzAdminService,
        SzBulkDataService,
        SzConfigDataService,
        SzConfigurationService,
        SzCSSClassService,
        SzDataMartService,
        SzDataSourcesService,
        SzFoliosService,
        SzHowUIService,
        SzPrefsService,
        SzElementResizeService,
        SzSearchService,
        HttpClient,
        TitleCasePipe,
        SzUIEventService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class SenzingSdkModule {
  /**
   * initialize the SenzingSdkModule with an optional factory method that returns a {@link https://senzing.github.io/rest-api-client-ng/classes/Configuration.html|SzRestConfiguration} instance.
   * @see {@link https://senzing.github.io/rest-api-client-ng/classes/Configuration.html|SzRestConfiguration}
   * @example
   export function SzRestConfigurationFactory() {
      return new SzRestConfiguration({ basePath: \"myapiserverhostname.com:8080\", withCredentials: true });
   }

   SenzingSdkModule.forRoot( SzRestConfigurationFactory )
   *
   */
  public static forRoot(apiConfigFactory?: () => SzRestConfiguration): ModuleWithProviders<SenzingSdkModule> {
    return {
        ngModule: SenzingSdkModule,
        providers: [
          {
            provide: SzRestConfiguration,
            useFactory: apiConfigFactory ? apiConfigFactory : SzDefaultRestConfigurationFactory
          },
          {provide: LocationStrategy, useClass: PathLocationStrategy}
        ]
    };
  }
}
