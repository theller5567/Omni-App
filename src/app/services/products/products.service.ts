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
  changeCatList(categoriesList){
    this.productCategoriesList.next(categoriesList);
  }

  getProductsWithAccessories(){
    return this.http
      .get(this.url)
      .map(response => {
         let productArray = response.json()[0].products;
         let productsWithAccessories = [];
        productArray.forEach(product => {
           if(product.product.related_products.length > 0){
             let obj = {
               id: product.product.id,
               name: product.product.product_name
             }
              productsWithAccessories.push(obj);
           }
         });
        return productsWithAccessories;
      });
  }

  getCatgegories( ) {
    console.log("GET WITH HEADERS");
    let headers = new Headers();
    headers.append('Access-Control-Allow-Origin','*');
    let opts = new RequestOptions();
    opts.headers = headers;
    let url = `${this.url}`;
    return this.http
      .get("/api/products", opts)
      .map(response => {
        console.log("CHECKING: ", response.json());
        //let productArray = this.getFields(response.json()[0].products, 'product');
        let productArray = response.json();
        msg => console.error(`Error: ${msg.status} ${msg.statusText}`)
        //Master List of Accessories related to the Master Product
        return productArray;
      });
  }

  listProducts(catName: string) {
    return this.http
      .get(this.url)
      .map(response => {
        let productArray = response.json()[0].products;
        //Master List of Accessories related to the Master Product
        let ml = this.catList;
        let catProductsArr = [];
        for (let i = 0; i < ml.length; i++) {
          if (ml[i].product.cat_name === catName) {
            catProductsArr.push(ml[i]);
          }
        }
        return catProductsArr;
      });
  }

  listSubProducts(prodObj: { sub: string, cat: string }) {
    return this.http
      .get(this.url)
      .map(response => {
        let productArray = response.json()[0].products;
        //Master List of Accessories related to the Master Product
        let ml = this.catList;
        let subProductsArr = [];
        for (let i = 0; i < ml.length; i++) {
          if (ml[i].product.sub_cat_name === prodObj.sub && ml[i].product.cat_name === prodObj.cat) {
            subProductsArr.push(ml[i]);
          }
        }
        subProductsArr.reverse();
        return subProductsArr;
      });
  }

  // getFields(input, field) {
  //   var output = [];
  //   for (var i=0; i < input.length ; ++i)
  //       output.push(input[i][field]);
  //   return output;
  // }

}
