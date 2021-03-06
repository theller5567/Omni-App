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

  private productList = new BehaviorSubject<any>([]);
  prodList = this.productList.asObservable();

  private filterState = new BehaviorSubject<any>([]);
  fState = this.filterState.asObservable();

  private selectedInput = new BehaviorSubject<any>([]);
  selectedProduct = this.selectedInput.asObservable();

  private selectedDiameter = new BehaviorSubject<any>([]);
  diameter = this.selectedDiameter.asObservable();

  changCart(cart) {
    this.shoppingCart.next(cart);
  }

  changeProduct(product) {
    this.productSource.next(product);
  }

  hideFilter(value) {
    this.showFilter.next(value);
  }

  productListChanged(list) {
    this.productList.next(list);
  }

  filterStateChanged(list) {
    this.filterState.next(list);
  }

  productSelected(product) {
    this.selectedInput.next(product);
  }

  diameterChanged(diameter) {
    this.selectedDiameter.next(diameter);
  }

}
