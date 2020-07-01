import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomTooltipModule } from './@shared/directives/custom-tooltip/custom-tooltip.module';

@NgModule( {
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CustomTooltipModule,

  ],
  providers: [
    { provide: 'WINDOW', useFactory: getWindow },
  ],
  bootstrap: [ AppComponent ]
} )
export class AppModule {
}

export function getWindow() {
  return (typeof window !== 'undefined') ? window : null;
}
