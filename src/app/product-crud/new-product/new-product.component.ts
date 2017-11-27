import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product/product.service';

@Component({
  selector: 'new-product',
  templateUrl: './new-product.component.html',
  styleUrls: ['./new-product.component.scss']
})
export class NewProductComponent implements OnInit {

  products: any;

  constructor(private productService: ProductService) { }

  ngOnInit() {
    this.getBookList();
  }

  showMe(product) {
    console.log('product :', product);
  }

  getBookList() {
    this.productService.getAllProducts().subscribe((res) => {
      this.products = res;
    }, (err) => {
      console.log(err);
    });
  }
}
