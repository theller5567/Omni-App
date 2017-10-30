import { DataService } from './services/data/data.service';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HttpModule } from '@angular/http';
import { ProductsService } from './services/products/products.service';
import { GprobeUiService } from './services/gprobe-ui/gprobe-ui.service';
import { AccessoriesComponent } from './product-accessories-finder/accessories/accessories.component';
import { FormsModule }   from '@angular/forms';
import { MasterInputComponent } from './product-accessories-finder/master-input/master-input.component';
import { CartComponent } from './product-accessories-finder/cart/cart.component';
import { GpUiComponent } from './generator-probe-finder/gp-ui/gp-ui.component';
import { GpComponent } from './generator-probe-finder/gp/gp.component';
import { RouterModule } from '@angular/router';
import { ProductPageComponent } from './product-accessories-finder/product-page/product-page.component';
import { GpInputComponent } from './generator-probe-finder/gp-input/gp-input.component';
import { GpInputDiameterComponent } from './generator-probe-finder/gp-input-diameter/gp-input-diameter.component';
import { ProductViewComponent } from './generator-probe-finder/product-view/product-view.component';
import { ExtraFiltersComponent } from './generator-probe-finder/extra-filters/extra-filters.component';
import { ProductComponent } from './generator-probe-finder/product-view/product/product.component';
import { AlertModule } from 'ngx-bootstrap';
import { LoadingModule } from 'ngx-loading';
// import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';

@NgModule({
  declarations: [
    AppComponent,
    AccessoriesComponent,
    MasterInputComponent,
    CartComponent,
    GpUiComponent,
    GpComponent,
    ProductPageComponent,
    GpInputComponent,
    GpInputDiameterComponent,
    ProductViewComponent,
    ExtraFiltersComponent,
    ProductComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    BrowserAnimationsModule,
    LoadingModule,
    // Ng4LoadingSpinnerModule,
    AlertModule.forRoot(),
    RouterModule.forRoot([
      {
        path: 'product-page',
        component: ProductPageComponent
      },
      {
        path: 'gp-finder',
        component: GpComponent
      },
      {
        path: '',
        component: ProductPageComponent
      }
    ]),
  ],
  providers: [ ProductsService, GprobeUiService, DataService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
