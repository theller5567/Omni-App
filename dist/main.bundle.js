webpackJsonp(["main"],{

/***/ "../../../../../src/$$_gendir lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "../../../../../src/$$_gendir lazy recursive";

/***/ }),

/***/ "../../../../../src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<cart #cart ></cart>\n<product #product ></product>\n<div class=\"container\">\n  <div class=\"nav\">\n    <button type=\"button\" class=\"btn btn-solid\" routerLink=\"/gp-finder\" routerLinkActive=\"active-link\"  placement=\"bottom\" ngbTooltip=\"Tooltip on bottom\">Generator probe Finder</button>\n    <button type=\"button\" class=\"btn btn-solid\" routerLink=\"/product-page\" routerLinkActive=\"active-link\">Product Accessories Finder</button>\n  </div>\n  <router-outlet></router-outlet>\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/app.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".form-control {\n  margin: 10px 0; }\n\n.input {\n  margin: 10px 0; }\n\nbutton {\n  width: 50%;\n  font-size: 1.2rem;\n  border-radius: 0; }\n  button.active-link {\n    background-color: #66D2E1;\n    cursor: default; }\n    button.active-link:hover, button.active-link:focus {\n      color: white; }\n\n.nav {\n  width: 100%;\n  font-size: 0; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_products_products_service__ = __webpack_require__("../../../../../src/app/services/products/products.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__product_accessories_finder_master_input_master_input_component__ = __webpack_require__("../../../../../src/app/product-accessories-finder/master-input/master-input.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var AppComponent = (function () {
    function AppComponent() {
        this.title = 'Having FUN with Angular';
    }
    AppComponent.prototype.ngOnInit = function () { };
    return AppComponent;
}());
AppComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'app-root',
        template: __webpack_require__("../../../../../src/app/app.component.html"),
        styles: [__webpack_require__("../../../../../src/app/app.component.scss")],
        providers: [__WEBPACK_IMPORTED_MODULE_1__services_products_products_service__["a" /* ProductsService */], __WEBPACK_IMPORTED_MODULE_2__product_accessories_finder_master_input_master_input_component__["a" /* MasterInputComponent */]]
    }),
    __metadata("design:paramtypes", [])
], AppComponent);

//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ "../../../../../src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__ = __webpack_require__("../../../platform-browser/@angular/platform-browser.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_platform_browser_animations__ = __webpack_require__("../../../platform-browser/@angular/platform-browser/animations.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_component__ = __webpack_require__("../../../../../src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__services_products_products_service__ = __webpack_require__("../../../../../src/app/services/products/products.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__services_gprobe_ui_gprobe_ui_service__ = __webpack_require__("../../../../../src/app/services/gprobe-ui/gprobe-ui.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__product_accessories_finder_accessories_accessories_component__ = __webpack_require__("../../../../../src/app/product-accessories-finder/accessories/accessories.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_forms__ = __webpack_require__("../../../forms/@angular/forms.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__product_accessories_finder_master_input_master_input_component__ = __webpack_require__("../../../../../src/app/product-accessories-finder/master-input/master-input.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__product_accessories_finder_cart_cart_component__ = __webpack_require__("../../../../../src/app/product-accessories-finder/cart/cart.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__generator_probe_finder_gp_ui_gp_ui_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/gp-ui/gp-ui.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__generator_probe_finder_gp_gp_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/gp/gp.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__product_accessories_finder_product_page_product_page_component__ = __webpack_require__("../../../../../src/app/product-accessories-finder/product-page/product-page.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__generator_probe_finder_gp_input_gp_input_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/gp-input/gp-input.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__generator_probe_finder_gp_input_diameter_gp_input_diameter_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/gp-input-diameter/gp-input-diameter.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__generator_probe_finder_product_view_product_view_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/product-view/product-view.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__generator_probe_finder_extra_filters_extra_filters_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/extra-filters/extra-filters.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__generator_probe_finder_product_view_product_product_component__ = __webpack_require__("../../../../../src/app/generator-probe-finder/product-view/product/product.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21_ngx_bootstrap__ = __webpack_require__("../../../../ngx-bootstrap/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_22_ngx_loading__ = __webpack_require__("../../../../ngx-loading/ngx-loading/ngx-loading.es5.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};























