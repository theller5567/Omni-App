import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { GprobeUiService } from '../../services/gprobe-ui/gprobe-ui.service';
import { DataService } from '../../services/data/data.service';
import * as _ from 'underscore';

@Component({
  selector: 'gpInputDiameter',
  template: `
    <form *ngIf="this.show">
      <div class="form-group">
        <label for="Master-Products">Select Diameter</label>
        <select [ngModel]="selectedDiameter" name="diameter" (ngModelChange)="change($event)" class="form-control" id="Master-Products">
          <option *ngFor="let diameter of diameterArray" [ngValue]="diameter">{{diameter}}</option>
        </select>
        <p *ngIf="prRange !== '' && showFilters" class="pr-range"><em><strong>Processing Range: {{prRange}}</strong></em></p>
      </div>
    </form>
    <productView [testing]="testing" [diameterProduct]="diameterProduct" [selectedValue]="selectedValue"  #productView></productView>
  `,
  styleUrls: ['./gp-input-diameter.component.scss']
})
export class GpInputDiameterComponent implements OnInit {
  @Output() hasChangedagain: EventEmitter<any> = new EventEmitter();
  selectedDiameter: string;
  diameterArray: any[] = [];
  show: boolean = false;
  prRange: string = '';
  showFilters: boolean;
  diameterProduct: any;
  @Input() selectedValue;
  @Input() testing;
  constructor(private _service: GprobeUiService, private data: DataService) { }

  toggleView() {
      const bln: boolean = this.show ? true : false;
      return bln;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      if (changes['selectedValue']) {
        this.selectedValue = changes.selectedValue.currentValue;
        this.diameterArray = ['Select a Diameter'];
        this.selectedDiameter = this.diameterArray[0];
        console.log('selectedValue: ', this.selectedDiameter);
        if (this.selectedValue) {
          this.diameterArray = [];
          this.testing.forEach(item => {
            if (item.master === this.selectedValue) {
              item.related.forEach(product => {
                this.diameterArray.push(product.diameter);
              });
            }
          });
          this.diameterArray.pop();
          this.diameterArray = _.uniq(this.diameterArray);
          console.log('selectedValue@: ', this.selectedDiameter);
          this.show = true;
        }
      }
      if (changes['testing']) {
        this.testing = changes.testing.currentValue;
      }
    }
  }

  ngOnInit() {
    this.data.showfilter.subscribe(value => this.showFilters = value);
  }

  change(value) {
    this.processingRange(value);
    if (this.selectedValue) {
      const obj = {
        selectedProduct: this.selectedValue,
        diameterSelected: value
      };
      this.diameterProduct = obj;
      this.data.hideFilter(true);
    }
  }

  processingRange(value) {
    switch (value) {
      case '5 mm':
          this.prRange =  '0.2mL - 5mL';
          break;
      case '7 mm':
           this.prRange =  '0.25mL - 30mL';
          break;
      case '10 mm':
          this.prRange =  '1.5mL - 100mL';
          break;
      case '20 mm':
           this.prRange =  '50mL - 2L';
          break;
      case '30 mm':
           this.prRange =  '75mL - 10L';
          break;
      case 'none':
          this.prRange = '';
          break;
      default:
    }
  }

  sortDiamters(list) {
    let numArr = [];
    numArr = list.map(function (item, index, array) {
         item = parseInt(item.split(' mm')[0], 10);
         return item;
    });
    numArr =  _.sortBy(numArr, function(num){ return Math.min(num); });
    numArr = numArr.map(function (item, index, array) {
         return item + ' mm';
    });
    return numArr;
  }
}
