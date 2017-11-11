import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import * as _ from 'underscore';

@Injectable()
export class GprobeUiService {
  private url = '/api/products';
  private catList: any[];
  private generatorProbesList: any[];
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
        this.generatorProbesList = generators;
        const ml2 = this.generatorProbesList;

        const catList = (function (a) {
          for (let i = productArray.length; i--; ) {
            const arrs = _.intersection(productArray[i].related_products, ml2);
            if (_.intersection(productArray[i].related_products, ml2).length > 0) {
              a.push(productArray[i]);
            }
          }
          return a;
        })([]);
        const gpArray = this.checking(productArray, catList);
        return gpArray;
      });
  }

  getMasterproducts() {
    return this.http
      .get(this.url)
      .map(response => {
        const productArray = response.json();
        // Master List of Accessories related to the Master Product
        const ml2 = this.generatorProbesList;
        const catList = (function (a) {
          for (let i = productArray.length; i--; ) {
            const arrs = _.intersection(productArray[i].related_products, ml2);
            if (_.intersection(productArray[i].related_products, ml2).length > 0) {
              a.push(productArray[i]);
            }
          }
          return a;
        })([]);
        return catList;
      });
  }

  getProductsByName(name: string) {
     return this.http
      .get(this.url)
      .map(response => {
        const productArray = response.json();
        let masterProd: any;
        // Master List of Accessories related to the Master Product
        productArray.forEach(product => {
          if (product.product_name === name) {
            masterProd = product;
          }
        });
        // find all accessories under this product that have a cat name of Generator Probe and retrun
        const relatedProducts: any[] =  masterProd.related_products;
        const gp = (function (a) {
          productArray.forEach(product => {
            const prodId = [];
            prodId.push(product.id);
            if ( _.intersection(prodId, relatedProducts).length > 0) {
              a.push(product);
            }
          });
          return a;
        })([]);
        // filter through array and create new string array of all diameter lengths and retrun
        const diameterList = (function (a) {
          for (let i = gp.length; i--; ) {
            if (gp[i].cat_name === 'Generator Probes') {
              if (a.indexOf(gp[i].diameter) < 0) {
                a.push(gp[i].diameter);
              }
            }
          }
          return a;
        })([]);
        this.gpByDiameter = (function (a) {
          for (let i = gp.length; i--; ) {
            if (gp[i].cat_name === 'Generator Probes') {
              if (a.indexOf(gp[i].diameter) < 0) {
                a.push(gp[i]);
              }
            }
          }
          return a;
        })([]);
        console.log('service gpByDiameter: ', this.gpByDiameter);
        return diameterList;
      });
  }

  getCurrentGpList() {
    return this.http
      .get(this.url)
      .map(response => {
        return this.productsByFilteredDiameter;
      });
  }

  getProductsByDiameter(diameter: string) {
    const gp = this.gpByDiameter;
    return this.http
      .get(this.url)
      .map(response => {
        const prodsByDiameter = (function (a) {
          for (let i = gp.length; i--; ) {
            if (gp[i].diameter === diameter) {
                a.push(gp[i]);
            }
          }
          return a;
        })([]);
        this.productsByFilteredDiameter = prodsByDiameter;
        return prodsByDiameter;
      });
  }

  checking = function(productsArr, names) {
      const masterProds: any[] = [];
      // Master List of Accessories related to the Master Product
      const nameList = [];
      names.forEach(product => {
        nameList.push(product.product_name);
      });

      productsArr.forEach(product => {
        nameList.forEach(name => {
          if (product.product_name === name) {
            masterProds.push(product);
          }
        });
      });
      // find all accessories under this product that have a cat name of Generator Probe and retrun
      const relatedProducts: any[] = [];
      masterProds.forEach(product => {
        const obj = {
          product: product.product_name,
          related: product.related_products
        };
        relatedProducts.push(obj);
      });
      const gp = (function (a) {
        productsArr.forEach(product => {
          const prodId = [];
          prodId.push(product.id);
          relatedProducts.forEach(arr => {
            if (_.intersection(prodId, arr.related).length > 0) {
              if (product.cat_name === 'Generator Probes') {
                const allArr = [];
                const obj = {
                  master: arr.product,
                  related: [product]
                };
                a.push(obj);
              }
            }
          });
        });
        return a;
      })([]);
      const masterArray = this.process(gp);
      return masterArray;
  };

  process = function(objects) {
    const results = [];
    objects.forEach(object => { // iterate through array
      const result = results.find(x => x.master === object.master);
      if (result) { // if item with "master" exists
        object.related.forEach(item => { // add all realted items to existing items "related" array
          if (!result.related.find(x => x === item)) {
            result.related.push(item);
          }
        });
      } else { // otherwise add an item to "results" array
        results.push(object);
      }
    });
    return results;
  };

}
