import { Component, Input, OnDestroy, HostBinding } from '@angular/core';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzResolutionStepDisplayType, SzResolutionStepListItemType, SzResolutionStepNode, SzResolvedVirtualEntity} from '../models/data-how';
import { Subject } from 'rxjs';
import { SzHowUIService } from '../services/sz-how-ui.service';

/**
 * How Step Stack (multiple steps represented as a collapsible group)
 * 
 * @internal
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-how-step-stack></sz-how-step-stack>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-how-step-stack></sz-wc-how-step-stack>
*/
@Component({
    selector: 'sz-how-step-stack',
    templateUrl: './sz-how-step-stack.component.html',
    styleUrls: ['./sz-how-step-stack.component.scss'],
    standalone: false
})
export class SzHowStepStackComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _stepMap: {[key: string]: SzResolutionStep};
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean           = false;
    private _collapsed: boolean             = true;
    private _childrenCollapsed: boolean     = false;
    private _data: SzResolutionStepNode;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-collapsed') get cssHiddenGroupClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-expanded') get cssExpandedGroupClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }
    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() set data(value: SzResolutionStepNode) {
        this._data = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
        }
        this._virtualEntitiesById = value;
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }

    public get id(): string {
        return this._data && this._data.id ? this._data.id : undefined;
    }

    public get data(): SzResolutionStepNode {
        return this._data;
    }
    get itemType(): SzResolutionStepListItemType {
        return (this._data as SzResolutionStepNode).itemType ? (this._data as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
    }

    public get isGroupCollapsed() {
        return !this.howUIService.isGroupExpanded(this.id);
    }

    public toggleExpansion(vId?: string) {
        //this.onExpand.next(!this._collapsed);
        vId = vId ? vId : this.id;
        this.howUIService.toggleExpansion(vId, undefined, this.itemType);
    }
    public toggleGroupExpansion(gId?: string) {
        gId = gId ? gId : this.id;
        this.howUIService.toggleExpansion(undefined, gId, this.itemType);
    }

    get numberOfCards(): number {
        let retVal = 0;
        if(this._data && this._data.virtualEntityIds && this._data.virtualEntityIds.length) {
            retVal = this._data.virtualEntityIds.length;
        }
        return retVal;
    }

    getCardTitleForStep(title: string, cardIndex: number) {
        return cardIndex === 0 ? title : undefined;
    }

    get title(): string {
        let retVal = 'Steps';
        if(this._data) {
            let _retTypes = new Map<SzResolutionStepDisplayType, number>();
            this._data.children.forEach((step: SzResolutionStep) => {
                let _retType = SzHowUIService.getResolutionStepCardType(step);
                if(_retTypes.has(_retType)){
                    _retTypes.set(_retType, (_retTypes.get(_retType) + 1));
                } else {
                    _retTypes.set(_retType, 1);
                }
            });
            if(_retTypes.size > 0) {
                retVal = '';
                //console.log('_retTypes: ', _retTypes);

                _retTypes.forEach((typeCount, retType) => {
                    //console.log(`\t\t${retType}`, typeCount);
                    if(retType === SzResolutionStepDisplayType.ADD) {
                        retVal += `${typeCount} x Add Record to Virtual Entity\n\r`;
                    }
                });
            }
        }
        return retVal;
    }

    public siblingsOf(step: SzResolutionStep) {
        return this._data.children.filter((n) => {
            return n !== step;
        })
    }

    getStepTitle(step: SzResolutionStep): string {
        let retVal = '';
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            retVal = 'Create Virtual Entity';
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return retVal;
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private howUIService: SzHowUIService
    ){}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}