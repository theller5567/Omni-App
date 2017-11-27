import { DataService } from './services/data/data.service';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HttpModule } from '@angular/http';
import { ProductService } from './services/product/product.service';
import { AccessoriesComponent } from './product-accessories-finder/accessories/accessories.component';
import { FormsModule, FormBuilder } from '@angular/forms';
import { MasterInputComponent } from './product-accessories-finder/master-input/master-input.component';
import { CartComponent } from './product-accessories-finder/cart/cart.component';
import { GpUiComponent } from './generator-probe-finder/gp-ui/gp-ui.component';
import { GpComponent } from './generator-probe-finder/gp/gp.component';
import { RouterModule } from '@angular/router';
import { GpInputComponent } from './generator-probe-finder/gp-input/gp-input.component';
import { GpInputDiameterComponent } from './generator-probe-finder/gp-input-diameter/gp-input-diameter.component';
import { ProductViewComponent } from './generator-probe-finder/product-view/product-view.component';
import { ExtraFiltersComponent } from './generator-probe-finder/extra-filters/extra-filters.component';
import { ProductComponent } from './generator-probe-finder/product-view/product/product.component';
import { AlertModule } from 'ngx-bootstrap';
import { LoadingModule } from 'ngx-loading';
import { NewProductComponent } from './product-crud/new-product/new-product.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ProductDetailComponent } from './product-crud/product-detail/product-detail.component';
import { ProductCreateComponent } from './product-crud/product-create/product-create.component';

@NgModule({
  declarations: [
    AppComponent,
    AccessoriesComponent,
    MasterInputComponent,
    CartComponent,
    GpUiComponent,
    GpComponent,
    GpInputComponent,
    GpInputDiameterComponent,
    ProductViewComponent,
    ExtraFiltersComponent,
    ProductComponent,
    NewProductComponent,
    ProductDetailComponent,
    ProductCreateComponent,
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    BrowserAnimationsModule,
    LoadingModule,
    AlertModule.forRoot(),
    RouterModule.forRoot([
      {
        path: 'accessories',
        component: AccessoriesComponent
      },
      {
        path: 'gp-finder',
        component: GpComponent
      },
      {
        path: 'new-product',
        component: NewProductComponent
      },
      {
        path: 'product-details/:id',
        component: ProductDetailComponent
      },
      {
        path: 'product-create',
        component: ProductCreateComponent
      },
      {
        path: '',
        component: AccessoriesComponent
      }
    ]),
  ],
  providers: [
    DataService,
    ProductService,
    FormBuilder
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
