import { Response } from '@angular/http';
import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ProductsService } from "../../services/products/products.service";
import { IProduct } from '../../product';

@Component({
  selector: 'master-input',
  template: `
    <form>
      <div class="form-group">
        <label for="Master-Products">Select Master Product</label>
        <select [ngModel]="selectedValue" name="pow.name" (ngModelChange)="change($event)" class="form-control" id="Master-Products">
          <option *ngFor="let pow of powers" [ngValue]="pow.id">{{pow.name}}</option>
        </select>
      </div>
    </form>
  `,
  styleUrls: ['./master-input.component.scss']
})

export class MasterInputComponent implements OnInit {
  @Output() hasChanged: EventEmitter<number> = new EventEmitter();
  @Input() powers: any[];
  selectedValue: any;
  categoriesListArray: any[];
  masterProduct;
  
  constructor(private _service:ProductsService){}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['powers']) {
      if(this.powers !== undefined){
        this.selectedValue = this.powers[0].id;
      }
    }
  }

  change(value: number) {
    this.hasChanged.emit(value);
  }

  ngOnInit(){}

}