// import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_3__angular_core__["M" /* NgModule */])({
        declarations: [
            __WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */],
            __WEBPACK_IMPORTED_MODULE_8__product_accessories_finder_accessories_accessories_component__["a" /* AccessoriesComponent */],
            __WEBPACK_IMPORTED_MODULE_10__product_accessories_finder_master_input_master_input_component__["a" /* MasterInputComponent */],
            __WEBPACK_IMPORTED_MODULE_11__product_accessories_finder_cart_cart_component__["a" /* CartComponent */],
            __WEBPACK_IMPORTED_MODULE_12__generator_probe_finder_gp_ui_gp_ui_component__["a" /* GpUiComponent */],
            __WEBPACK_IMPORTED_MODULE_13__generator_probe_finder_gp_gp_component__["a" /* GpComponent */],
            __WEBPACK_IMPORTED_MODULE_15__product_accessories_finder_product_page_product_page_component__["a" /* ProductPageComponent */],
            __WEBPACK_IMPORTED_MODULE_16__generator_probe_finder_gp_input_gp_input_component__["a" /* GpInputComponent */],
            __WEBPACK_IMPORTED_MODULE_17__generator_probe_finder_gp_input_diameter_gp_input_diameter_component__["a" /* GpInputDiameterComponent */],
            __WEBPACK_IMPORTED_MODULE_18__generator_probe_finder_product_view_product_view_component__["a" /* ProductViewComponent */],
            __WEBPACK_IMPORTED_MODULE_19__generator_probe_finder_extra_filters_extra_filters_component__["a" /* ExtraFiltersComponent */],
            __WEBPACK_IMPORTED_MODULE_20__generator_probe_finder_product_view_product_product_component__["a" /* ProductComponent */]
        ],
        imports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__["a" /* BrowserModule */],
            __WEBPACK_IMPORTED_MODULE_5__angular_http__["c" /* HttpModule */],
            __WEBPACK_IMPORTED_MODULE_9__angular_forms__["a" /* FormsModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */],
            __WEBPACK_IMPORTED_MODULE_22_ngx_loading__["a" /* LoadingModule */],
            // Ng4LoadingSpinnerModule,
            __WEBPACK_IMPORTED_MODULE_21_ngx_bootstrap__["a" /* AlertModule */].forRoot(),
            __WEBPACK_IMPORTED_MODULE_14__angular_router__["a" /* RouterModule */].forRoot([
                {
                    path: 'product-page',
                    component: __WEBPACK_IMPORTED_MODULE_15__product_accessories_finder_product_page_product_page_component__["a" /* ProductPageComponent */]
                },
                {
                    path: 'gp-finder',
                    component: __WEBPACK_IMPORTED_MODULE_13__generator_probe_finder_gp_gp_component__["a" /* GpComponent */]
                },
                {
                    path: '',
                    component: __WEBPACK_IMPORTED_MODULE_15__product_accessories_finder_product_page_product_page_component__["a" /* ProductPageComponent */]
                }
            ]),
        ],
        providers: [__WEBPACK_IMPORTED_MODULE_6__services_products_products_service__["a" /* ProductsService */], __WEBPACK_IMPORTED_MODULE_7__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */], __WEBPACK_IMPORTED_MODULE_0__services_data_data_service__["a" /* DataService */]],
        bootstrap: [__WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/extra-filters/extra-filters.component.html":
/***/ (function(module, exports) {

module.exports = "<section *ngIf=\"showFilters && toggleFilter\" >\n  <hr>\n  <form  class=\"Filtered-inputs\">\n    <div *ngFor=\"let selecter of selecterArray\" class=\"form-check form-check-inline\">\n      <label class=\"form-check-label\">\n        <input class=\"form-check-input\" type=\"radio\" name=\"filter-radio\" (click)=\"onClick(selecter)\" [checked]=\"isChecked\" value=\"{{selecter}}\"> {{selecter}}\n      </label>\n    </div>\n    <div *ngIf=\"windowState\" class=\"filter window-filter\">\n      <div class=\"close-btn\"><i class=\"glyphicon glyphicon-remove\" (click)=\"closeFilter()\"></i></div>\n      <div *ngFor=\"let window of windowList\">\n        <div class=\"form-check form-check-inline\">\n          <label class=\"form-check-label\">\n            <input class=\"form-check-input\" type=\"radio\" name=\"filter-radio\" (click)=\"windowClick(window)\" value=\"{{window}}\"> {{window}}\n          </label>\n        </div>\n      </div>\n    </div>\n    <div *ngIf=\"typeState\" class=\"filter type-filter\">\n      <div class=\"close-btn\"><i class=\"glyphicon glyphicon-remove\" (click)=\"closeFilter()\"></i></div>\n      <div *ngFor=\"let type of typeList\">\n        <div class=\"form-check form-check-inline\">\n          <label class=\"form-check-label\">\n            <input class=\"form-check-input\" type=\"radio\" name=\"filter-radio\" (click)=\"typeClick(type)\" value=\"{{type}}\"> {{type}}\n          </label>\n        </div>\n      </div>\n    </div>\n    <div  *ngIf=\"lengthState\" class=\"filter length-filter\">\n      <div class=\"close-btn\"><i class=\"glyphicon glyphicon-remove\" (click)=\"closeFilter()\"></i></div>\n      <div>\n        <div class=\"form-group\">\n          <label for=\"Master-Products\">Select Length</label>\n          <select [ngModel]=\"lengthSelected\" name=\"length\" (ngModelChange)=\"lengthClick($event)\" class=\"form-control\" id=\"filter-length\">\n            <option *ngFor=\"let length of lengthList\" [ngValue]=\"length\">{{length}}</option>\n          </select>\n        </div>\n      </div>\n    </div>\n  </form>\n</section>\n  "

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/extra-filters/extra-filters.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".filter {\n  position: relative; }\n  .filter .close-btn {\n    cursor: pointer;\n    position: absolute;\n    top: 5px;\n    right: 5px; }\n\n.form-check-inline {\n  display: inline-block; }\n\n.form-check-inline + .form-check-inline {\n  margin-left: .75rem; }\n\n.toggle-filter {\n  cursor: pointer; }\n\n.filter {\n  background-color: #f5f5f5;\n  margin-top: 5px;\n  padding: 5px 10px;\n  border-radius: 4px; }\n\nhr {\n  margin-top: 10px;\n  margin-bottom: 10px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/extra-filters/extra-filters.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ExtraFiltersComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_gprobe_ui_gprobe_ui_service__ = __webpack_require__("../../../../../src/app/services/gprobe-ui/gprobe-ui.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_underscore__ = __webpack_require__("../../../../underscore/underscore.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_underscore___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_underscore__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ExtraFiltersComponent = (function () {
    function ExtraFiltersComponent(_service, data) {
        var _this = this;
        this._service = _service;
        this.data = data;
        this.selecterArray = ['window-size', 'type', 'length', 'none'];
        this.windowState = false;
        this.typeState = false;
        this.lengthState = false;
        this.toggleFilter = false;
        this.isChecked = false;
        this.showFilters = false;
        this.newList = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]();
        this.data.prodList.subscribe(function (product) {
            if (_this.filterState) {
                _this.filteredList = product;
                _this.startFiltering(_this.filteredList);
                if (!_this.filterhide) {
                    _this.closeFilter();
                    _this.removeFilters();
                }
            }
        });
        this.data.fState.subscribe(function (state) {
            _this.filterState = state;
        });
    }
    ExtraFiltersComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.showfilter.subscribe(function (value) { return _this.showFilter = value; });
    };
    ExtraFiltersComponent.prototype.startFiltering = function (list) {
        console.log('start filtering', list);
        this.selecterArray = [];
        var lengthList = [];
        var windowList = [];
        var typeList = [];
        list.forEach(function (product) {
            if (product.length) {
                lengthList.push(product.length);
            }
            if (product.window_size) {
                windowList.push(product.window_size);
            }
            if (product.type) {
                typeList.push(product.type);
            }
        });
        lengthList = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](lengthList);
        windowList = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](windowList);
        typeList = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](typeList);
        console.log('lengthList:', lengthList);
        console.log('windowList:', windowList);
        console.log('typeList:', typeList);
        if (this.allowFilter(lengthList, list)) {
            this.selecterArray.push('length');
        }
        if (this.allowFilter(windowList, list)) {
            this.selecterArray.push('window-size');
        }
        if (this.allowFilter(typeList, list)) {
            this.selecterArray.push('type');
        }
        if (!this.allowFilter(lengthList, list) && !this.allowFilter(windowList, list) && !this.allowFilter(typeList, list)) {
            console.log('no filters needed');
            this.selecterArray = [];
            this.showFilters = false;
            this.toggleFilter = false;
        }
        else {
            this.showFilters = true;
            this.toggleFilter = true;
            this.selecterArray.push('none');
        }
    };
    ExtraFiltersComponent.prototype.allowFilter = function (filterlist, list) {
        if (filterlist.length > 1) {
            if ((list.length - filterlist.length) > 2) {
                return true;
            }
            else {
                return false;
            }
        }
    };
    ExtraFiltersComponent.prototype.toggleFilters = function () {
        this.toggleFilter = !this.toggleFilter;
    };
    ExtraFiltersComponent.prototype.onClick = function (value) {
        if (this.filterhide) {
            this.hideFilters(value);
        }
        else {
            this.closeFilter();
        }
        this.hideFilters(value);
    };
    ExtraFiltersComponent.prototype.closeFilter = function () {
        this.hideFilters('none');
    };
    ExtraFiltersComponent.prototype.windowClick = function (value) {
        var list = [];
        this.filteredList.forEach(function (product) {
            if (product.window_size === value) {
                list.push(product);
            }
        });
        this.data.productListChanged(list);
    };
    ExtraFiltersComponent.prototype.typeClick = function (value) {
        var list = [];
        this.filteredList.forEach(function (product) {
            if (product.type === value) {
                list.push(product);
            }
        });
        this.data.productListChanged(list);
    };
    ExtraFiltersComponent.prototype.lengthClick = function (value) {
        var list = [];
        this.filteredList.forEach(function (product) {
            if (product.length === value) {
                list.push(product);
            }
        });
        this.data.productListChanged(list);
    };
    ExtraFiltersComponent.prototype.removeFilters = function () {
        this.isChecked = !this.isChecked;
    };
    ExtraFiltersComponent.prototype.hideFilters = function (filter) {
        this.filterhide = false;
        this.data.filterStateChanged(false);
        var filteredListCat = [];
        var filteredList = [];
        var list = this.filteredList;
        switch (filter) {
            case 'window-size':
                list.forEach(function (product) {
                    if (product.window_size) {
                        filteredListCat.push(product.window_size);
                        filteredList.push(product);
                    }
                });
                this.windowList = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](filteredListCat);
                this.filteredList = filteredList;
                this.windowState = true;
                this.typeState = false;
                this.lengthState = false;
                break;
            case 'type':
                list.forEach(function (product) {
                    if (product.type) {
                        filteredListCat.push(product.type);
                        filteredList.push(product);
                    }
                });
                this.typeList = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](filteredListCat);
                this.filteredList = filteredList;
                this.windowState = false;
                this.typeState = true;
                this.lengthState = false;
                break;
            case 'length':
                list.forEach(function (product) {
                    if (product.length) {
                        filteredListCat.push(product.length);
                        filteredList.push(product);
                    }
                });
                this.lengthList = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](filteredListCat);
                this.filteredList = filteredList;
                this.windowState = false;
                this.typeState = false;
                this.lengthState = true;
                break;
            case 'none':
                this.data.productListChanged(this.filteredList);
                this.windowState = false;
                this.typeState = false;
                this.lengthState = false;
                this.filterhide = true;
                break;
            default:
                this.windowState = false;
                this.typeState = false;
                this.lengthState = false;
                break;
        }
    };
    return ExtraFiltersComponent;
}());
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Object)
], ExtraFiltersComponent.prototype, "diameterProduct", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Output */])(),
    __metadata("design:type", typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]) === "function" && _a || Object)
], ExtraFiltersComponent.prototype, "newList", void 0);
ExtraFiltersComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'extraFilters',
        template: __webpack_require__("../../../../../src/app/generator-probe-finder/extra-filters/extra-filters.component.html"),
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/extra-filters/extra-filters.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */]) === "function" && _b || Object, typeof (_c = typeof __WEBPACK_IMPORTED_MODULE_2__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__services_data_data_service__["a" /* DataService */]) === "function" && _c || Object])
], ExtraFiltersComponent);

