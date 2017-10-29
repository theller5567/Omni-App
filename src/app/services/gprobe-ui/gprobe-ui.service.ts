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

  getGeneratprobes(cat){
    return this.http
      .get(this.url)
      .map(response => {
        let productArray = response.json();
        //Find all products with category name Generator Probes
        let generators = (function (a) {
          for (let i = productArray.length; i--;) {
            if(productArray[i].cat_name === 'Generator Probes'){
              a.push(productArray[i].id);
            }
          }
          return a;
        })([]);
        this.generatorProbesList = generators;
        return generators;
      });
  }

  getMasterproducts() {
    return this.http
      .get(this.url)
      .map(response => {
        let productArray = response.json();
        //Master List of Accessories related to the Master Product
        let ml2 = this.generatorProbesList;
        let catList = (function (a) {
          for (let i = productArray.length; i--;) {
            let arrs = _.intersection(productArray[i].related_products, ml2);
            if (_.intersection(productArray[i].related_products, ml2).length > 0) {
              a.push(productArray[i]);
            }
          }
          return a;
        })([]);
        return catList;
      });
  }

  getProductsByName(name:string){
     return this.http
      .get(this.url)
      .map(response => {
        let productArray = response.json();
        let masterProd:any;
        //Master List of Accessories related to the Master Product
        productArray.forEach(product => {
          if(product.product_name === name){
            masterProd = product;
          }
        });
        //find all accessories under this product that have a cat name of Generator Probe and retrun
        let relatedProducts: any[] =  masterProd.related_products;
        let gp = (function (a) {
          productArray.forEach(product => {
            let prodId = [];
            prodId.push(product.id);
            if( _.intersection(prodId, relatedProducts).length > 0){
              a.push(product);
            }
          });
          return a;
        })([]);
        //filter through array and create new string array of all diameter lengths and retrun
        let diameterList = (function (a) {
          for (let i = gp.length; i--;) {
            if(gp[i].cat_name === 'Generator Probes'){
              if (a.indexOf(gp[i].diameter) < 0) {
                a.push(gp[i].diameter);
              }
            }
          }
          return a;
        })([]);
        this.gpByDiameter = (function (a) {
          for (let i = gp.length; i--;) {
            if(gp[i].cat_name === 'Generator Probes'){
              if (a.indexOf(gp[i].diameter) < 0) {
                a.push(gp[i]);
              }
            }
          }
          return a;
        })([]);
        return diameterList;
      });
  }

  getCurrentGpList(){
    return this.http
      .get(this.url)
      .map(response => {
        return this.productsByFilteredDiameter;
      });
  }

  getProductsByDiameter(diameter:string){
    let gp = this.gpByDiameter;
    return this.http
      .get(this.url)
      .map(response => {
        let prodsByDiameter = (function (a) {
          for (let i = gp.length; i--;) {
            if(gp[i].diameter === diameter){
                a.push(gp[i]);
            }
          }
          return a;
        })([]);
        this.productsByFilteredDiameter = prodsByDiameter;
        return prodsByDiameter;
      });
  }

}
