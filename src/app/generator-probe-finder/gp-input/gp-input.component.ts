import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { DataService } from './../../services/data/data.service';

@Component({
  selector: 'gpInput',
  template: `
    <form>
      <div class="form-group">
        <label for="Master-Products">Select Product</label>
        <select [ngModel]="selectedValue" name="product" (ngModelChange)="change($event)" class="form-control" id="Master-Products">
          <option *ngFor="let product of testing" [ngValue]="product.master">{{product.master}}</option>
        </select>
      </div>
    </form>
    <gpInputDiameter [testing]="testing" [selectedValue]="selectedValue"></gpInputDiameter>
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
  @Output() hasChanged: EventEmitter<any> = new EventEmitter();
  @Input() testing: any[];
  constructor(private data: DataService ) {}

  change(value) {
    this.selectedValue = value;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['testing']) {
      if (changes['testing'].currentValue) {
        this.selectedValue = this.testing[0].master;
      }
    }
  }

  ngOnInit() {
    this.data.cart.subscribe(cart => this.cart = cart);
    this.data.showfilter.subscribe(value => this.showFilters = value);
   }

}