var _a, _b, _c;
//# sourceMappingURL=extra-filters.component.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-input-diameter/gp-input-diameter.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".pr-range {\n  background-color: #f5f5f5;\n  padding: 5px 10px;\n  border-radius: 4px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-input-diameter/gp-input-diameter.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GpInputDiameterComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_gprobe_ui_gprobe_ui_service__ = __webpack_require__("../../../../../src/app/services/gprobe-ui/gprobe-ui.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_underscore__ = __webpack_require__("../../../../underscore/underscore.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_underscore___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_underscore__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var GpInputDiameterComponent = (function () {
    function GpInputDiameterComponent(_service, data) {
        this._service = _service;
        this.data = data;
        this.hasChangedagain = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]();
        this.diameterArray = [];
        this.show = false;
        this.prRange = '';
    }
    GpInputDiameterComponent.prototype.toggleView = function () {
        var bln = this.show ? true : false;
        return bln;
    };
    GpInputDiameterComponent.prototype.ngOnChanges = function (changes) {
        var _this = this;
        if (changes) {
            if (changes['selectedValue']) {
                this.selectedValue = changes.selectedValue.currentValue;
                this.diameterArray = ['Select a Diameter'];
                this.selectedDiameter = this.diameterArray[0];
                if (this.selectedValue) {
                    this.diameterArray = [];
                    this.testing.forEach(function (item) {
                        if (item.master === _this.selectedValue) {
                            item.related.forEach(function (product) {
                                _this.diameterArray.push(product.diameter);
                            });
                        }
                    });
                    this.diameterArray.pop();
                    this.diameterArray = __WEBPACK_IMPORTED_MODULE_3_underscore__["uniq"](this.diameterArray);
                    this.show = true;
                }
            }
            if (changes['testing']) {
                this.testing = [];
                this.testing = changes.testing.currentValue;
            }
        }
    };
    GpInputDiameterComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.showfilter.subscribe(function (value) { return _this.showFilters = value; });
    };
    GpInputDiameterComponent.prototype.change = function (value) {
        this.processingRange(value);
        if (this.selectedValue) {
            var obj = {
                selectedProduct: this.selectedValue,
                diameterSelected: value
            };
            this.diameterProduct = obj;
            this.data.hideFilter(true);
        }
    };
    GpInputDiameterComponent.prototype.processingRange = function (value) {
        switch (value) {
            case '5 mm':
                this.prRange = '0.2mL - 5mL';
                break;
            case '7 mm':
                this.prRange = '0.25mL - 30mL';
                break;
            case '10 mm':
                this.prRange = '1.5mL - 100mL';
                break;
            case '20 mm':
                this.prRange = '50mL - 2L';
                break;
            case '30 mm':
                this.prRange = '75mL - 10L';
                break;
            case 'none':
                this.prRange = '';
                break;
            default:
        }
    };
    GpInputDiameterComponent.prototype.sortDiamters = function (list) {
        var numArr = [];
        numArr = list.map(function (item, index, array) {
            item = parseInt(item.split(' mm')[0], 10);
            return item;
        });
        numArr = __WEBPACK_IMPORTED_MODULE_3_underscore__["sortBy"](numArr, function (num) { return Math.min(num); });
        numArr = numArr.map(function (item, index, array) {
            return item + ' mm';
        });
        return numArr;
    };
    return GpInputDiameterComponent;
}());
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Output */])(),
    __metadata("design:type", typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]) === "function" && _a || Object)
], GpInputDiameterComponent.prototype, "hasChangedagain", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Object)
], GpInputDiameterComponent.prototype, "selectedValue", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Object)
], GpInputDiameterComponent.prototype, "testing", void 0);
GpInputDiameterComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'gpInputDiameter',
        template: "\n    <form *ngIf=\"this.show\">\n      <div class=\"form-group\">\n        <label for=\"Master-Products\">Select Diameter</label>\n        <select [ngModel]=\"selectedDiameter\" name=\"diameter\" (ngModelChange)=\"change($event)\" class=\"form-control\" id=\"Master-Products\">\n          <option *ngFor=\"let diameter of diameterArray\" [ngValue]=\"diameter\">{{diameter}}</option>\n        </select>\n        <p *ngIf=\"prRange !== '' && showFilters\" class=\"pr-range\"><em><strong>Processing Range: {{prRange}}</strong></em></p>\n      </div>\n    </form>\n    <productView [testing]=\"testing\" [diameterProduct]=\"diameterProduct\" [selectedValue]=\"selectedValue\"  #productView></productView>\n  ",
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/gp-input-diameter/gp-input-diameter.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */]) === "function" && _b || Object, typeof (_c = typeof __WEBPACK_IMPORTED_MODULE_2__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__services_data_data_service__["a" /* DataService */]) === "function" && _c || Object])
], GpInputDiameterComponent);

var _a, _b, _c;
//# sourceMappingURL=gp-input-diameter.component.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-input/gp-input.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-input/gp-input.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GpInputComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var GpInputComponent = (function () {
    function GpInputComponent(data) {
        this.data = data;
        this.catName = 'Generator Probes';
        this.hasChanged = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]();
    }
    GpInputComponent.prototype.change = function (value) {
        this.selectedValue = value;
    };
    GpInputComponent.prototype.ngOnChanges = function (changes) {
        if (changes['testing']) {
            if (changes['testing'].currentValue) {
                this.selectedValue = this.testing[0].master;
            }
        }
    };
    GpInputComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.cart.subscribe(function (cart) { return _this.cart = cart; });
        this.data.showfilter.subscribe(function (value) { return _this.showFilters = value; });
    };
    return GpInputComponent;
}());
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Output */])(),
    __metadata("design:type", typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]) === "function" && _a || Object)
], GpInputComponent.prototype, "hasChanged", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Array)
], GpInputComponent.prototype, "testing", void 0);
GpInputComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'gpInput',
        template: "\n    <form>\n      <div class=\"form-group\">\n        <label for=\"Master-Products\">Select Product</label>\n        <select [ngModel]=\"selectedValue\" name=\"product\" (ngModelChange)=\"change($event)\" class=\"form-control\" id=\"Master-Products\">\n          <option *ngFor=\"let product of testing\" [ngValue]=\"product.master\">{{product.master}}</option>\n        </select>\n      </div>\n    </form>\n    <gpInputDiameter [testing]=\"testing\" [selectedValue]=\"selectedValue\"></gpInputDiameter>\n  ",
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/gp-input/gp-input.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */]) === "function" && _b || Object])
], GpInputComponent);

var _a, _b;
//# sourceMappingURL=gp-input.component.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-ui/gp-ui.component.html":
/***/ (function(module, exports) {

module.exports = "<ngx-loading [show]=\"loading\" [config]=\"{ backdropBorderRadius: '14px' }\"></ngx-loading>\n<gpInput [testing]=\"testing\" (hasChanged)=\"gpInputDiameter.hasChanged($event)\" (hasChanged)=\"productView.hasChanged($event)\"></gpInput>\n\n\n\n"

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-ui/gp-ui.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp-ui/gp-ui.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GpUiComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_gprobe_ui_gprobe_ui_service__ = __webpack_require__("../../../../../src/app/services/gprobe-ui/gprobe-ui.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var GpUiComponent = (function () {
    function GpUiComponent(_service, data) {
        this._service = _service;
        this.data = data;
        this.showFilters = false;
        this.catName = 'Generator Probes';
        this.loading = false;
        this.hasChanged = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]();
        this.getProducts();
    }
    GpUiComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.showfilter.subscribe(function (value) { return _this.showFilters = value; });
    };
    GpUiComponent.prototype.getProducts = function () {
        var _this = this;
        this.loading = true;
        this._service.getGeneratprobes('Generator Probes')
            .subscribe(function (response) {
            _this.testing = response;
            _this.loading = false;
        });
    };
    GpUiComponent.prototype.change = function (value) {
        this.hasChanged.emit(value);
        this.data.hideFilter(false);
    };
    GpUiComponent.prototype.selectObject = function (categories) {
        var newArr = [];
        var count = 0;
        categories.forEach(function (product) {
            var obj = {
                id: count += 1,
                name: product.product_name
            };
            newArr.push(product.product_name);
        });
        return newArr;
    };
    return GpUiComponent;
}());
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Output */])(),
    __metadata("design:type", typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]) === "function" && _a || Object)
], GpUiComponent.prototype, "hasChanged", void 0);
GpUiComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'gp-ui',
        template: __webpack_require__("../../../../../src/app/generator-probe-finder/gp-ui/gp-ui.component.html"),
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/gp-ui/gp-ui.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */]) === "function" && _b || Object, typeof (_c = typeof __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */]) === "function" && _c || Object])
], GpUiComponent);

var _a, _b, _c;
//# sourceMappingURL=gp-ui.component.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp/gp.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n  <div class=\"tab-pane\" id=\"gp-finder\">\n      <h1>Generator Probe Finder</h1>\n      <gp-ui></gp-ui>\n  </div>\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp/gp.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/gp/gp.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GpComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var GpComponent = (function () {
    function GpComponent(data) {
        this.data = data;
    }
    GpComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.cart.subscribe(function (cart) { return _this.cart = cart; });
    };
    return GpComponent;
}());
GpComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["o" /* Component */])({
        selector: 'app-gp',
        template: __webpack_require__("../../../../../src/app/generator-probe-finder/gp/gp.component.html"),
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/gp/gp.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__services_data_data_service__["a" /* DataService */]) === "function" && _a || Object])
], GpComponent);

