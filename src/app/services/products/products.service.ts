import { Http, Response } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

@Injectable()
export class ProductsService {
  private url = '/api/products';
  private catList: any[];
  private masterName: string;

  constructor(private http: Http) {
  }
  private productCategoriesList = new BehaviorSubject<any>([]);
  currentList = this.productCategoriesList.asObservable();
  changeCatList(categoriesList) {
    this.productCategoriesList.next(categoriesList);
  }

  getCatgegories( ) {
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', '*');
    const opts = new RequestOptions();
    opts.headers = headers;
    const url = `${this.url}`;
    return this.http
      .get('/api/products', opts)
      .map(response => {
        const productArray = response.json();
        // Master List of Accessories related to the Master Product
        return productArray;
      });
  }

}
