import { Component } from '@angular/core';
import { GprobeUiService } from '../../services/gprobe-ui/gprobe-ui.service';

@Component({
  selector: 'gp-ui',
  templateUrl: './gp-ui.component.html',
  styleUrls: ['./gp-ui.component.scss']
})
export class GpUiComponent {
  private catName: string = 'Generator Probes';
  public masterProductList: any[];
  public loading = false;

  constructor(private _service: GprobeUiService) {
    this.getProducts();
  }

  getProducts() {
    this.loading = true;
    this._service.getGeneratprobes(this.catName)
      .subscribe(response => {
        this.masterProductList = response;
        this.loading = false;
      });
  }

}
