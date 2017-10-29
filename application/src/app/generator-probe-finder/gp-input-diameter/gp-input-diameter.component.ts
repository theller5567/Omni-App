import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { GprobeUiService } from "../../services/gprobe-ui/gprobe-ui.service";
import { DataService } from '../../services/data/data.service';
import * as _ from 'underscore';

@Component({
  selector: 'gpInputDiameter',
  template: `
    <form *ngIf="this.show">
      <div class="form-group">
        <label for="Master-Products">Select Diameter</label>
        <select [ngModel]="selectedDiameter" name="diameter" (ngModelChange)="change($event)" class="form-control" id="Master-Products">
          <option *ngFor="let diameter of DiameterCats" [ngValue]="diameter">{{diameter}}</option>
        </select>
        <p *ngIf="prRange !== '' && showFilters" class="pr-range"><em><strong>Processing Range: {{prRange}}</strong></em></p>
      </div>
    </form>
  `,
  styleUrls: ['./gp-input-diameter.component.scss']
})
export class GpInputDiameterComponent implements OnInit {
  @Output() hasChangedagain: EventEmitter<any> = new EventEmitter();
  DiameterCats: string[];
  selectedDiameter: string;
  show: boolean = false;
  prRange:string = '';
  showFilters: boolean;

  constructor(private _service:GprobeUiService, private data:DataService){}

  toggleView(){
      let bln: boolean = this.show ? true : false;
      return bln;
  }

  ngOnInit(){
    this.data.showfilter.subscribe(value => this.showFilters = value);
  }

  hasChanged(val) {
    console.log('why hello');
    
    this.DiameterCats = [];
    this.selectedDiameter = this.DiameterCats[0];
    let name:string = val;
    this.getProductsByName(name);
    
  }

  change(value) {
    console.log('Value: ',value);
    this.processingRange(value);
    this.hasChangedagain.emit(value);
    this.data.hideFilter(true);
  }

  processingRange(value){
    console.log('SWITCH VALUE: ',value);
    switch(value) {
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

  
  getProductsByName(name:string){
    this._service.getProductsByName(name)
      .subscribe(response => {
        this.DiameterCats = response;
        this.selectedDiameter = '';
        this.DiameterCats = this.sortDiamters(this.DiameterCats);
        this.show = true;
      });
  }

  sortDiamters(list){
    let numArr = [];
    numArr = list.map(function (item, index, array) {
         item = parseInt(item.split(" mm")[0]);
         return item;
    });
    numArr =  _.sortBy(numArr, function(num){ return Math.min(num); });
    numArr = numArr.map(function (item, index, array) {
         return item + ' mm';
    });
    return numArr;
  }
  
}