var _a;
//# sourceMappingURL=gp.component.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/product-view/product-view.component.html":
/***/ (function(module, exports) {

module.exports = "<extraFilters #extraFilters (newList)=\"productView.notify(value)\"></extraFilters>\n<ul class=\"items col col-md-12\"  *ngIf=\"showProducts\">\n    <li class=\"col col-xs-12 col-sm-12 col-md-4\" *ngFor=\"let product of products\">\n        <div class=\"item\">\n        <a href=\"\" class=\"product-name\">{{product.product_name}}</a>\n        <div class=\"image-and-info col col-xs-8 col-sm-8 col-md-12\">\n            <div class=\"product-thumb\">\n            <img src=\"../../assets/img-filler.png\" alt=\"{{product.product_name}}\">\n            </div>\n            <div class=\"info\">\n            <div class=\"sku\">SKU: {{product.sku}}</div>\n            <div class=\"price\">Price: {{product.price | currency:'USD':true:'1.2-2'}}</div>\n            </div>\n        </div>\n        <div class=\"product-col col col-xs-4 col-sm-4 col-md-12\">\n            <div class=\"btn-group\" role=\"group\" aria-label=\"Basic example\">\n            <button type=\"button\" class=\"btn btn-solid\" (click)=\"viewProduct(product)\">View Product</button>\n            <button type=\"button\" class=\"btn btn-solid add-to-cart\" (click)=\"addToCart($event)\">Add to Cart</button>\n            </div>\n        </div>\n        </div>\n    </li>\n</ul>\n"

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/product-view/product-view.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* COLOR VARIABLES */\nul.items {\n  margin: 5px 0;\n  padding: 0;\n  border-top: 1px solid #ffffff;\n  display: inline-block;\n  width: 100%; }\n  ul.items li {\n    display: inline-block;\n    overflow: hidden;\n    vertical-align: bottom;\n    float: none;\n    padding: 10px;\n    font-size: 1em;\n    border-bottom: 1px solid #ffffff; }\n    ul.items li .item {\n      position: relative;\n      box-sizing: border-box;\n      padding: 0 10px;\n      overflow: hidden;\n      text-align: center;\n      padding-bottom: 5%; }\n      @media only screen and (max-width: 992px) {\n        ul.items li .item {\n          text-align: left;\n          padding: 0; } }\n      ul.items li .item .col {\n        padding: 0; }\n      ul.items li .item .image-and-info {\n        display: inline-block; }\n      ul.items li .item .product-thumb {\n        display: block;\n        max-width: 100px;\n        margin: 0 auto; }\n        @media only screen and (max-width: 992px) {\n          ul.items li .item .product-thumb {\n            margin: 0;\n            display: inline-block;\n            vertical-align: top; } }\n      @media only screen and (max-width: 992px) {\n        ul.items li .item .info {\n          display: inline-block;\n          vertical-align: top;\n          padding-left: 10px; } }\n      ul.items li .item a.product-name {\n        margin: 0 0 10px 0;\n        padding: 0;\n        display: block;\n        font-size: 1em;\n        text-decoration: underline; }\n      ul.items li .item .options span {\n        padding: 1px 3px;\n        margin: 0 2px;\n        background: #78777a;\n        border-radius: 4px;\n        display: inline-block;\n        color: #ffffff;\n        font-family: myriadpro_light;\n        font-size: 12px; }\n      ul.items li .item .qty {\n        display: block; }\n        ul.items li .item .qty input {\n          width: 20px;\n          margin: 0 0 0 10px;\n          line-height: 0.8em;\n          border: none;\n          font-size: 0.6em;\n          text-align: center;\n          border-radius: 5px; }\n      ul.items li .item .product-col {\n        margin-top: 5px; }\n      ul.items li .item .btn-group {\n        display: block;\n        width: 100%;\n        position: relative;\n        margin-top: 0; }\n        ul.items li .item .btn-group .btn {\n          font-size: 1em;\n          font-size: 0.8vw; }\n          @media only screen and (max-width: 992px) {\n            ul.items li .item .btn-group .btn {\n              font-size: 1em;\n              font-size: 2vw;\n              width: 100%;\n              padding: 10px 12px; } }\n          @media only screen and (max-width: 500px) {\n            ul.items li .item .btn-group .btn {\n              font-size: 3vw; } }\n          ul.items li .item .btn-group .btn:first-child {\n            border-right: 1px solid #ffffff;\n            width: 50%; }\n            @media only screen and (max-width: 992px) {\n              ul.items li .item .btn-group .btn:first-child {\n                width: 100%;\n                border: 1px solid #4eb4d0;\n                border-radius: 4px; } }\n          ul.items li .item .btn-group .btn:last-child {\n            border-left: 1px solid rgba(255, 255, 255, 0.4);\n            width: 50%; }\n            @media only screen and (max-width: 992px) {\n              ul.items li .item .btn-group .btn:last-child {\n                width: 100%;\n                border: 1px solid #4eb4d0;\n                border-radius: 4px;\n                margin-top: 5px; } }\n  @media (max-width: 750px) {\n    ul.items {\n      text-align: center; }\n      ul.items li .item .product-thumb {\n        max-width: 100%;\n        float: none; } }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/product-view/product-view.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProductViewComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_animations__ = __webpack_require__("../../../animations/@angular/animations.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_gprobe_ui_gprobe_ui_service__ = __webpack_require__("../../../../../src/app/services/gprobe-ui/gprobe-ui.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ProductViewComponent = (function () {
    function ProductViewComponent(_service, data) {
        this._service = _service;
        this.data = data;
        this.showProducts = false;
        this.filterState = true;
        this.getProducts1 = function () {
            var _this = this;
            var selectProdArr = [];
            var coco = [];
            this.testing.forEach(function (item) {
                if (item.master === _this.selectedProduct) {
                    selectProdArr = item.related;
                }
            });
            for (var i = selectProdArr.length; i--;) {
                if (selectProdArr[i].diameter === this.diameterSelected) {
                    coco.push(selectProdArr[i]);
                }
            }
            return coco;
        };
    }
    ProductViewComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.cart.subscribe(function (cart) { return _this.cart = cart; });
        this.data.currentProduct.subscribe(function (product) { return _this.productInfo = product; });
        this.data.prodList.subscribe(function (product) {
            _this.products = product;
        });
        this.data.fState.subscribe(function (state) {
            _this.filterState = state;
        });
    };
    ProductViewComponent.prototype.ngOnChanges = function (changes) {
        if (changes) {
            if (changes['testing']) {
                this.testing = changes.testing.currentValue;
            }
            if (changes['selectedValue']) {
                this.products = [];
                this.diameterSelected = undefined;
                this.showProducts = false;
            }
            if (this.testing) {
                if (changes['diameterProduct']) {
                    if (changes.diameterProduct.currentValue !== undefined) {
                        this.diameterSelected = changes.diameterProduct.currentValue.diameterSelected;
                        this.selectedProduct = changes.diameterProduct.currentValue.selectedProduct;
                        this.data.filterStateChanged(true);
                        this.products = this.getProducts1();
                        this.showProducts = true;
                        console.log('DIAMETER CHANGED, change filter state');
                        this.data.productListChanged(this.products);
                    }
                }
            }
        }
    };
    ProductViewComponent.prototype.addToCart = function ($event) {
        var _this = this;
        var item = $event.target.parentElement.parentElement.parentElement.parentElement.firstChild.nextSibling.childNodes[1].text;
        var product = [];
        this.products.forEach(function (element) {
            if (element.product_name === item) {
                product.push(element);
                _this.data.changCart(product[0]);
            }
        });
    };
    ProductViewComponent.prototype.viewProduct = function (value) {
        this.data.changeProduct(value);
    };
    return ProductViewComponent;
}());
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Object)
], ProductViewComponent.prototype, "diameterProduct", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Object)
], ProductViewComponent.prototype, "testing", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Object)
], ProductViewComponent.prototype, "selectedValue", void 0);
ProductViewComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'productView',
        template: __webpack_require__("../../../../../src/app/generator-probe-finder/product-view/product-view.component.html"),
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/product-view/product-view.component.scss")],
        animations: [
            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["l" /* trigger */])('fade', [
                Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["k" /* transition */])('void => *', [
                    Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 1 }),
                    Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["e" /* animate */])(500)
                ])
            ])
        ]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__services_gprobe_ui_gprobe_ui_service__["a" /* GprobeUiService */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_3__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3__services_data_data_service__["a" /* DataService */]) === "function" && _b || Object])
], ProductViewComponent);

var _a, _b;
//# sourceMappingURL=product-view.component.js.map

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/product-view/product/product.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/generator-probe-finder/product-view/product/product.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProductComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ProductComponent = (function () {
    function ProductComponent(data) {
        this.data = data;
        this.showProductView = false;
    }
    ProductComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.currentProduct.subscribe(function (product) {
            if (product.length < 1) {
                return;
            }
            else {
                _this.showProductView = true;
                _this.productInfo = product;
            }
        });
    };
    ProductComponent.prototype.close = function () {
        this.showProductView = false;
        this.productInfo = [];
    };
    return ProductComponent;
}());
ProductComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'product',
        template: "\n    <div *ngIf=\"showProductView\" id=\"product-module\" [ngClass]=\"{ 'show-product': showProductView, 'hide-product': !showProductView }\">\n      <h4>{{productInfo.product_name}}</h4>\n        <p><strong>SKU:</strong> {{productInfo.sku}}</p>\n        <p><strong>Description:</strong> {{productInfo.description}}</p>\n        <p><strong>Category:</strong> {{productInfo.cat_name}}</p>\n        <p><strong>Diameter:</strong> {{productInfo.diameter}}</p>\n        <p><strong>Length:</strong> {{productInfo.length}}</p>\n        <p><strong>Window-Size:</strong> {{productInfo.window_size}}</p>\n        <p><strong>Price:</strong> {{productInfo.price | currency:'USD':true:'1.2-2'}}</p>\n        <div class=\"remove\" (click)=\"close()\"><i class=\"glyphicon glyphicon-remove\"></i> </div>\n    </div>\n  ",
        styles: [__webpack_require__("../../../../../src/app/generator-probe-finder/product-view/product/product.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */]) === "function" && _a || Object])
], ProductComponent);

