import { ProductService } from '../../services/product/product.service';
import { Component, OnInit, EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, state, transition, style, animate, query, stagger, keyframes } from '@angular/animations';
import { DataService } from './../../services/data/data.service';
import { IProduct } from '../../product';
import * as _ from 'underscore';

@Component({
  selector: 'accessories',
  templateUrl: './accessories.component.html',
  styleUrls: ['./accessories.component.scss'],
  animations: [
    trigger('fade', [
      transition('* <=> *', [
        query(':enter', style({ opacity: 0 }), {optional: true}),
        query(':enter', stagger('100ms', [
          animate('1s ease-in', keyframes([
            style({opacity: 0, transform: 'translateY(-15%)', offset: 0}),
            style({opacity: .5, transform: 'translateY(15px)',  offset: 0.3}),
            style({opacity: 1, transform: 'translateY(0)',     offset: 1.0}),
          ]),
        )]), {optional: true})
      ])
    ]),
    trigger('productsIntro', [
      transition('* <=> *', [
        query(':enter', style({ opacity: 0 }), {optional: true}),
        query(':enter', stagger('50ms', [
          animate('800ms ease-in', keyframes([
            style({opacity: 0, transform: 'translateY(-10%)', offset: 0}),
            style({opacity: .5, transform: 'translateY(10px)',  offset: 0.3}),
            style({opacity: 1, transform: 'translateY(0)',     offset: 1.0}),
          ]))]), {optional: true})
      ])
    ])
  ]
})
export class AccessoriesComponent implements OnInit {
  public categories: string[] = [];
  public products: IProduct[] = [];
  public subProducts: any[];
  public category_name: string;
  public subCategory_name: string;
  public showSubCat: boolean;
  private masterProduct: number;
  public masterName: string;
  public selectedCat: any;
  public masterProductArray: any;
  public masterProductBanner: string;
  public selectedSubCat: any;
  productInfo: any[];
  catList: any[];
  powers;
  catbanners: boolean;
  masterProductList: any[];
  animationState = 'inactive';
  public loading = false;

  constructor(
      private data: DataService,
      private prodService: ProductService
    ) {
    this.getProductsList();
  }
  ngOnInit() {
    this.selectedCat = 'Select a Category';
    this.selectedSubCat = 'Select a Sub Category';
    this.data.currentProduct.subscribe(product => this.productInfo = product);
  }

  getProductsList() {
    this.loading = true;
    this.prodService.getAllProducts()
      .subscribe(response => {
        const masterList = this.getProductsWithAccessories(response);
        this.powers = masterList;
        this.masterProductList = response;
        this.getCatgegories(this.masterProduct);
        this.loading = false;
        this.catbanners = true;
      });
  }

  toggleState() {
    this.animationState = this.animationState === 'active' ? 'inactive' : 'active';
  }

  addToCart(product) {
    this.data.changCart(product);
  }

  backToCat() {
    this.products = [];
    this.category_name = '';
    this.subCategory_name = '';
    this.showSubCat = false;
    this.catbanners = true;
  }

  viewProduct(value) {
    this.data.changeProduct(value);
  }

  changeCat(value) {
    if (typeof value === 'string') {
      this.listProducts(value);
    } else {
      const cat = value;
      this.listProducts(cat);
    }
  }

  changeSub(value) {
    if (typeof value === 'string') {
      this.listSubProducts(value);
    } else {
      const sub = value;
      this.listSubProducts(sub);
    }
  }

  listProducts(cat) {
    this.catbanners = false;
    this.category_name = cat;
    this.products = [];
    this.subProducts = [];
    this.subCategory_name = '';
    const ml = this.catList;
    const catProductsArr = [];
    let flag = false;
    for (let i = 0; i < ml.length; i++) {
      if (ml[i].cat_name === cat) {
        catProductsArr.push(ml[i]);
      }
    }
    const products = catProductsArr;
    const prodList = (function (a) {
      for (let i = products.length; i--; ) {
        if (products[i].sub_cat_name) {
          flag = true;
          a.push(products[i].sub_cat_name);
        } else {
          flag = false;
          a.push(products[i]);
        }
      }
      return a;
    })([]);
    if (!flag) {
      this.showSubCat = false;
      this.products = _.uniq(prodList).reverse();
      this.toggleState();
    } else {
      this.showSubCat = true;
      this.subProducts = _.uniq(prodList).reverse();
    }
  }

  listSubProducts(sub) {
    this.subCategory_name = sub;
    const prodObj = {
      sub: this.subCategory_name,
      cat: this.category_name
    };
    const ml = this.catList;
    const subProductsArr = [];
    for (let i = 0; i < ml.length; i++) {
      if (ml[i].sub_cat_name === prodObj.sub && ml[i].cat_name === prodObj.cat) {
        subProductsArr.push(ml[i]);
      }
    }
    subProductsArr.reverse();
    const products = subProductsArr;
    this.products = [];
    for (let i = products.length; i--; ) {
      this.products.push(products[i]);
    }
    this.toggleState();
  }

  hasChanged(val: number) {
    this.backToCat();
    const masterNumber = this.masterProductNum(val);
    this.getCatgegories(masterNumber);
  }

  masterProductNum(mNumber: number) {
    this.masterProduct = mNumber;
    return mNumber;
  }

  getProductsWithAccessories(masterList) {
    const productArray = masterList;
    let productsWithAccessories = [];
    productArray.forEach(product => {
      if (product.related_products.length > 0) {
        const obj = {
          id: product.id,
          name: product.product_name
        };
        productsWithAccessories.push(obj);
      }
    });
    productsWithAccessories = _.sortBy(productsWithAccessories, 'name');
    return productsWithAccessories;
  }

  MasterAccessories(response: any[], masterProduct: number) {
    const productArray = response;
    let selectedProduct;
    productArray.forEach(product => {
      if (product.id === masterProduct) {
        selectedProduct = product;
      }
    });
    const masterAccessories = selectedProduct.related_products;
    this.masterName = selectedProduct.product_name;
    const AccessorieProducts = [];
    for (let i = 0; i < productArray.length; i++) {
      if (masterAccessories.indexOf(productArray[i].id) !== -1) {
        AccessorieProducts.push(productArray[i]);
      }
    }
    this.catList = AccessorieProducts;
    return AccessorieProducts;
  }

  getCatgegories(masterProduct: number) {
    const response = this.masterProductList;
    const masterList = this.getProductsWithAccessories(response);
    this.powers = masterList;
    if (masterProduct === undefined) {
      masterProduct = masterList[0].id;
    }
    this.masterProductArray = _.findWhere(this.masterProductList, { id: masterProduct });
    this.masterProductBanner = this.bannerExist();
    const ml = this.MasterAccessories(response, masterProduct);
    const catList = (function (a) {
      for (let i = ml.length; i--; ) {
        if (a.indexOf(ml[i].cat_name) < 0) {
          a.push(ml[i].cat_name);
        }
      }
      return a;
    })([]);
    this.categories = _.sortBy(catList);
    this.categories.splice(0, 0, 'Select a Category');
  }
  
  bannerExist() {
    if (this.masterProductArray.images[0].banner !== undefined) {
      return '../../' + this.masterProductArray.images[0].banner;
    } else {
      return undefined;
    }
  }

  hasProducts(): boolean {
    if (this.products) {
      const bln: boolean = this.products.length < 1 || undefined ? false : true;
      return bln;
    } else {
        return false;
    }
  }
}
