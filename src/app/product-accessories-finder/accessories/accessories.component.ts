import { Component, OnInit, EventEmitter, IterableDiffers, DoCheck } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, state, transition, style, animate, query, stagger, keyframes } from '@angular/animations';
import { ProductsService } from '../../services/products/products.service';
import { DataService } from './../../services/data/data.service';
// import { Ng4LoadingSpinnerService  } from 'ng4-loading-spinner';
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
        query(':enter', stagger('100ms', [
          animate('1s ease-in', keyframes([
            style({opacity: 0, transform: 'translateY(-10%)', offset: 0}),
            style({opacity: .5, transform: 'translateY(10px)',  offset: 0.3}),
            style({opacity: 1, transform: 'translateY(0)',     offset: 1.0}),
          ]))]), {optional: true})
      ])
    ])
  ]
})
export class AccessoriesComponent implements OnInit, DoCheck {
  categories: string[] = [];
  products: IProduct[] = [];
  subProducts: any[];
  private productFlag: string = 'false';
  private subProductFlag: string = 'false';
  category_name: string = '';
  subCategory_name: string = '';
  breadcrumbArr: any[];
  showSubCat: boolean = false;
  private masterProduct: number;
  masterName: string;
  productsInCart: any[];
  selectedCat: any;
  selectedSubCat: any;
  cart: any[];
  productInfo: any[];
  categoriesListArray: any[];
  catList: any[];
  powers;
  masterProductList: any[];
  public iterableDiffer;
  animationState = 'inactive';
  public loading = false;

  constructor(
      private _service: ProductsService,
      private data: DataService,
      private _iterableDiffers: IterableDiffers
    ) {
    this.getProductsList();
    this.iterableDiffer = this._iterableDiffers.find([]).create(null);
    console.log('testing: ', this.iterableDiffer);
  }
  ngOnInit() {
    this.selectedCat = 'Select a Category';
    this.selectedSubCat = 'Select a Sub Category';
    this.data.cart.subscribe(cart => this.cart = cart);
    this.data.currentProduct.subscribe(product => this.productInfo = product);
  }

  ngDoCheck() {
    const changes = this.iterableDiffer.diff(this.products);
    if (changes) {
      console.log('Changes detected!', changes._length);
    }
  }
  toggleState() {
    console.log('toggle state: ', this.animationState);
    this.animationState = this.animationState === 'active' ? 'inactive' : 'active';
  }

  addToCart($event) {
    const item = $event.target.parentElement.parentElement.parentElement.parentElement.firstChild.nextSibling.childNodes[1].text;
    const product: any[] = [];
    this.products.forEach(element => {
      if (element.product_name === item) {
        product.push(element);
        this.data.changCart(product[0]);
      }
    });
  }

  backToCat() {
    this.products = [];
    this.category_name = '';
    this.subCategory_name = '';
    this.showSubCat = false;
  }

  viewProduct(value) {
    this.data.changeProduct(value);
  }

  change(value) {
    this.getCatName(value);
  }

  changeSub(value) {
    this.getSubCatName(value);
  }

  listProducts(cat) {
    this.category_name = cat;
    this.products = [];
    this.subProducts = [];
    this.subCategory_name = '';
    const ml = this.catList;
    const catProductsArr = [];
    const arr = [];
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

    const uniqEs6 = (arrArg) => {
      return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) === pos;
      });
    };
    if (!flag) {
      this.showSubCat = false;
      this.products = uniqEs6(prodList).reverse();
      this.toggleState();
    } else {
      this.showSubCat = true;
      this.subProducts = uniqEs6(prodList).reverse();
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

  getSubCatName(value: any) {
    if (typeof value === 'string') {
      this.listSubProducts(value);
    } else {
      const sub = value.target.innerText;
      this.listSubProducts(sub);
    }
  }

  getCatName(value: any) {
    if (typeof value === 'string') {
      this.listProducts(value);
    } else {
      const cat = value.target.innerText;
      this.listProducts(cat);
    }
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


  getProductsList() {
    // this.spinnerService.show();
    this.loading = true;
    this._service.getCatgegories()
      .subscribe(response => {
        const masterList = this.getProductsWithAccessories(response);
        this.powers = masterList;
        this.masterProductList = response;
        this.getCatgegories(this.masterProduct);
        this.loading = false;
        // this.spinnerService.hide();
      });
  }

  getCatgegories(masterProduct: number) {
    const response = this.masterProductList;
    const masterList = this.getProductsWithAccessories(response);
    this.powers = masterList;
    if (masterProduct === undefined) {
      masterProduct = masterList[0].id;
    }
    const ml = this.MasterAccessories(response, masterProduct);
    const catList = (function (a) {
      for (let i = ml.length; i--; ) {
        if (a.indexOf(ml[i].cat_name) < 0) {
          a.push(ml[i].cat_name);
        }
      }
      return a;
    })([]);
    this.categories = catList;
    this.categories.splice(0, 0, 'Select a Category');
  }

  hasSub(): boolean {
    if (this.subProducts) {
      const bln: boolean = this.subProducts.length < 1 || undefined ? false : true;
      return bln;
    } else {
      return false;
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
