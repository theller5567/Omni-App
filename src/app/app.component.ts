import { IProduct } from './product';
import { CartComponent } from './product-accessories-finder/cart/cart.component';
import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ProductsService } from './services/products/products.service';
import { MasterInputComponent } from './product-accessories-finder/master-input/master-input.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ProductsService, MasterInputComponent]
})

export class AppComponent implements OnInit {
  title = 'Having FUN with Angular';
  posts: any[];
  power: string;
  

  constructor() {
  }
  ngOnInit(): void { }

  
}
