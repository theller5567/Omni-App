import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GprobeUiService } from "../../services/gprobe-ui/gprobe-ui.service";
import { DataService } from './../../services/data/data.service';

@Component({
  selector: 'gpInput',
  template: `
    <form>
      <div class="form-group">
        <label for="Master-Products">Select Product</label>
        <select [ngModel]="selectedValue" name="product" (ngModelChange)="change($event)" class="form-control" id="Master-Products">
          <option *ngFor="let product of inputProducts" [ngValue]="product">{{product}}</option>
        </select>
      </div>
    </form>
  `,
  styleUrls: ['./gp-input.component.scss']
})
export class GpInputComponent implements OnInit {
 
  categories: any[];
  masterName: string;
  gpProducts: any[];
  catName: string = 'Generator Probes';
  inputProducts: any[];
  selectedValue: any;
  cart: any[];
  showFilters: boolean;

  constructor(private _service:GprobeUiService, private data: DataService){
    this.getGeneratprobes();
  }

 @Output() hasChanged: EventEmitter<any> = new EventEmitter();

  change(value) {
    this.hasChanged.emit(value);
    this.data.hideFilter(false);
  }

  getGeneratprobes(){
    this._service.getGeneratprobes('Generator Probes')
      .subscribe(response => {
        this.getMasterproducts();
      });
  }
 
  ngOnInit(){ 
    this.data.cart.subscribe(cart => this.cart = cart);
    this.data.showfilter.subscribe(value => this.showFilters = value);
   }

  getMasterproducts() {
    this._service.getMasterproducts()
      .subscribe(response => {
        this.categories = response;
        this.inputProducts = this.selectObject(this.categories);
        this.selectedValue = this.inputProducts[0];
        this.hasChanged.emit(this.inputProducts[0]);
      });
  }
  
  selectObject(categories){
    let newArr:any[] = [];
    let count = 0;
    categories.forEach(product => {
      let obj = {
        id: count += 1,
        name: product.product_name
      }
      newArr.push(product.product_name);
    });
    return newArr;
  }

}
