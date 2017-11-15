import { Component, OnInit } from '@angular/core';
import { IProduct } from '../../product';
import { DataService } from './../../services/data/data.service';

@Component({
  selector: 'cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit  {
  public itemsInCart: IProduct[] = [];
  public cartTotal: number;
  public cartOpen: boolean;
  public numberOfItemsInCart: number;
  public cartMessage: string;
  public count: number;
  public products: IProduct[] = [];
  constructor(private data: DataService) {}

  closeCart() {
    this.cartOpen = false;
  }

  removeItem(id) {
    const arr = this.products;
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].id === id) {
          arr[i].quantity = 1;
          arr.splice(i, 1);
        }
    }
    this.count = this.getCartTotalProducts(this.products);
    this.cartTotal = this.totalCartAmount(this.products);
  }

  ngOnInit() {
    this.numberOfItemsInCart = 0;
    this.count = 0;
    this.data.cart.subscribe(cart => {
      if (cart.length < 1) {
        return;
      }else {
        const value = cart;
        this.count += 1;
        if (this.itemsInCart.indexOf(value) !== -1) {
          value.quantity += 1;
          this.cartOpen = true;
        }else {
          this.itemsInCart.push(value);
          this.cartOpen = true;
        }
        this.products = this.itemsInCart;
        this.numberOfItemsInCart = this.getCartTotalProducts(this.products);
        cart = [];
      }
      this.cartTotal = this.totalCartAmount(this.products);
    });
  }

  getCartTotalProducts(arr: IProduct[]) {
    let count = 0;
    arr.forEach(product => {
      count += product.quantity;
    });
    (count === 0) ? this.cartMessage = 'There are no items in your cart.' : this.cartMessage = '';
    return count;
  }

  totalCartAmount(arr: IProduct[]) {
    let count = 0;
    arr.forEach(product => {
      count += (product.price * product.quantity);
    });
    return count;
  }
}
