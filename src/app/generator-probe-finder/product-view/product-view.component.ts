import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
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
export class ProductViewComponent implements OnInit, OnChanges {
  products: any[];
  showProducts: boolean = false;
  filterState: boolean = true;
  productInfo: any[];
  cart: any[];
  productsByFilteredDiameter: any;
  @Input() diameterProduct;
  @Input() testing;
  @Input() selectedValue;

  selectedProduct: string;
  diameterSelected: string;

  constructor(private _service: GprobeUiService, private data: DataService) { }

  ngOnInit() {
    this.data.cart.subscribe(cart => this.cart = cart);
    this.data.currentProduct.subscribe(product => this.productInfo = product);
    this.data.prodList.subscribe(product => {
        this.products = product;
    });
    this.data.fState.subscribe(state => {
      this.filterState = state;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      if (changes['testing']) {
        this.testing = changes.testing.currentValue;
      }
      if (changes['selectedValue']) {
        this.products = [];
        this.diameterSelected = undefined;
        this.showProducts = false;
      }
      if (this.testing) {
        if (changes['diameterProduct']) {
          if (changes.diameterProduct.currentValue !== undefined) {
            this.diameterSelected = changes.diameterProduct.currentValue.diameterSelected;
            this.selectedProduct = changes.diameterProduct.currentValue.selectedProduct;
            this.data.filterStateChanged(true);
            this.products = this.getProducts1();
            this.showProducts = true;
            this.data.productListChanged(this.products);
          }
        }
      }
    }
  }

  getProducts1 = function(){
    let selectProdArr = [];
    const coco = [];
    this.testing.forEach(item => {
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

  addToCart($event) {
    const item = $event.target.parentElement.parentElement.parentElement.parentElement.firstChild.nextSibling.childNodes[1].text;
    const product: any[] = [];
    this.products.forEach(element => {
      if (element.product_name === item) {
        product.push(element);
        this.data.changCart(product[0]);
      }
    });
  }

  viewProduct(value) {
    this.data.changeProduct(value);
  }

}
