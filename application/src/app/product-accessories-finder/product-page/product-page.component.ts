import { CartComponent } from '../cart/cart.component';
import { AccessoriesComponent } from './../accessories/accessories.component';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.scss']
})
export class ProductPageComponent implements OnInit {
  
  constructor() { }

  ngOnInit() {
  }

}
