import { Component, OnInit } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { GprobeUiService } from "../../services/gprobe-ui/gprobe-ui.service";
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
export class ProductViewComponent implements OnInit {
  
  products: any[];
  showProducts: boolean = false;
  productInfo: any[];
  cart: any[];
  constructor(private _service: GprobeUiService, private data:DataService) { }
  

  ngOnInit() {
    this.data.cart.subscribe(cart => this.cart = cart);
    this.data.currentProduct.subscribe(product => this.productInfo = product);
  }

  notify(value){
    this.products = value;
  }

  addToCart($event){
    let item = $event.target.parentElement.parentElement.parentElement.parentElement.firstChild.nextSibling.childNodes[1].text;
    let product:any[] = [];
    this.products.forEach(element => {
      if(element.product_name === item){
        product.push(element);
        this.data.changCart(product[0]);
      }
    });  
  }

  viewProduct(value){
    this.data.changeProduct(value);
  }

  toggleView(){
      let bln: boolean = this.showProducts ? true : false;
      return bln;
  }

  hasChangedagain(value){
    this.showProducts = true;
    this.getProducts(value);
  }

  hasChanged(value){
    this.showProducts = false;
  }

  getProducts(value:string){
    this._service.getProductsByDiameter(value)
      .subscribe(response => {
        this.products = response;
      });
  }

}