var _a;
//# sourceMappingURL=product.component.js.map

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/accessories/accessories.component.html":
/***/ (function(module, exports) {

module.exports = "<div role=\"tabpanel\" class=\"tab-pane\" id=\"accessories\">\n  <h1>Product Accessories Finder</h1>\n  <!-- <app-spinner></app-spinner> -->\n  <ngx-loading [show]=\"loading\" [config]=\"{ backdropBorderRadius: '14px' }\"></ngx-loading>\n  <master-input [powers]=\"powers\" (hasChanged)=\"hasChanged($event)\"></master-input>\n  <div class=\"accessories-wrapper\">\n    <div class=\"category-list-wrapper\" [@fade]=\"categories.length\">\n      <div class=\"cat-column\" [ngClass]=\"{ 'show-cat': !showSubCat, 'hide-cat': showSubCat }\">\n      <div class=\"desktop-list btn-group-vertical show-cat\" >\n            <ng-template ngFor let-category [ngForOf]=\"categories\"> \n                <button class=\"list-group-item list-group-item-action cat-btn\" *ngIf=\"category !=='Select a Category'\" (click)=\"getCatName(category)\" ><span>{{category}}</span><i class=\"glyphicon glyphicon-chevron-right\"></i>\n                  </button>\n            </ng-template>\n        </div>\n        <div class=\"mobile-select show-cat\">\n          <select class=\"form-control mobile-select show-cat\" [ngModel]=\"selectedCat\" (ngModelChange)=\"change($event)\" name=\"category\" id=\"cat-column\" placeholder=\"Select a Category\">\n            <option [ngValue]=\"category\" class=\"cat-btn\" *ngFor='let category of categories'>{{category}}</option>\n          </select>\n        </div>\n      </div>\n      <div class=\"subcat-column\" [ngClass]=\"{ 'show-subcat': showSubCat, 'hide-cat': !showSubCat }\" >\n        <div class=\"desktop-list btn-group-vertical hide-cat\">\n          <button class=\"list-group-item list-group-item-action cat-btn\" *ngFor=\"let sub of subProducts\" (click)=\"getSubCatName(sub)\" ><span>{{sub}}</span><i class=\"glyphicon glyphicon-chevron-right\"></i></button>\n          <button class=\"list-group-item list-group-item-action subcat-btn back-to-cat\" (click)=\"backToCat()\">Back to Categories<i class=\"glyphicon glyphicon-chevron-left\"></i></button>\n        </div>\n        <div class=\"mobile-select hide-cat\">\n          <select class=\"form-control\" [ngModel]=\"selectedSubCat\" (ngModelChange)=\"changeSub($event)\" name=\"sub-category\" id=\"sub-cat-column\" placeholder=\"Select a Sub-Category\">\n            <option value=\"\">Select Sub-Category</option>\n            <option class=\"cat-btn\" *ngFor=\"let sub of subProducts\">{{sub}}</option>\n          </select>\n        </div>\n      </div>\n    </div>\n    <div class=\"category-banners\" *ngIf=\"catbanners\">\n      <img [src]=\"masterProductBanner\" alt=\"{{masterProductBanner}}\">\n    </div>\n    <div class=\"product-list-accessories\">\n      <ol class=\"breadcrumb\" *ngIf=\"hasProducts() || showSubCat\">\n        <li class=\"breadcrumb-item bc-link\" (click)=\"backToCat()\" *ngIf=\"showSubCat\">Back to Categories</li>\n        <li class=\"breadcrumb-item\" *ngIf=\"category_name\">{{category_name}}</li>\n        <li class=\"breadcrumb-item\" *ngIf=\"subCategory_name\">{{subCategory_name}}</li>\n      </ol>\n      <ul class=\"items col col-md-12\"  [@productsIntro]=\"animationState\">\n        <li class=\"col col-xs-12 col-sm-12 col-md-4\" *ngFor=\"let product of products\">\n          <div class=\"item\">\n            <a href=\"\" class=\"product-name\">{{product.product_name}}</a>\n            <div class=\"image-and-info col col-xs-8 col-sm-8 col-md-12\">\n              <div class=\"product-thumb\">\n                <img src=\"../../assets/img-filler.png\" alt=\"{{product.product_name}}\">\n              </div>\n              <div class=\"info\">\n                <div class=\"sku\">SKU: {{product.sku}}</div>\n                <div class=\"price\">Price: {{product.price | currency:'USD':true:'1.2-2'}}</div>\n              </div>\n            </div>\n            <div class=\"product-col col col-xs-4 col-sm-4 col-md-12\">\n              <div class=\"btn-group\" role=\"group\" aria-label=\"Basic example\">\n                <button type=\"button\" class=\"btn btn-solid\" (click)=\"viewProduct(product)\">View Product</button>\n                <button type=\"button\" class=\"btn btn-solid add-to-cart\" (click)=\"addToCart($event)\">Add to Cart</button>\n              </div>\n            </div>\n          </div>\n        </li>\n      </ul>\n    </div>\n  </div>\n</div>\n\n"

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/accessories/accessories.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* COLOR VARIABLES */\nul.items {\n  margin: 5px 0;\n  padding: 0;\n  border-top: 1px solid #ffffff;\n  display: inline-block;\n  width: 100%; }\n  ul.items li {\n    display: inline-block;\n    overflow: hidden;\n    vertical-align: bottom;\n    float: none;\n    padding: 10px;\n    font-size: 1em;\n    border-bottom: 1px solid #ffffff; }\n    ul.items li .item {\n      position: relative;\n      box-sizing: border-box;\n      padding: 0 10px;\n      overflow: hidden;\n      text-align: center;\n      padding-bottom: 5%; }\n      @media only screen and (max-width: 992px) {\n        ul.items li .item {\n          text-align: left;\n          padding: 0; } }\n      ul.items li .item .col {\n        padding: 0; }\n      ul.items li .item .image-and-info {\n        display: inline-block; }\n      ul.items li .item .product-thumb {\n        display: block;\n        max-width: 100px;\n        margin: 0 auto; }\n        @media only screen and (max-width: 992px) {\n          ul.items li .item .product-thumb {\n            margin: 0;\n            display: inline-block;\n            vertical-align: top; } }\n      @media only screen and (max-width: 992px) {\n        ul.items li .item .info {\n          display: inline-block;\n          vertical-align: top;\n          padding-left: 10px; } }\n      ul.items li .item a.product-name {\n        margin: 0 0 10px 0;\n        padding: 0;\n        display: block;\n        font-size: 1em;\n        text-decoration: underline; }\n      ul.items li .item .options span {\n        padding: 1px 3px;\n        margin: 0 2px;\n        background: #78777a;\n        border-radius: 4px;\n        display: inline-block;\n        color: #ffffff;\n        font-family: myriadpro_light;\n        font-size: 12px; }\n      ul.items li .item .qty {\n        display: block; }\n        ul.items li .item .qty input {\n          width: 20px;\n          margin: 0 0 0 10px;\n          line-height: 0.8em;\n          border: none;\n          font-size: 0.6em;\n          text-align: center;\n          border-radius: 5px; }\n      ul.items li .item .product-col {\n        margin-top: 5px; }\n      ul.items li .item .btn-group {\n        display: block;\n        width: 100%;\n        position: relative;\n        margin-top: 0; }\n        ul.items li .item .btn-group .btn {\n          font-size: 1em;\n          font-size: 0.8vw; }\n          @media only screen and (max-width: 992px) {\n            ul.items li .item .btn-group .btn {\n              font-size: 1em;\n              font-size: 2vw;\n              width: 100%;\n              padding: 10px 12px; } }\n          @media only screen and (max-width: 500px) {\n            ul.items li .item .btn-group .btn {\n              font-size: 3vw; } }\n          ul.items li .item .btn-group .btn:first-child {\n            border-right: 1px solid #ffffff;\n            width: 50%; }\n            @media only screen and (max-width: 992px) {\n              ul.items li .item .btn-group .btn:first-child {\n                width: 100%;\n                border: 1px solid #4eb4d0;\n                border-radius: 4px; } }\n          ul.items li .item .btn-group .btn:last-child {\n            border-left: 1px solid rgba(255, 255, 255, 0.4);\n            width: 50%; }\n            @media only screen and (max-width: 992px) {\n              ul.items li .item .btn-group .btn:last-child {\n                width: 100%;\n                border: 1px solid #4eb4d0;\n                border-radius: 4px;\n                margin-top: 5px; } }\n  @media (max-width: 750px) {\n    ul.items {\n      text-align: center; }\n      ul.items li .item .product-thumb {\n        max-width: 100%;\n        float: none; } }\n\n.accessories-wrapper {\n  position: relative;\n  font-size: 0; }\n  .accessories-wrapper ol {\n    font-size: 16px; }\n\n.category-list-wrapper {\n  position: relative;\n  display: inline-block;\n  font-size: 14px;\n  width: 25%;\n  overflow: hidden;\n  min-height: 300px; }\n  .category-list-wrapper .mobile-select {\n    display: none;\n    width: 100%; }\n    .category-list-wrapper .mobile-select select {\n      width: 100%;\n      padding: 5px;\n      margin: 10px 0; }\n      .category-list-wrapper .mobile-select select.focused {\n        border-color: #66afe9;\n        box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6); }\n  @media only screen and (max-width: 992px) {\n    .category-list-wrapper {\n      display: block;\n      width: 100%;\n      min-height: 60px; }\n      .category-list-wrapper .desktop-list {\n        display: none; }\n      .category-list-wrapper .mobile-select {\n        display: block;\n        width: 100%; }\n        .category-list-wrapper .mobile-select select {\n          font-size: 16px; } }\n  .category-list-wrapper button.list-group-item:focus {\n    outline: none; }\n  .category-list-wrapper .cat-column {\n    position: relative;\n    width: 100%;\n    transition: all 300ms; }\n    @media only screen and (max-width: 992px) {\n      .category-list-wrapper .cat-column {\n        display: inline-block;\n        vertical-align: top; } }\n    .category-list-wrapper .cat-column.show-cat {\n      left: 0;\n      opacity: 1; }\n    .category-list-wrapper .cat-column.hide-cat {\n      left: 100%;\n      opacity: 0; }\n  .category-list-wrapper .subcat-column {\n    position: absolute;\n    top: 0;\n    left: 100%;\n    z-index: 1;\n    width: 100%;\n    transition: all 300ms; }\n    @media only screen and (max-width: 992px) {\n      .category-list-wrapper .subcat-column {\n        display: inline-block;\n        vertical-align: top; } }\n    .category-list-wrapper .subcat-column.show-subcat {\n      left: 0;\n      opacity: 1; }\n    .category-list-wrapper .subcat-column.hide-subcat {\n      left: 100%;\n      opacity: 0; }\n  .category-list-wrapper .btn-group-vertical {\n    width: 100%; }\n    .category-list-wrapper .btn-group-vertical .list-group-item i {\n      float: right; }\n    .category-list-wrapper .btn-group-vertical .list-group-item.back-to-cat {\n      background-color: #19468d;\n      color: #ffffff; }\n      .category-list-wrapper .btn-group-vertical .list-group-item.back-to-cat i {\n        color: #ffffff; }\n\n.product-list-accessories {\n  font-size: 14px;\n  position: relative;\n  display: inline-block;\n  vertical-align: top;\n  left: 3%;\n  width: 72%; }\n  @media only screen and (max-width: 992px) {\n    .product-list-accessories {\n      display: block;\n      width: 100%;\n      min-height: auto;\n      left: 0; } }\n  .product-list-accessories .loading {\n    position: absolute;\n    width: 100%;\n    top: 50%;\n    display: none; }\n  .product-list-accessories ol.breadcrumb {\n    position: relative;\n    margin-bottom: 0; }\n    .product-list-accessories ol.breadcrumb li a {\n      padding: 5px 0; }\n    .product-list-accessories ol.breadcrumb li.bc-link {\n      color: #4eb4d0;\n      cursor: pointer; }\n      @media only screen and (max-width: 500px) {\n        .product-list-accessories ol.breadcrumb li.bc-link {\n          display: block;\n          background-color: #4eb4d0;\n          color: white;\n          padding: 10px;\n          border-radius: 4px;\n          cursor: pointer;\n          text-align: center; } }\n  .product-list-accessories .bc-back-button {\n    position: absolute;\n    top: 50%;\n    right: 5px;\n    -webkit-transform: translateY(-50%);\n            transform: translateY(-50%);\n    color: #78777a;\n    cursor: pointer; }\n\n.category-banners {\n  font-size: 14px;\n  position: relative;\n  display: inline-block;\n  vertical-align: top;\n  left: 3%;\n  width: 72%; }\n  @media only screen and (max-width: 992px) {\n    .category-banners {\n      display: block;\n      width: 100%;\n      min-height: auto;\n      left: 0; } }\n  .category-banners img {\n    width: 100%;\n    height: auto; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/accessories/accessories.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AccessoriesComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_animations__ = __webpack_require__("../../../animations/@angular/animations.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_products_products_service__ = __webpack_require__("../../../../../src/app/services/products/products.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_underscore__ = __webpack_require__("../../../../underscore/underscore.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_underscore___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_underscore__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var AccessoriesComponent = (function () {
    function AccessoriesComponent(_service, data) {
        this._service = _service;
        this.data = data;
        this.categories = [];
        this.products = [];
        this.productFlag = 'false';
        this.subProductFlag = 'false';
        this.category_name = '';
        this.subCategory_name = '';
        this.showSubCat = false;
        this.catbanners = false;
        this.animationState = 'inactive';
        this.loading = false;
        this.getProductsList();
    }
    AccessoriesComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.selectedCat = 'Select a Category';
        this.selectedSubCat = 'Select a Sub Category';
        this.data.cart.subscribe(function (cart) { return _this.cart = cart; });
        this.data.currentProduct.subscribe(function (product) { return _this.productInfo = product; });
    };
    AccessoriesComponent.prototype.toggleState = function () {
        this.animationState = this.animationState === 'active' ? 'inactive' : 'active';
    };
    AccessoriesComponent.prototype.addToCart = function ($event) {
        var _this = this;
        var item = $event.target.parentElement.parentElement.parentElement.parentElement.firstChild.nextSibling.childNodes[1].text;
        var product = [];
        this.products.forEach(function (element) {
            if (element.product_name === item) {
                product.push(element);
                _this.data.changCart(product[0]);
            }
        });
    };
    AccessoriesComponent.prototype.backToCat = function () {
        this.products = [];
        this.category_name = '';
        this.subCategory_name = '';
        this.showSubCat = false;
        this.catbanners = true;
    };
    AccessoriesComponent.prototype.viewProduct = function (value) {
        this.data.changeProduct(value);
    };
    AccessoriesComponent.prototype.change = function (value) {
        this.getCatName(value);
    };
    AccessoriesComponent.prototype.changeSub = function (value) {
        this.getSubCatName(value);
    };
    AccessoriesComponent.prototype.listProducts = function (cat) {
        this.catbanners = false;
        this.category_name = cat;
        this.products = [];
        this.subProducts = [];
        this.subCategory_name = '';
        var ml = this.catList;
        var catProductsArr = [];
        var arr = [];
        var flag = false;
        for (var i = 0; i < ml.length; i++) {
            if (ml[i].cat_name === cat) {
                catProductsArr.push(ml[i]);
            }
        }
        var products = catProductsArr;
        var prodList = (function (a) {
            for (var i = products.length; i--;) {
                if (products[i].sub_cat_name) {
                    flag = true;
                    a.push(products[i].sub_cat_name);
                }
                else {
                    flag = false;
                    a.push(products[i]);
                }
            }
            return a;
        })([]);
        var uniqEs6 = function (arrArg) {
            return arrArg.filter(function (elem, pos, arr) {
                return arr.indexOf(elem) === pos;
            });
        };
        if (!flag) {
            this.showSubCat = false;
            this.products = uniqEs6(prodList).reverse();
            this.toggleState();
        }
        else {
            this.showSubCat = true;
            this.subProducts = uniqEs6(prodList).reverse();
        }
    };
    AccessoriesComponent.prototype.listSubProducts = function (sub) {
        this.subCategory_name = sub;
        var prodObj = {
            sub: this.subCategory_name,
            cat: this.category_name
        };
        var ml = this.catList;
        var subProductsArr = [];
        for (var i = 0; i < ml.length; i++) {
            if (ml[i].sub_cat_name === prodObj.sub && ml[i].cat_name === prodObj.cat) {
                subProductsArr.push(ml[i]);
            }
        }
        subProductsArr.reverse();
        var products = subProductsArr;
        this.products = [];
        for (var i = products.length; i--;) {
            this.products.push(products[i]);
        }
        this.toggleState();
    };
    AccessoriesComponent.prototype.getSubCatName = function (value) {
        if (typeof value === 'string') {
            this.listSubProducts(value);
        }
        else {
            var sub = value;
            this.listSubProducts(sub);
        }
    };
    AccessoriesComponent.prototype.getCatName = function (value) {
        if (typeof value === 'string') {
            this.listProducts(value);
        }
        else {
            var cat = value;
            this.listProducts(cat);
        }
    };
    AccessoriesComponent.prototype.hasChanged = function (val) {
        this.backToCat();
        var masterNumber = this.masterProductNum(val);
        this.getCatgegories(masterNumber);
    };
    AccessoriesComponent.prototype.masterProductNum = function (mNumber) {
        this.masterProduct = mNumber;
        return mNumber;
    };
    AccessoriesComponent.prototype.getProductsWithAccessories = function (masterList) {
        var productArray = masterList;
        var productsWithAccessories = [];
        productArray.forEach(function (product) {
            if (product.related_products.length > 0) {
                var obj = {
                    id: product.id,
                    name: product.product_name
                };
                productsWithAccessories.push(obj);
            }
        });
        productsWithAccessories = __WEBPACK_IMPORTED_MODULE_4_underscore__["sortBy"](productsWithAccessories, 'name');
        return productsWithAccessories;
    };
    AccessoriesComponent.prototype.MasterAccessories = function (response, masterProduct) {
        var productArray = response;
        var selectedProduct;
        productArray.forEach(function (product) {
            if (product.id === masterProduct) {
                selectedProduct = product;
            }
        });
        var masterAccessories = selectedProduct.related_products;
        this.masterName = selectedProduct.product_name;
        var AccessorieProducts = [];
        for (var i = 0; i < productArray.length; i++) {
            if (masterAccessories.indexOf(productArray[i].id) !== -1) {
                AccessorieProducts.push(productArray[i]);
            }
        }
        this.catList = AccessorieProducts;
        return AccessorieProducts;
    };
    AccessoriesComponent.prototype.getProductsList = function () {
        var _this = this;
        this.loading = true;
        this._service.getCatgegories()
            .subscribe(function (response) {
            var masterList = _this.getProductsWithAccessories(response);
            _this.powers = masterList;
            _this.masterProductList = response;
            _this.getCatgegories(_this.masterProduct);
            _this.loading = false;
            _this.catbanners = true;
        });
    };
    AccessoriesComponent.prototype.getCatgegories = function (masterProduct) {
        var response = this.masterProductList;
        var masterList = this.getProductsWithAccessories(response);
        this.powers = masterList;
        if (masterProduct === undefined) {
            masterProduct = masterList[0].id;
        }
        this.masterProductArray = __WEBPACK_IMPORTED_MODULE_4_underscore__["findWhere"](this.masterProductList, { id: masterProduct });
        this.masterProductBanner = '../../' + this.masterProductArray.images[0].banner;
        console.log('Master product2', __WEBPACK_IMPORTED_MODULE_4_underscore__["findWhere"](this.masterProductList, { id: masterProduct }));
        var ml = this.MasterAccessories(response, masterProduct);
        var catList = (function (a) {
            for (var i = ml.length; i--;) {
                if (a.indexOf(ml[i].cat_name) < 0) {
                    a.push(ml[i].cat_name);
                }
            }
            return a;
        })([]);
        this.categories = catList;
        this.categories.splice(0, 0, 'Select a Category');
    };
    AccessoriesComponent.prototype.hasSub = function () {
        if (this.subProducts) {
            var bln = this.subProducts.length < 1 || undefined ? false : true;
            return bln;
        }
        else {
            return false;
        }
    };
    AccessoriesComponent.prototype.hasProducts = function () {
        if (this.products) {
            var bln = this.products.length < 1 || undefined ? false : true;
            return bln;
        }
        else {
            return false;
        }
    };
    return AccessoriesComponent;
}());
AccessoriesComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'accessories',
        template: __webpack_require__("../../../../../src/app/product-accessories-finder/accessories/accessories.component.html"),
        styles: [__webpack_require__("../../../../../src/app/product-accessories-finder/accessories/accessories.component.scss")],
        animations: [
            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["l" /* trigger */])('fade', [
                Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["k" /* transition */])('* <=> *', [
                    Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["g" /* query */])(':enter', Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 0 }), { optional: true }),
                    Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["g" /* query */])(':enter', Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["i" /* stagger */])('100ms', [
                        Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["e" /* animate */])('1s ease-in', Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["f" /* keyframes */])([
                            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 0, transform: 'translateY(-15%)', offset: 0 }),
                            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: .5, transform: 'translateY(15px)', offset: 0.3 }),
                            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 1, transform: 'translateY(0)', offset: 1.0 }),
                        ]))
                    ]), { optional: true })
                ])
            ]),
            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["l" /* trigger */])('productsIntro', [
                Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["k" /* transition */])('* <=> *', [
                    Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["g" /* query */])(':enter', Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 0 }), { optional: true }),
                    Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["g" /* query */])(':enter', Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["i" /* stagger */])('50ms', [
                        Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["e" /* animate */])('800ms ease-in', Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["f" /* keyframes */])([
                            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 0, transform: 'translateY(-10%)', offset: 0 }),
                            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: .5, transform: 'translateY(10px)', offset: 0.3 }),
                            Object(__WEBPACK_IMPORTED_MODULE_1__angular_animations__["j" /* style */])({ opacity: 1, transform: 'translateY(0)', offset: 1.0 }),
                        ]))
                    ]), { optional: true })
                ])
            ])
        ]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__services_products_products_service__["a" /* ProductsService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__services_products_products_service__["a" /* ProductsService */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_3__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3__services_data_data_service__["a" /* DataService */]) === "function" && _b || Object])
], AccessoriesComponent);

