import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { DataService } from './../../services/data/data.service';
import { GprobeUiService } from '../../services/gprobe-ui/gprobe-ui.service';

@Component({
  selector: 'gp-ui',
  templateUrl: './gp-ui.component.html',
  styleUrls: ['./gp-ui.component.scss']
})
export class GpUiComponent implements OnInit {
  showFilters: boolean = false;
  categories: any[];
  masterName: string;
  gpProducts: any[];
  catName: string = 'Generator Probes';
  inputProducts: any[];
  selectedValue: any;
  cart: any[];
  testing: any[];
  public loading = false;

  constructor(private _service: GprobeUiService, private data: DataService) {
    this.getProducts();
  }

  @Output() hasChanged: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    this.data.showfilter.subscribe(value => this.showFilters = value);
  }

  getProducts() {
    this.loading = true;
    this._service.getGeneratprobes('Generator Probes')
      .subscribe(response => {
        this.testing = response;
        this.loading = false;
      });
  }

  change(value) {
    this.hasChanged.emit(value);
    this.data.hideFilter(false);
  }

  selectObject(categories) {
    const newArr: any[] = [];
    let count = 0;
    categories.forEach(product => {
      const obj = {
        id: count += 1,
        name: product.product_name
      };
      newArr.push(product.product_name);
    });
    return newArr;
  }

}
