import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import * as _ from 'underscore';

@Injectable()
export class GprobeUiService {
  private url = '/api/products';
  private catList: any[];
  private productsByFilteredDiameter: any[];
  private gpByDiameter: any[] = [];
  constructor(private http: Http) {}

  getGeneratprobes(cat) {
    return this.http
      .get(this.url)
      .map(response => {
        const productArray = response.json();
        // Find all products with category name Generator Probes
        const generators = (function (a) {
          for (let i = productArray.length; i--; ) {
            if (productArray[i].cat_name === 'Generator Probes') {
              a.push(productArray[i].id);
            }
          }
          return a;
        })([]);
        const catList = (function (a) {
          for (let i = productArray.length; i--; ) {
            if (_.intersection(productArray[i].related_products, generators).length > 0) {
              a.push(productArray[i]);
            }
          }
          return a;
        })([]);
        const gpArray = this.checking(productArray, catList);
        return gpArray;
      });
  }

  checking = function(productsArr, names) {
      // find all accessories under this product that have a cat name of Generator Probe and retrun
      const relatedProducts: any[] = [];
      names.forEach(product => {
        const obj = {
          master: product.product_name,
          related: []
        };
        productsArr.forEach(prod => {
          if (_.contains(product.related_products, prod.id) && prod.cat_name === 'Generator Probes') {
            obj.related.push(prod);
          }
        });
        relatedProducts.push(obj);
      });
      console.log('sorted array: ', _.sortBy(relatedProducts, 'master'));
      return _.sortBy(relatedProducts, 'master');
  };

}