var _a, _b;
//# sourceMappingURL=accessories.component.js.map

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/cart/cart.component.html":
/***/ (function(module, exports) {

module.exports = "<div id=\"shopping-cart-module\" [ngClass]=\"{ 'show-cart': cartOpen, 'hide-cat': !cartOpen }\">\n  <h2>SHOPPING CART: <span>{{count}}</span></h2>\n  <button class=\"btn btn-solid\">PROCEED TO CHECKOUT</button>\n  <div class=\"messages\">{{cartMessage}}</div>\n  <div *ngIf=\"products.length > 0\">\n    <ul class=\"items\">\n      <li *ngFor=\"let cartItem of products\">\n        <div class=\"item\" data-id=\"{{cartItem.id}}\">\n\t\t\t\t\t\t<div class=\"col-md-4\"><img src=\"{{cartItem.images[0].thumbnail}}\" alt=\"{{cartItem.product_name}}\"></div>\n\t\t\t\t\t\t<div class=\"product-col\" class=\"col-md-8\">\n\t\t\t\t\t\t\t<a href=\"#\" class=\"product-name\">{{cartItem.product_name}}</a>\n\t\t\t\t\t\t\t<span class=\"sku\">SKU: {{cartItem.sku}}, </span><span>QTY: {{cartItem.quantity}}</span>\n              <div class=\"price\">Price: ${{cartItem.price}}</div>\n              <i class=\"glyphicon glyphicon-remove\" (click)=\"removeItem(cartItem.id)\"></i>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n      </li>\n    </ul>\n  </div>\n  <div class=\"bottom-info\">\n    <button class=\"continue-shopping\" (click)=\"closeCart()\">Minimize Cart<i class=\"glyphicon glyphicon-chevron-left\"></i></button>\n    <h4>Cart Subtotal: <span>{{cartTotal | currency:'USD':true:'3.2-2'}}</span></h4>\n  </div>\n  <div class=\"close-cart\" (click)=\"closeCart()\">\n    <i class=\"glyphicon glyphicon-remove\"></i>\n  </div>\n</div>"

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/cart/cart.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/cart/cart.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CartComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__ = __webpack_require__("../../../../../src/app/services/data/data.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var CartComponent = (function () {
    function CartComponent(data) {
        this.data = data;
        this.itemsInCart = [];
        this.cartOpen = false;
        this.numberOfItemsInCart = 0;
        this.cartMessage = '';
        this.count = 0;
        this.products = [];
    }
    CartComponent.prototype.closeCart = function () {
        this.cartOpen = false;
    };
    CartComponent.prototype.removeItem = function (id) {
        var arr = this.products;
        for (var i = arr.length - 1; i >= 0; i--) {
            if (arr[i].id === id) {
                arr[i].quantity = 1;
                arr.splice(i, 1);
            }
        }
        this.count = this.getCartTotalProducts(this.products);
        this.cartTotal = this.totalCartAmount(this.products);
    };
    CartComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.data.cart.subscribe(function (cart) {
            if (cart.length < 1) {
                return;
            }
            else {
                var value = cart;
                _this.count += 1;
                if (_this.itemsInCart.indexOf(value) !== -1) {
                    value.quantity += 1;
                    _this.cartOpen = true;
                }
                else {
                    _this.itemsInCart.push(value);
                    _this.cartOpen = true;
                }
                _this.products = _this.itemsInCart;
                _this.numberOfItemsInCart = _this.getCartTotalProducts(_this.products);
                cart = [];
            }
            _this.cartTotal = _this.totalCartAmount(_this.products);
        });
    };
    CartComponent.prototype.getCartTotalProducts = function (arr) {
        var count = 0;
        arr.forEach(function (product) {
            count += product.quantity;
        });
        (count === 0) ? this.cartMessage = 'There are no items in your cart.' : this.cartMessage = '';
        return count;
    };
    CartComponent.prototype.totalCartAmount = function (arr) {
        var count = 0;
        arr.forEach(function (product) {
            count += (product.price * product.quantity);
        });
        return count;
    };
    return CartComponent;
}());
CartComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'cart',
        template: __webpack_require__("../../../../../src/app/product-accessories-finder/cart/cart.component.html"),
        styles: [__webpack_require__("../../../../../src/app/product-accessories-finder/cart/cart.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_data_data_service__["a" /* DataService */]) === "function" && _a || Object])
], CartComponent);

