import { Component } from '@angular/core';
import { ProductService } from '../../services/product/product.service';
import * as _ from 'underscore';


@Component({
  selector: 'gp-ui',
  templateUrl: './gp-ui.component.html',
  styleUrls: ['./gp-ui.component.scss']
})
export class GpUiComponent {
  public masterProductList: any[];
  public loading = false;

  constructor(private _service: ProductService) {
    this.getProducts();
  }

  getProducts() {
    this.loading = true;
    this._service.getAllProducts()
      .subscribe(response => {
        const productArray = response;
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
        this.masterProductList = gpArray;
        this.loading = false;
      });
  }

  checking = function (productsArr, names) {
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
    return _.sortBy(relatedProducts, 'master');
  };

}
