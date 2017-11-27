import { Component, Input, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { DataService } from '../../services/data/data.service';
import * as _ from 'underscore';

@Component({
  selector: 'gpInputDiameter',
  template: `
    <form *ngIf="this.show">
      <div class="form-group">
        <label for="Master-Products">Select Diameter</label>
        <select [(ngModel)]="selectedDiameter" name="diameter" (ngModelChange)="change($event)" class="form-control" id="Master-Products">
          <option disabled selected>Select a Diameter</option>
          <option *ngFor="let diameter of diameterArray" [ngValue]="diameter">{{diameter}}</option>
        </select>
        <p *ngIf="prRange !== ''" class="pr-range"><em><strong>Processing Range: {{prRange}}</strong></em></p>
      </div>
    </form>
    <productView [masterProductList]="masterProductList"></productView>
  `,
  styleUrls: ['./gp-input-diameter.component.scss']
})
export class GpInputDiameterComponent implements OnInit, OnChanges {
  selectedDiameter: string;
  diameterArray: any[] = [];
  show: boolean;
  prRange: string;
  selectedValue;
  @Input() masterProductList;

  constructor(private data: DataService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      if (changes['masterProductList']) {
        this.masterProductList = [];
        this.diameterArray = [];
        this.masterProductList = changes.masterProductList.currentValue;
      }
    }
  }

  ngOnInit() {
    this.data.selectedProduct.subscribe(product => {
      this.selectedValue = product;
      this.data.hideFilter(false);
      this.processingRange('');
      this.diameterArray = [];
      this.selectedDiameter = 'Select a Diameter';
      if (this.masterProductList !== undefined) {
        this.masterProductList.forEach(item => {
          if (item.master === this.selectedValue) {
            item.related.forEach(prod => {
              this.diameterArray.push(prod.diameter);
            });
          }
        });
        this.diameterArray = _.uniq(this.diameterArray);
        this.show = true;
      }
    });
  }

  change(value) {
    if (value !== 'Select a Diameter') {
      this.data.filterStateChanged(true);
      this.processingRange(value);
      this.data.diameterChanged(value);
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
        this.prRange = '';
    }
  }

}
