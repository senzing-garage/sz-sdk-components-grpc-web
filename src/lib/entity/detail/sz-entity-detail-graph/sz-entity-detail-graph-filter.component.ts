import { Component, ChangeDetectorRef, ViewContainerRef } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzDataSourcesService } from '../../../services/sz-datasources.service';
import { SzGraphFilterComponent } from '../../../graph/sz-graph-filter.component';
import { Overlay } from '@angular/cdk/overlay';

/**
 * Control Component allowing UI friendly changes
 * to filtering, colors, and parameters of graph control.
 *
 * integrated with graph preferences and prefBUS.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-entity-detail-graph-filter #graphFilter
      [showLinkLabels]="true"
      (optionChanged)="onOptionChange($event)"
      ></sz-entity-detail-graph-filter>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-standalone-graph-filters id="sz-entity-detail-graph-filter"></sz-wc-standalone-graph-filters>
 * <script>
 * document.getElementById('sz-wc-standalone-graph-filters').addEventListener('optionChanged', function(data) { console.log('filter(s) changed', data); });
 * </script>
 */
@Component({
    selector: 'sz-entity-detail-graph-filter',
    templateUrl: '../../../graph/sz-graph-filter.component.html',
    styleUrls: ['../../../graph/sz-graph-filter.component.scss'],
    standalone: false
})
export class SzEntityDetailGraphFilterComponent extends SzGraphFilterComponent {
  constructor(
    _p_prefs: SzPrefsService,
    _p_dataSourcesService: SzDataSourcesService,
    _p_formBuilder: UntypedFormBuilder,
    _p_cd: ChangeDetectorRef,
    _p_overlay: Overlay,
    _p_viewContainerRef: ViewContainerRef,
  ) {
    super(
      _p_prefs, 
      _p_dataSourcesService, 
      _p_formBuilder, 
      _p_cd,
      _p_overlay,
      _p_viewContainerRef
    );
  }
}