var _a;
//# sourceMappingURL=cart.component.js.map

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/master-input/master-input.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/master-input/master-input.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MasterInputComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_products_products_service__ = __webpack_require__("../../../../../src/app/services/products/products.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var MasterInputComponent = (function () {
    function MasterInputComponent(_service) {
        this._service = _service;
        this.hasChanged = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]();
    }
    MasterInputComponent.prototype.ngOnChanges = function (changes) {
        if (changes['powers']) {
            if (this.powers !== undefined) {
                this.selectedValue = this.powers[0].id;
            }
        }
    };
    MasterInputComponent.prototype.change = function (value) {
        this.hasChanged.emit(value);
    };
    MasterInputComponent.prototype.ngOnInit = function () {
    };
    return MasterInputComponent;
}());
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Output */])(),
    __metadata("design:type", typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_core__["x" /* EventEmitter */]) === "function" && _a || Object)
], MasterInputComponent.prototype, "hasChanged", void 0);
__decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["F" /* Input */])(),
    __metadata("design:type", Array)
], MasterInputComponent.prototype, "powers", void 0);
MasterInputComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'master-input',
        template: "\n    <form>\n      <div class=\"form-group\">\n        <label for=\"Master-Products\">Select Product</label>\n        <select [ngModel]=\"selectedValue\" name=\"pow.name\" (ngModelChange)=\"change($event)\" class=\"form-control\" id=\"Master-Products\">\n          <option *ngFor=\"let pow of powers\" [ngValue]=\"pow.id\">{{pow.name}}</option>\n        </select>\n      </div>\n    </form>\n  ",
        styles: [__webpack_require__("../../../../../src/app/product-accessories-finder/master-input/master-input.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__services_products_products_service__["a" /* ProductsService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_products_products_service__["a" /* ProductsService */]) === "function" && _b || Object])
], MasterInputComponent);

var _a, _b;
//# sourceMappingURL=master-input.component.js.map

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/product-page/product-page.component.html":
/***/ (function(module, exports) {

module.exports = "<accessories></accessories>"

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/product-page/product-page.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/product-accessories-finder/product-page/product-page.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProductPageComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var ProductPageComponent = (function () {
    function ProductPageComponent() {
    }
    ProductPageComponent.prototype.ngOnInit = function () {
    };
    return ProductPageComponent;
}());
ProductPageComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'product-page',
        template: __webpack_require__("../../../../../src/app/product-accessories-finder/product-page/product-page.component.html"),
        styles: [__webpack_require__("../../../../../src/app/product-accessories-finder/product-page/product-page.component.scss")]
    }),
    __metadata("design:paramtypes", [])
], ProductPageComponent);

//# sourceMappingURL=product-page.component.js.map

/***/ }),

