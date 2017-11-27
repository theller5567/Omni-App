import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product/product.service';
import { IProduct } from '../../product';

@Component({
  selector: 'product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent {

  public product: any;

  constructor(private productService: ProductService, private router: Router) { }

  saveProduct() {
    console.log('rrr: ', this.product);
    this.productService.saveProduct(this.product).then((result) => {
      console.log('id: ', result);
      const id = result['_id'];
      this.router.navigate(['/product-details', id]);
    }, (err) => {
      console.log(err);
    });
  }

  // onFileChange(event) {
  //   const reader = new FileReader();
  //   if (event.target.files && event.target.files.length > 0) {
  //     const file = event.target.files[0];
  //     reader.readAsDataURL(file);
  //     reader.onload = () => {
  //       this.form.get('avatar').setValue({
  //         filename: file.name,
  //         filetype: file.type,
  //         value: reader.result.split(',')[1]
  //       });
  //     };
  //   }
  // }

}
