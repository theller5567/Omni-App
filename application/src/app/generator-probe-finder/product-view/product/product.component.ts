import { Component, OnInit, Input} from '@angular/core';
import { DataService } from '../../../services/data/data.service';

@Component({
  selector: 'product',
  template: `
    <div *ngIf="showProductView" id="product-module" [ngClass]="{ 'show-product': showProductView, 'hide-product': !showProductView }">
      <h4>{{productInfo.product_name}}</h4>
        <p><strong>SKU:</strong> {{productInfo.sku}}</p>
        <p><strong>Description:</strong> {{productInfo.description}}</p>
        <p><strong>Category:</strong> {{productInfo.cat_name}}</p>
        <p><strong>Diameter:</strong> {{productInfo.diameter}}</p>
        <p><strong>Length:</strong> {{productInfo.length}}</p>
        <p><strong>Window-Size:</strong> {{productInfo.window_size}}</p>
        <p><strong>Price:</strong> {{productInfo.price | currency:'USD':true:'1.2-2'}}</p>
        <div class="remove" (click)="close()"><i class="glyphicon glyphicon-remove"></i> </div>
    </div>
  `,
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit{
  productInfo: any[];
  showProductView:boolean = false;
  constructor(private data:DataService) { }
  

  ngOnInit(){
    this.data.currentProduct.subscribe(product => {
      if(product.length < 1){
        return;
      }else {
        this.showProductView = true;
        this.productInfo = product;
      }
    });
  }
  
  close(){
    this.showProductView = false;
    this.productInfo = []
  }

}
