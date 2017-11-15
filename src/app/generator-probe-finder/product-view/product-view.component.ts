import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { GprobeUiService } from '../../services/gprobe-ui/gprobe-ui.service';
import { DataService } from './../../services/data/data.service';

@Component({
  selector: 'productView',
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.scss'],
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({ opacity: 1 }),
        animate(500)
      ])
    ])
  ]
})
export class ProductViewComponent {
  products: any[];
  showProducts: boolean;
  productInfo: any[];
  cart: any[];
  selectedProduct: string;
  diameterSelected: string;
  @Input() masterProductList;

  constructor(private _service: GprobeUiService, private data: DataService) {
    this.data.cart.subscribe(cart => this.cart = cart);
    this.data.currentProduct.subscribe(product => this.productInfo = product);
    this.data.diameter.subscribe(diameter => {
      if (this.masterProductList !== undefined) {
        if (diameter !== 'Select Diameter' && diameter !== '') {
          this.diameterSelected = diameter;
          this.products = this.getProducts1();
          this.showProducts = true;
          this.data.productListChanged(this.products);
        }
      }
    });
    this.data.prodList.subscribe(product => {
      this.products = product;
    });
    this.data.selectedProduct.subscribe(product => {
      this.selectedProduct = product;
      this.showProducts = false;
    });
  }

  getProducts1 = function(){
    let selectProdArr = [];
    const coco = [];
    this.masterProductList.forEach(item => {
      if (item.master === this.selectedProduct) {
        selectProdArr = item.related;
      }
    });
    for (let i = selectProdArr.length; i--; ) {
      if (selectProdArr[i].diameter === this.diameterSelected) {
        coco.push(selectProdArr[i]);
      }
    }
    return coco;
  };

  addToCart(product) {
    this.data.changCart(product);
  }

  viewProduct(value) {
    this.data.changeProduct(value);
  }

}