/***/ "../../../../../src/app/services/data/data.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DataService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__ = __webpack_require__("../../../../rxjs/BehaviorSubject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var DataService = (function () {
    function DataService() {
        this.shoppingCart = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.cart = this.shoppingCart.asObservable();
        this.productSource = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.currentProduct = this.productSource.asObservable();
        this.showFilter = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.showfilter = this.showFilter.asObservable();
        this.productList = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.prodList = this.productList.asObservable();
        this.filterState = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.fState = this.filterState.asObservable();
    }
    DataService.prototype.changCart = function (cart) {
        this.shoppingCart.next(cart);
    };
    DataService.prototype.changeProduct = function (product) {
        this.productSource.next(product);
    };
    DataService.prototype.hideFilter = function (value) {
        this.showFilter.next(value);
    };
    DataService.prototype.productListChanged = function (list) {
        console.log('service_change-productList: ', list);
        this.productList.next(list);
    };
    DataService.prototype.filterStateChanged = function (list) {
        this.filterState.next(list);
    };
    return DataService;
}());
DataService = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["C" /* Injectable */])(),
    __metadata("design:paramtypes", [])
], DataService);

//# sourceMappingURL=data.service.js.map

/***/ }),

/***/ "../../../../../src/app/services/gprobe-ui/gprobe-ui.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GprobeUiService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_add_operator_map__ = __webpack_require__("../../../../rxjs/add/operator/map.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_add_operator_map___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_rxjs_add_operator_map__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_underscore__ = __webpack_require__("../../../../underscore/underscore.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_underscore___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_underscore__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var GprobeUiService = (function () {
    function GprobeUiService(http) {
        this.http = http;
        this.url = '/api/products';
        this.gpByDiameter = [];
        this.checking = function (productsArr, names) {
            var masterProds = [];
            // Master List of Accessories related to the Master Product
            var nameList = [];
            names.forEach(function (product) {
                nameList.push(product.product_name);
            });
            productsArr.forEach(function (product) {
                nameList.forEach(function (name) {
                    if (product.product_name === name) {
                        masterProds.push(product);
                    }
                });
            });
            // find all accessories under this product that have a cat name of Generator Probe and retrun
            var relatedProducts = [];
            masterProds.forEach(function (product) {
                var obj = {
                    product: product.product_name,
                    related: product.related_products
                };
                relatedProducts.push(obj);
            });
            var gp = (function (a) {
                productsArr.forEach(function (product) {
                    var prodId = [];
                    prodId.push(product.id);
                    relatedProducts.forEach(function (arr) {
                        if (__WEBPACK_IMPORTED_MODULE_3_underscore__["intersection"](prodId, arr.related).length > 0) {
                            if (product.cat_name === 'Generator Probes') {
                                var allArr = [];
                                var obj = {
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
            var masterArray = this.process(gp);
            return masterArray;
        };
        this.process = function (objects) {
            var results = [];
            objects.forEach(function (object) {
                var result = results.find(function (x) { return x.master === object.master; });
                if (result) {
                    object.related.forEach(function (item) {
                        if (!result.related.find(function (x) { return x === item; })) {
                            result.related.push(item);
                        }
                    });
                }
                else {
                    results.push(object);
                }
            });
            return results;
        };
    }
    GprobeUiService.prototype.getGeneratprobes = function (cat) {
        var _this = this;
        return this.http
            .get(this.url)
            .map(function (response) {
            var productArray = response.json();
            // Find all products with category name Generator Probes
            var generators = (function (a) {
                for (var i = productArray.length; i--;) {
                    if (productArray[i].cat_name === 'Generator Probes') {
                        a.push(productArray[i].id);
                    }
                }
                return a;
            })([]);
            _this.generatorProbesList = generators;
            var ml2 = _this.generatorProbesList;
            var catList = (function (a) {
                for (var i = productArray.length; i--;) {
                    var arrs = __WEBPACK_IMPORTED_MODULE_3_underscore__["intersection"](productArray[i].related_products, ml2);
                    if (__WEBPACK_IMPORTED_MODULE_3_underscore__["intersection"](productArray[i].related_products, ml2).length > 0) {
                        a.push(productArray[i]);
                    }
                }
                return a;
            })([]);
            var gpArray = _this.checking(productArray, catList);
            return gpArray;
        });
    };
    GprobeUiService.prototype.getMasterproducts = function () {
        var _this = this;
        return this.http
            .get(this.url)
            .map(function (response) {
            var productArray = response.json();
            // Master List of Accessories related to the Master Product
            var ml2 = _this.generatorProbesList;
            var catList = (function (a) {
                for (var i = productArray.length; i--;) {
                    var arrs = __WEBPACK_IMPORTED_MODULE_3_underscore__["intersection"](productArray[i].related_products, ml2);
                    if (__WEBPACK_IMPORTED_MODULE_3_underscore__["intersection"](productArray[i].related_products, ml2).length > 0) {
                        a.push(productArray[i]);
                    }
                }
                return a;
            })([]);
            return catList;
        });
    };
    GprobeUiService.prototype.getProductsByName = function (name) {
        var _this = this;
        return this.http
            .get(this.url)
            .map(function (response) {
            var productArray = response.json();
            var masterProd;
            // Master List of Accessories related to the Master Product
            productArray.forEach(function (product) {
                if (product.product_name === name) {
                    masterProd = product;
                }
            });
            // find all accessories under this product that have a cat name of Generator Probe and retrun
            var relatedProducts = masterProd.related_products;
            var gp = (function (a) {
                productArray.forEach(function (product) {
                    var prodId = [];
                    prodId.push(product.id);
                    if (__WEBPACK_IMPORTED_MODULE_3_underscore__["intersection"](prodId, relatedProducts).length > 0) {
                        a.push(product);
                    }
                });
                return a;
            })([]);
            // filter through array and create new string array of all diameter lengths and retrun
            var diameterList = (function (a) {
                for (var i = gp.length; i--;) {
                    if (gp[i].cat_name === 'Generator Probes') {
                        if (a.indexOf(gp[i].diameter) < 0) {
                            a.push(gp[i].diameter);
                        }
                    }
                }
                return a;
            })([]);
            _this.gpByDiameter = (function (a) {
                for (var i = gp.length; i--;) {
                    if (gp[i].cat_name === 'Generator Probes') {
                        if (a.indexOf(gp[i].diameter) < 0) {
                            a.push(gp[i]);
                        }
                    }
                }
                return a;
            })([]);
            console.log('service gpByDiameter: ', _this.gpByDiameter);
            return diameterList;
        });
    };
    GprobeUiService.prototype.getCurrentGpList = function () {
        var _this = this;
        return this.http
            .get(this.url)
            .map(function (response) {
            return _this.productsByFilteredDiameter;
        });
    };
    GprobeUiService.prototype.getProductsByDiameter = function (diameter) {
        var _this = this;
        var gp = this.gpByDiameter;
        return this.http
            .get(this.url)
            .map(function (response) {
            var prodsByDiameter = (function (a) {
                for (var i = gp.length; i--;) {
                    if (gp[i].diameter === diameter) {
                        a.push(gp[i]);
                    }
                }
                return a;
            })([]);
            _this.productsByFilteredDiameter = prodsByDiameter;
            return prodsByDiameter;
        });
    };
    return GprobeUiService;
}());
GprobeUiService = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["C" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_http__["b" /* Http */]) === "function" && _a || Object])
], GprobeUiService);

var _a;
//# sourceMappingURL=gprobe-ui.service.js.map

/***/ }),

/***/ "../../../../../src/app/services/products/products.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProductsService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_BehaviorSubject__ = __webpack_require__("../../../../rxjs/BehaviorSubject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_BehaviorSubject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_rxjs_BehaviorSubject__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map__ = __webpack_require__("../../../../rxjs/add/operator/map.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var ProductsService = (function () {
    function ProductsService(http) {
        this.http = http;
        this.url = '/api/products';
        this.productCategoriesList = new __WEBPACK_IMPORTED_MODULE_2_rxjs_BehaviorSubject__["BehaviorSubject"]([]);
        this.currentList = this.productCategoriesList.asObservable();
    }
    ProductsService.prototype.changeCatList = function (categoriesList) {
        this.productCategoriesList.next(categoriesList);
    };
    ProductsService.prototype.getCatgegories = function () {
        var headers = new __WEBPACK_IMPORTED_MODULE_0__angular_http__["a" /* Headers */]();
        headers.append('Access-Control-Allow-Origin', '*');
        var opts = new __WEBPACK_IMPORTED_MODULE_0__angular_http__["d" /* RequestOptions */]();
        opts.headers = headers;
        var url = "" + this.url;
        return this.http
            .get('/api/products', opts)
            .map(function (response) {
            var productArray = response.json();
            // Master List of Accessories related to the Master Product
            return productArray;
        });
    };
    return ProductsService;
}());
ProductsService = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["C" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_http__["b" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_0__angular_http__["b" /* Http */]) === "function" && _a || Object])
], ProductsService);

var _a;
//# sourceMappingURL=products.service.js.map

/***/ }),

/***/ "../../../../../src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
// The file contents for the current environment will overwrite these during build.
var environment = {
    production: false
};
//# sourceMappingURL=environment.js.map

/***/ }),

/***/ "../../../../../src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("../../../platform-browser-dynamic/@angular/platform-browser-dynamic.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("../../../../../src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("../../../../../src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_23" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */])
    .catch(function (err) { return console.log(err); });
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("../../../../../src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map