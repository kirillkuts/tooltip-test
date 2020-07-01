import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTooltipDirective } from './custom-tooltip.directive';



@NgModule( {
  declarations: [ CustomTooltipDirective ],
  exports: [
    CustomTooltipDirective
  ],
  imports: [
    CommonModule
  ]
})
export class CustomTooltipModule { }
