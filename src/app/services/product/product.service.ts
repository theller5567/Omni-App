import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
@Injectable()
export class ProductService {
  private url = '/api/products';
  constructor(private http: Http) { }

  getAllProducts() {
    return this.http
      .get('/api/products')
        .map(res => {
          return res.json();
        });
  }

  showProduct(id) {
    return new Promise((resolve, reject) => {
      this.http.get('/api/products/' + id)
        .map(res => res.json())
        .subscribe(res => {
          console.log('RESS:: ', res);
          resolve(res);
        }, (err) => {
          reject(err);
        });
    });
  }

  saveProduct(data) {
    return new Promise((resolve, reject) => {
      this.http.post('/api/products', data)
        .map(res => res.json())
        .subscribe(res => {
          resolve(res);
        }, (err) => {
          reject(err);
        });
    });
  }

  updateProduct(id, data) {
    return new Promise((resolve, reject) => {
      this.http.put('/products/' + id, data)
        .map(res => res.json())
        .subscribe(res => {
          resolve(res);
        }, (err) => {
          reject(err);
        });
    });
  }

  deleteProduct(id) {
    return new Promise((resolve, reject) => {
      this.http.delete('/products/' + id)
        .subscribe(res => {
          resolve(res);
        }, (err) => {
          reject(err);
        });
    });
  }

}
