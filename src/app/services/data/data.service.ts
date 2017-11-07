import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class DataService {
  private shoppingCart = new BehaviorSubject<any>([]);
  cart = this.shoppingCart.asObservable();

  private productSource = new BehaviorSubject<any>([]);
  currentProduct = this.productSource.asObservable();

  private showFilter = new BehaviorSubject<any>([]);
  showfilter = this.showFilter.asObservable();

  constructor() { }
  changCart(cart) {
    this.shoppingCart.next(cart);
  }

  changeProduct(product) {
    this.productSource.next(product);
  }

  hideFilter(value) {
    this.showFilter.next(value);
  }

}
